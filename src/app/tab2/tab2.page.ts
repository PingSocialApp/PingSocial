import {Component, OnInit} from '@angular/core';
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
import {database} from 'firebase/app';
import {merge} from 'rxjs';
import {AngularFireDatabase} from '@angular/fire/database';
import { FCM } from '@ionic-native/fcm/ngx';


@Component({
    selector: 'app-tab2',
    templateUrl: 'tab2.page.html',
    styleUrls: ['tab2.page.scss'],
    providers: [AngularFireDatabase, FirestoreService, AngularFireAuth, Geolocation, AngularFireStorage, AngularFirestore]
})

export class Tab2Page implements OnInit{
    unreadPings: number;
    map: mapboxgl.Map;
    currentLocationMarker: any;
    showFilter: boolean;
    allUserMarkers: any[] = [];
    currentEventTitle: string;
    currentEventDes: string;
    showEventDetails: any;
    queryStatus = 'All';
    queryType = 'All';
    queryDate: boolean;
    currentEventId: string;
    showUserDetails: boolean;

    otherUserName = '';
    otherUserLocation: any;
    otherUserStatus = '';
    otherUserId: string;

    constructor(private rtdb: AngularFireDatabase, private firestore: AngularFirestore, private fs: FirestoreService,
                private storage: AngularFireStorage, private geo: Geolocation, private modalController: ModalController, private fcm: FCM) {
        mapboxgl.accessToken = environment.mapbox.accessToken;
        const watch = this.geo.watchPosition({
            enableHighAccuracy: true,
        });

        // references
        const uid = fs.currentUserId;
        const locationRef = this.rtdb.database.ref('/location/' + uid);
        this.updateStatus(uid, locationRef);

        // check if current user is online or not
        let status = '';
        locationRef.on('value', snapshot => {
            if (snapshot.val().isOnline) {
                status = 'Just Now';
            }
        });

        // update current user location
        watch.subscribe((data) => {
            const lng = data.coords.longitude;
            const lat = data.coords.latitude;

            // update location
            locationRef.update({
                longitude: lng,
                latitude: lat,
            });

            // use api to get location
            this.renderUser({marker: this.currentLocationMarker}, lng, lat);

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
        this.showEventDetails = false;
        this.showUserDetails = false;
    }

    ngOnInit(): void {
        this.fcm.getToken().then(token => {
            console.log(token);
            this.firestore.collection('notifTokens').doc(this.fs.currentUserId).update({
                notifToken: token
            });
        });
    }

    // puts marker on the map with user info
    renderUser(marker, lng, lat) {
        try {
            marker.marker.setLngLat([lng, lat])
                .addTo(this.map);
        } catch (e) {
            console.log(e.message);
        }
    }

    renderLinks() {
        this.firestore.collection('links',
            ref => ref.where('userSent', '==', this.fs.currentUserRef.ref).where('pendingRequest', '==', false)).snapshotChanges().subscribe(res => {
            this.allUserMarkers.forEach(tempMarker => {
                tempMarker.remove();
            });
            res.forEach(doc => {
                // @ts-ignore
                if (!(doc.payload.doc.data().linkPermissions >= 2048)) {
                    return;
                }
                let otherId, otherRef, oName, oMark;
                // @ts-ignore
                otherId = doc.payload.doc.data().userRec.id;
                otherRef = this.rtdb.database.ref('/location/' + otherId);
                // TODO Unsubscribe from all get
                this.firestore.doc('/users/' + otherId).get().subscribe(oUserDoc => {
                    // get other user name and profile pic
                    oName = oUserDoc.data().name;
                    const oUrl = oUserDoc.data().profilepic;

                    // create marker and style it
                    const el = this.createMarker();
                    el.style.width = '50px';
                    el.style.height = '50px';
                    if (oUrl.startsWith('h')) {
                        el.style.backgroundImage = 'url(' + oUrl + ')';
                    } else {
                        this.storage.storage.refFromURL(oUrl).getDownloadURL().then(url => {
                            el.style.backgroundImage = 'url(' + url + ')';
                        });
                    }
                    otherRef.on('value', snapshot => {
                        if (snapshot.val()) {
                            // get other users longitude, latitude, and lastOnline vals
                            const longi = snapshot.val().longitude;
                            const latid = snapshot.val().latitude;
                            const lastOn = snapshot.val().lastOnline;

                            // update status and render
                            const oStat = snapshot.val().isOnline ? 'Online' : this.convertTime(Date.now() - lastOn);
                            el.id = oUserDoc.id;
                            oMark = new mapboxgl.Marker(el);
                            this.allUserMarkers.push(oMark);
                            el.addEventListener('click', async (e) => {
                                this.showUserDetails = true;
                                this.showEventDetails = false;
                                this.otherUserName = oName;
                                this.otherUserStatus = oStat;
                                const tempReqStr = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + longi + ',' + latid + '.json?access_token=' +
                                    mapboxgl.accessToken;
                                fetch(tempReqStr).then(response => response.json())
                                    .then(data => {
                                        let locat = '';
                                        data.features.forEach(feat => {
                                            if (feat.place_type === 'place' || feat.place_type[0] === 'place') {
                                                // get city of location
                                                locat = feat.place_name;
                                                const firstInd = locat.indexOf(',');
                                                const lastInd = locat.lastIndexOf(',');
                                                if (firstInd !== lastInd) {
                                                    locat = locat.substring(0, locat.lastIndexOf(','));
                                                    this.otherUserLocation = locat;
                                                }
                                            }
                                        });
                                    });
                                this.otherUserId = oUserDoc.id
                            });
                            this.renderUser({marker: oMark}, longi, latid);
                        }
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
            lastOnline: database.ServerValue.TIMESTAMP,
        };
        const online = {
            id: uid,
            isOnline: true,
            lastOnline: database.ServerValue.TIMESTAMP,
        };

        // checks connection and sets values accordingly
        this.rtdb.database.ref('.info/connected').on('value', (snapshot) => {
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
        const eventInfo = doc.data();
        // this.allEventMarkers.forEach(tempMarker => {
        //     tempMarker.remove();
        // });
        // @ts-ignore
        const el = this.createMarker();
        el.setAttribute('data-name', eventInfo.name);
        el.setAttribute('data-private', eventInfo.isPrivate);
        el.setAttribute('data-type', eventInfo.type);
        el.setAttribute('data-start', eventInfo.startTime);

        const endTime = new Date(eventInfo.endTime);
        const currentTime = new Date();
        if (currentTime > endTime) {
            return;
        }

        el.setAttribute('data-time', eventInfo.startTime);
        el.id = doc.id;
        if (!!document.querySelector('#' + el.id)) {
            document.querySelector('#' + el.id).remove();
        }
        // @ts-ignore
        if (eventInfo.type === 'party') {
            el.style.backgroundImage = 'url(\'../assets/undraw_having_fun_iais.svg\')';
        } else if (eventInfo.type === 'hangout') {
            el.style.backgroundImage = 'url(\'../assets/undraw_hang_out_h9ud.svg\')';
        } else {
            el.style.backgroundImage = 'url(\'../assets/undraw_business_deal_cpi9.svg\')';
        }
        const startTime = new Date(eventInfo.startTime);
        let minutes = '';
        if (startTime.getMinutes() < 10) {
            minutes = '0' + startTime.getMinutes();
        } else {
            minutes = '' + startTime.getMinutes();
        }
        el.addEventListener('click', (e) => {
            this.showEventDetails = true;
            this.showUserDetails = false;
            this.currentEventTitle = eventInfo.name;
            this.currentEventDes = eventInfo.type + ' @ ' + startTime.toDateString() + ' ' + startTime.getHours() + ':' + minutes;
            this.currentEventId = el.id;
        });
        const marker = new mapboxgl.Marker(el);
        //this.allEventMarkers.push(marker);
        try {
            marker.setLngLat([eventInfo.location[0], eventInfo.location[1]]).addTo(this.map);
        } catch (e) {
            console.log(e.message);
        }
    }

    createMarker() {
        const el = document.createElement('div');
        el.className = 'marker-style';
        return el;
    }

    presentCurrentLocation() {
        const el = this.createMarker();
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
                el.addEventListener('click', (e) => {
                    this.showUserDetails = true;
                    this.showEventDetails = false;
                    this.otherUserName = data.name;
                    this.otherUserStatus = 'Online';
                    this.otherUserId = 'currentLocation';
                    this.otherUserLocation = 'Here';
                });
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
        this.map.on('dragstart', () => {
            this.showEventDetails = false;
            this.showUserDetails = false;
        });
    }

    async presentEventCreatorModal(data: string) {
        const modal = await this.modalController.create({
            component: EventcreatorPage,
            componentProps: {
                eventID: data
            }
        });
        return await modal.present();
    }

    async presentFilter() {
        this.showFilter = !this.showFilter;
        if (!this.showFilter) {
            const elements = document.getElementsByClassName('mapboxgl-marker');
            for (let i = 0; i < elements.length; i++) {
                (elements[i] as HTMLElement).style.display = 'block';
            }
        }
    }

    filterMarkers() {
        const elements = document.getElementsByClassName('mapboxgl-marker');
        for (let i = 0; i < elements.length; i++) {
            (elements[i] as HTMLElement).style.display = 'block';
            if (elements[i].id === 'currentLocation') {
                continue;
            }
            let elementStatus = elements[i].getAttribute('data-private');
            const elementType = elements[i].getAttribute('data-type');
            const elementTime = new Date(elements[i].getAttribute('data-time'));
            const currentDate = new Date();

            if (this.queryDate && !(elementTime.getFullYear() === currentDate.getFullYear() &&
                elementTime.getMonth() === currentDate.getMonth() && elementTime.getDate() === currentDate.getDate())) {
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
