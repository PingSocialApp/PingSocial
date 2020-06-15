import {Component} from '@angular/core';
import {IonSearchbar, ModalController} from '@ionic/angular';
import {EventcreatorPage} from './eventcreator/eventcreator.page';
import {AngularFireAuth} from '@angular/fire/auth';
import {environment} from '../../environments/environment';
import * as mapboxgl from 'mapbox-gl';
import {Geolocation} from '@ionic-native/geolocation/ngx';
import {AngularFireStorage} from '@angular/fire/storage';
import {FirestoreService} from '../firestore.service';
import {AngularFirestore, AngularFirestoreDocument, QueryDocumentSnapshot} from '@angular/fire/firestore';
import {QrcodePage} from './qrcode/qrcode.page';
import * as firebase from "firebase/app";
import { CONTEXT_NAME } from '@angular/compiler/src/render3/view/util';


@Component({
    selector: 'app-tab2',
    templateUrl: 'tab2.page.html',
    styleUrls: ['tab2.page.scss'],
    providers: [FirestoreService, AngularFireAuth, Geolocation, AngularFireStorage, AngularFirestore]
})

export class Tab2Page {
    unreadPings: number;
    map: mapboxgl.Map;
    currentLocationMarker: any;
    showFilter: boolean;
    allMarkers: any[] = [];

    // tslint:disable-next-line:max-line-length
    queryStatus: string = 'All';
    queryType: string = 'All';
    queryDate: Boolean;

    constructor(private firestore: AngularFirestore, private fs: FirestoreService, private storage: AngularFireStorage, private geo: Geolocation, private modalController: ModalController) {
        mapboxgl.accessToken = environment.mapbox.accessToken;
        let watch = this.geo.watchPosition({
            enableHighAccuracy: true,
        });

        // references
        var uid = firebase.auth().currentUser.uid;
        var locationRef = firebase.database().ref('/location/' + uid);
        this.updateStatus(uid, locationRef);

        // get user name
        var uName = '';
        firebase.firestore().doc('/users/' + uid).get().then(doc => {
            if(doc.exists) {
                uName = doc.data().name;
            }
        });

        // check if current user is online or not
        var status = 'Offline';
        locationRef.on('value', snapshot => {
            if(snapshot.val().isOnline) {
                status = 'Just Now';
            }
        });

        // update current user location
        watch.subscribe((data) => {
            var lng = data.coords.longitude;
            var lat = data.coords.latitude;

            // update location
            locationRef.update({
                longitude: lng,
                latitude: lat,
            });

            // use api to get location
            this.getLocationAndRender({marker: this.currentLocationMarker}, lng, lat, status, uName);

            // just to fly to current user on map
            this.map.flyTo({
                center: [lng, lat],
                essential: true
            });
            // data can be a set of coordinates, or an error (if an error occurred).
            // data.coords.latitude
            // data.coords.longitude
        });

        this.renderLinks();

        this.firestore.collection('pings', ref => ref.where('userRec', '==', this.fs.currentUserRef.ref).orderBy('timeStamp', 'desc')).snapshotChanges().subscribe(res => {
            if (res !== null) {
                this.unreadPings = res.length;
            }
        });
        this.showFilter = false;
    }

    // puts marker on the map with user info
    renderUser(marker, lng, lat, status, location, uName) {
        marker.setLngLat([lng, lat])
            .setPopup(new mapboxgl.Popup({ offset: 20 })
            .setHTML('<h6>' + uName + '</h6><p>' + status + '</p><p>' + location + '</p>'))
            .addTo(this.map);
    }

