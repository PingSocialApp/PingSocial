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
import * as firebase from 'firebase/app';
import {merge} from 'rxjs';
import {AngularFireDatabase} from '@angular/fire/database';


@Component({
    selector: 'app-tab2',
    templateUrl: 'tab2.page.html',
    styleUrls: ['tab2.page.scss'],
    providers: [AngularFireDatabase, FirestoreService, AngularFireAuth, Geolocation, AngularFireStorage, AngularFirestore]
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
    queryDate: boolean;

    constructor(private rtdb: AngularFireDatabase, private firestore: AngularFirestore, private fs: FirestoreService, private storage: AngularFireStorage, private geo: Geolocation, private modalController: ModalController) {
        mapboxgl.accessToken = environment.mapbox.accessToken;
        const watch = this.geo.watchPosition({
            enableHighAccuracy: true,
        });

        // references
        const uid = fs.currentUserId;
        const locationRef = this.rtdb.database.ref('/location/' + uid);
        this.updateStatus(uid, locationRef);

        // get user name
        var uName = '';
        fs.currentUserRef.ref.get().then(doc => {
            uName = doc.data().name;
        });

        // check if current user is online or not
        var status = '';
        locationRef.on('value', snapshot => {
            if (snapshot.val().isOnline) {
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

        this.firestore.collection('pings', ref => ref.where('userRec', '==', this.fs.currentUserRef.ref)
            .orderBy('timeStamp', 'desc')).snapshotChanges().subscribe(res => {
            if (res !== null) {
                this.unreadPings = res.length;
            }
        });
        this.showFilter = false;
    }

    // puts marker on the map with user info
    renderUser(marker, lng, lat, status, location, uName) {
        try {
            marker.setLngLat([lng, lat])
                .setPopup(new mapboxgl.Popup({offset: 32})
                .setHTML('<h6 style="text-align: center">' + uName + '</h6><p>' + status + ' in ' + location + '</p>'))
                .addTo(this.map);
        } catch (e) {
            //window.location.reload();
            console.log(e.message);
        }
    }

    getLocationAndRender(o: { marker: any }, lng, lat, status, uName) {
        // fetch location with mapbox api
        var tempReqStr = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + lng + ',' + lat + '.json?access_token=' + mapboxgl.accessToken;
        fetch(tempReqStr).then(response => response.json())
            .then(data => {
                var locat = '';
                data.features.forEach(feat => {
                    if(feat.place_type == 'place' || feat.place_type[1] == 'place') {
                        // get city of location
                        locat = feat.place_name;
                        const firstInd = locat.indexOf(',');
                        const lastInd = locat.lastIndexOf(',');
                        if(firstInd != lastInd) {
                            locat = locat.substring(0, locat.lastIndexOf(','));
                        }
                    }
                });
                this.renderUser(o.marker, lng, lat, status, locat, uName);
            });
    }

    renderLinks() {
        this.firestore.collection('links', ref => ref.where('userRec', '==', this.fs.currentUserRef.ref)).snapshotChanges().subscribe(res => {
            this.allMarkers.forEach(tempMarker => {
                this.map.removeLayer(tempMarker);
            });
            res.forEach(doc => {
                let otherId, otherRef, oName, oMark;
                doc.payload.doc.ref.get().then(otherSnap => {
                    // get other user id and reference
                    if (otherSnap.exists) {
                        otherId = otherSnap.data().userSent.Pc.path.segments[6];
                        otherRef = this.rtdb.database.ref('/location/' + otherId);
                    }
                }).then(() => {
                    this.firestore.doc('/users/' + otherId).get().subscribe(oUserDoc => {
                        if (oUserDoc.exists) {
                            // get other user name and profile pic
                            oName = oUserDoc.data().name;
                            let oUrl = oUserDoc.data().profilepic;

                            // create marker and style it
                            let el = this.createMarker();
                            el.style.width = '50px';
                            el.style.height = '50px';
                            if (oUrl.startsWith('h')) {
                                el.style.backgroundImage = 'url(' + oUrl + ')';
                            } else {
                                this.storage.storage.refFromURL(oUrl).getDownloadURL().then(url => {
                                    el.style.backgroundImage = 'url(' + url + ')';
                                });
                            }
                            oMark = new mapboxgl.Marker(el);
                        }
                        otherRef.on('value', snapshot => {
                            if (snapshot.val()) {
                                // get other users longitude, latitude, and lastOnline vals
                                let longi = snapshot.val().longitude;
                                let latid = snapshot.val().latitude;
                                let lastOn = snapshot.val().lastOnline;

                                // only way ik so far to get current time
                                let currTime = 0;
                                let timeRef = this.rtdb.database.ref('currentTime/');
                                timeRef.set({time: firebase.database.ServerValue.TIMESTAMP});
                                timeRef.once('value').then(timeSnap => {
                                    if (timeSnap.val()) {
                                        currTime = timeSnap.val().time;
                                    }
                                }).then(() => {
                                    // update status and render
                                    const oStat = this.convertTime(currTime - lastOn);
                                    this.getLocationAndRender({marker: oMark}, longi, latid, oStat, oName);
                                });
                            }
                        });
                    });
                });
            });
        });
    }

    convertTime(t) {
        if (t >= 86_400_000) {
            // days
            return Math.floor(t / 86_400_000) + 'd ago';
        } else if (t >= 3_600_000) {
            // hours
            return Math.floor(t / 3_600_000) + 'h ago';
        } else if (t >= 60_000) {
            // mins
            return Math.floor(t / 60_000) + 'm ago';
        } else if (t >= 1000) {
            // secs
            return Math.floor(t / 1000) + 's ago';
        } else {
            return 'Just Now';
        }
    }

    updateStatus(uid, lRef) {
        // variables used to set values in database
        const offline = {
            id: uid,
            isOnline: false,
            lastOnline: firebase.database.ServerValue.TIMESTAMP,
        };
        const online = {
            id: uid,
            isOnline: true,
            lastOnline: firebase.database.ServerValue.TIMESTAMP,
        };

        // checks connection and sets values accordingly
        this.rtdb.database.ref('.info/connected').on('value', function (snapshot) {
            if (snapshot.val()) {
                lRef.onDisconnect().update(offline).then(() => {
                    lRef.update(online);
                });
            }
            ;
        });
    }

    presentEvents() {
        const query1 = this.firestore.collection('events', ref => ref.where('isPrivate', '==', false));
        const query2 = this.firestore.collection('events', ref => ref.where('creator', '==', this.fs.currentUserRef.ref));
        const query3 = this.firestore.collection('events', ref => ref.where('members', 'array-contains', this.fs.currentUserRef.ref));

        const events = merge(query1.snapshotChanges(), query2.snapshotChanges(), query3.snapshotChanges());

        events.subscribe(eventData => {
            eventData.map((event) => {
                this.renderEvent(event.payload.doc);
            });
        });
    }

    renderEvent(doc) {
        let eventInfo = doc.data();
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
            el.style.backgroundImage = 'url(\'../assets/undraw_hangout_out_h9ud.svg\')';
        } else {
            el.style.backgroundImage = 'url(\'../assets/undraw_business_deal_cpi9.svg\')';
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
                const data = ref.payload.data();
                if (data.profilepic.startsWith('h')) {
                    el.style.backgroundImage = 'url(' + data.profilepic + ')';
                } else {
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
