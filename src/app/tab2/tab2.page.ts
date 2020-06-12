import {Component} from '@angular/core';
import {IonSearchbar, ModalController} from '@ionic/angular';
import {EventcreatorPage} from './eventcreator/eventcreator.page';
import {AngularFireAuth} from '@angular/fire/auth';
import {environment} from '../../environments/environment';
import * as mapboxgl from 'mapbox-gl';
import {Geolocation} from '@ionic-native/geolocation/ngx';
import {AngularFireStorage} from '@angular/fire/storage';
import {FirestoreService} from '../firestore.service';
import {AngularFirestore} from '@angular/fire/firestore';
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

        // check if current user is online or not
        var status = 'Offline';
        locationRef.child('isOnline').on('value', function(snapshot) {
            if(snapshot.val()) {
                status = 'Just Now';
            }
        });

        // keep track of place
        var location = 'Texas';

        watch.subscribe((data) => {
            var lng = data.coords.longitude;
            var lat = data.coords.latitude;

            // update location
            locationRef.update({
                longitude: lng,
                latitude: lat,
            });

            var reqStr = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + lng + ',' + lat + '.json?access_token=' + mapboxgl.accessToken;
            fetch(reqStr).then(response => response.json()
                .then(data => {
                    location = data.features[2].text;
                }));

            this.currentLocationMarker
                .setLngLat([lng, lat])
                .setPopup(new mapboxgl.Popup({ offset: 15 }) // add popups
                .setHTML('<h6>You</h6><p>' + status + '</p><p>In ' + location + '</p>'))
                .addTo(this.map);
            this.map.flyTo({
                center: [lng, lat],
                essential: true
            });
            // data can be a set of coordinates, or an error (if an error occurred).
            // data.coords.latitude
            // data.coords.longitude
        });

        this.firestore.collection('pings', ref => ref.where('userRec', '==', this.fs.currentUserRef.ref).orderBy('timeStamp', 'desc')).snapshotChanges().subscribe(res => {
            if (res !== null) {
                this.unreadPings = res.length;
            }
        });
        this.showFilter = false;
    }

    updateStatus(uid, lRef) {

        // variables used to set values in database
        var offline = {
            id: uid,
            uid: lRef.push().key,
            longitude: 0,
            latitude: 0,
            isOnline: false,
            lastOnline: firebase.database.ServerValue.TIMESTAMP,
        };
        var online = {
            id: uid,
            uid: lRef.push().key,
            longitude: 0,
            latitude: 0,
            isOnline: true,
            lastOnline: firebase.database.ServerValue.TIMESTAMP,
        };

        // checks connection and sets values accordingly
        firebase.database().ref('.info/connected').on('value', function(snapshot) {
            if (snapshot.val()) {
                lRef.onDisconnect().set(offline).then(function() {
                    lRef.set(online);
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