    renderLinks() {
        this.firestore.collection('links', ref => ref.where('userRec', '==', this.fs.currentUserRef.ref)).snapshotChanges().subscribe(res => {
            this.allMarkers.forEach(tempMarker => {
                this.map.removeLayer(tempMarker);
            });
            res.forEach(doc => {
                // get other user id to get their doc
                doc.payload.doc.ref.get().then(otherSnap => {
                    if(otherSnap.exists) {
                        var otherId = otherSnap.data().userSent.Pc.path.segments[6];
                        var otherRef = firebase.database().ref('/location/' + otherId);
                        // get doc of user
                        firebase.firestore().doc('/users/' + otherId).get().then(oUserDoc => {
                            if(oUserDoc.exists) {
                                var oName = oUserDoc.data().name;
                                var oUrl = oUserDoc.data().profilepic;
                                // get location and status information
                                otherRef.on('value', snapshot => {
                                    if(snapshot.val()) {
                                        // get all of the other users data
                                        var longi = snapshot.val().longitude;
                                        var latid = snapshot.val().latitude;
                                        var oStat = snapshot.val().isOnline ? 'Just Now' : 'Offline';
                                        // create marker and style it
                                        var el = this.createMarker();
                                        el.style.width = '50px';
                                        el.style.height = '50px';
                                        if (oUrl.startsWith('h')) {
                                            el.style.backgroundImage = 'url(' + oUrl + ')';
                                        } else {
                                            this.storage.storage.refFromURL(oUrl).getDownloadURL().then(url => {
                                                el.style.backgroundImage = 'url(' + url + ')';
                                            });
                                        }
                                        var oMark = new mapboxgl.Marker(el);
                                        this.getLocationAndRender({marker: oMark}, longi, latid, oStat, oName);
                                    }
                                });
                            }
                        });
                    }
                });
            });
        });
    }

    getLocationAndRender(o : {marker: any}, lng, lat, status, uName) {
        console.log(o.marker + ' ' + lng + ' ' + lat + ' ' + status + ' ' + uName);
        var tempReqStr = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + lng + ',' + lat + '.json?access_token=' + mapboxgl.accessToken;
        fetch(tempReqStr).then(response => response.json())
            .then(data => {
                var locat = data.features[0].text;
                this.renderUser(o.marker, lng, lat, status, locat, uName);
            });
    }

    updateStatus(uid, lRef) {
        // variables used to set values in database
        var offline = {
            id: uid,
            uid: 'idk',
            isOnline: false,
            lastOnline: firebase.database.ServerValue.TIMESTAMP,
        };
        var online = {
            id: uid,
            uid: 'idk',
            isOnline: true,
            lastOnline: firebase.database.ServerValue.TIMESTAMP,
        };

        // checks connection and sets values accordingly
        firebase.database().ref('.info/connected').on('value', function(snapshot) {
            if(snapshot.val()) {
                lRef.onDisconnect().update(offline).then(function() {
                    lRef.update(online);
                });
            };
        });
    }

    presentEvents() {
        this.firestore.collection('events', ref => ref.where('isPrivate', '==', false)).snapshotChanges()
            .subscribe(eventData => {
                eventData.map((event) => {
                    this.renderEvent(event.payload.doc.data());
                });
            });
        this.firestore.collection('events', ref => ref.where('creator', '==', this.fs.currentUserRef.ref)).snapshotChanges()
            .subscribe(eventData => {
                eventData.map((event) => {
                    this.renderEvent(event.payload.doc.data());
                });
            });
        this.firestore.collection('events', ref => ref.where('members', 'array-contains', this.fs.currentUserRef.ref)).snapshotChanges()
            .subscribe(eventData => {
                eventData.map((event) => {
                    this.renderEvent(event.payload.doc.data());
                });
            });
    }

    renderEvent(doc) {
        let eventInfo = doc;
        // @ts-ignore
        let el = this.createMarker();
        el.setAttribute('data-name', eventInfo.name);
        el.setAttribute('data-private', eventInfo.isPrivate);
        el.setAttribute('data-type', eventInfo.type);
        el.setAttribute('data-start', eventInfo.startTime);

        let endTime = new Date(eventInfo.endTime);
        let currentTime = new Date();

        if (currentTime > endTime) {
            return;
        }

        el.setAttribute('data-time', eventInfo.startTime);
        el.id = doc.id;
        if (!!document.querySelector('#' + el.id)) {
            document.querySelector('#' + el.id).remove();
        }
        // @ts-ignore
        if (eventInfo.type === 'Party') {
            el.style.backgroundImage = 'url(\'../assets/undraw_having_fun_iais.svg\')';
        } else if (eventInfo.type === 'Hangout') {
            // TODO Add Photos per event
            el.style.backgroundImage = '';
        } else {
            el.style.backgroundImage = '';
        }
        let marker = new mapboxgl.Marker(el);
        // @ts-ignore
        marker.setLngLat([eventInfo.location[0], eventInfo.location[1]]).addTo(this.map);
    }

    createMarker() {
        let el = document.createElement('div');
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.backgroundSize = 'cover';
        el.style.borderRadius = '50%';
        el.style.border = 'solid 3px #8FDEE6';
        el.style.boxShadow = '0px 0px 25px #000000';
        return el;
    }

    presentCurrentLocation() {
        let el = this.createMarker();
        el.style.width = '50px';
        el.style.height = '50px';
        this.fs.userData.subscribe(ref => {
            if (ref !== null) {
                // @ts-ignore
                let data = ref.payload.data();
                // @ts-ignore
                if (data.profilepic.startsWith('h')) {
                    // @ts-ignore
                    el.style.backgroundImage = 'url(' + data.profilepic + ')';
                } else {
                    // @ts-ignore
                    this.storage.storage.refFromURL(data.profilepic).getDownloadURL().then(url => {
                        el.style.backgroundImage = 'url(' + url + ')';
                    });
                }
            }
        });
        el.id = 'currentLocation';
        this.currentLocationMarker = new mapboxgl.Marker(el);
    }

    ngAfterViewInit() {
        this.geo.getCurrentPosition().then((resp) => {
            this.buildMap(resp.coords);
            // resp.coords.latitude
            // resp.coords.longitude
        }).then(() => {
            this.presentCurrentLocation();
            this.presentEvents();
        }).catch((error) => {
            console.log('Error getting location', error);
        });
    }

    buildMap(coords: Coordinates) {
        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/sreegrandhe/ckak2ig0j0u9v1ipcgyh9916y',
            zoom: 18,
            center: [coords.longitude, coords.latitude]
        });
    }

    async presentEventCreatorModal() {
        const modal = await this.modalController.create({
            component: EventcreatorPage
        });
        return await modal.present();
    }

    async presentFilter() {
        this.showFilter = !this.showFilter;
        if (!this.showFilter) {
            let elements = document.getElementsByClassName('mapboxgl-marker');
            for (let i = 0; i < elements.length; i++) {
                (elements[i] as HTMLElement).style.display = 'block';
            }
        }
    }

    filterMarkers() {
        let elements = document.getElementsByClassName('mapboxgl-marker');
        for (let i = 0; i < elements.length; i++) {
            (elements[i] as HTMLElement).style.display = 'block';
            if (elements[i].id === 'currentLocation') {
                continue;
            }
            let elementStatus = elements[i].getAttribute('data-private');
            let elementType = elements[i].getAttribute('data-type');
            let elementTime = new Date(elements[i].getAttribute('data-time'));
            let currentDate = new Date();

            if (this.queryDate && !(elementTime.getFullYear() === currentDate.getFullYear() && elementTime.getMonth() === currentDate.getMonth() && elementTime.getDate() === currentDate.getDate())) {
                (elements[i] as HTMLElement).style.display = 'none';
                continue;
            }

            if (this.queryStatus !== 'All') {
                elementStatus = elementStatus === 'false' ? 'Public' : ' Private';
            } else {
                elementStatus = 'All';
            }

            if (elementType !== this.queryType && this.queryType !== 'All' || this.queryStatus !== elementStatus) {
                (elements[i] as HTMLElement).style.display = 'none';
                continue;
            }

            (document.getElementById('searchbar') as unknown as IonSearchbar).getInputElement().then((input) => {
                const shouldShow = elements[i].getAttribute('data-name').toLowerCase().indexOf(input.value.toLowerCase()) > -1;
                !shouldShow ? (elements[i] as HTMLElement).style.display = 'none' : null;
            });
        }
    }

    async presentQRModal() {
        const modal = await this.modalController.create({
            component: QrcodePage
        });
        return await modal.present();
    }
}
