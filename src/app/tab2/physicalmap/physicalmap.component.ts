import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {IonSearchbar, ModalController} from '@ionic/angular';
import {AngularFireAuth} from '@angular/fire/auth';
import {environment} from '../../../environments/environment';
import * as mapboxgl from 'mapbox-gl';
import {Geolocation} from '@ionic-native/geolocation/ngx';
import {AngularFireStorage} from '@angular/fire/storage';
import {AngularFirestore} from '@angular/fire/firestore';
import {merge, Subscription} from 'rxjs';
import {AngularFireDatabase} from '@angular/fire/database';
import {MarkercreatorPage} from '../markercreator/markercreator.page';
import {firestore} from 'firebase/app';
import {first} from 'rxjs/operators';

@Component({
    selector: 'app-physicalmap',
    templateUrl: './physicalmap.component.html',
    styleUrls: ['./physicalmap.component.scss'],
})
export class PhysicalmapComponent implements OnInit, AfterViewInit, OnDestroy {
    showPing: boolean;
    currentUserId: string;
    currentUserRef: any;
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
    queryLink: boolean;
    currentEventId: string;
    showUserDetails: boolean;
    otherUserName = '';
    otherUserLocation: any;
    otherUserStatus = '';
    otherUserId: string;

    // puts marker on the map with user info
    pingMessage: string;
    pingImg: any;
    pingAuthor: string;
    pingDate: string;
    private geoSub: Subscription;
    private linksSub: Subscription;
    private eventSub: Subscription;
    private geopingSub: Subscription;
    private cus: Subscription;

    constructor(private rtdb: AngularFireDatabase, private afs: AngularFirestore, private auth: AngularFireAuth,
                private storage: AngularFireStorage, private geo: Geolocation, private modalController: ModalController,) {
        mapboxgl.accessToken = environment.mapbox.accessToken;
        this.currentUserId = this.auth.auth.currentUser.uid;
        this.currentUserRef = this.afs.collection('users').doc(this.currentUserId);
        this.showFilter = false;
        this.showEventDetails = false;
        this.showUserDetails = false;
        this.showPing = false;
    }

    ngOnInit() {

    }

    ngOnDestroy() {
        this.geoSub.unsubscribe();
        this.linksSub.unsubscribe();
        this.eventSub.unsubscribe();
        this.geopingSub.unsubscribe();
        this.cus.unsubscribe();
    }

    renderCurrent() {
        const watch = this.geo.watchPosition({
            enableHighAccuracy: true,
        });


        // update current user location
        this.geoSub = watch.subscribe((data) => {
            const lng = data.coords.longitude;
            const lat = data.coords.latitude;

            const locationRef = this.rtdb.database.ref('/location/' + this.currentUserId);
            this.updateStatus(locationRef);
            this.updateLocation(locationRef, lng, lat);

            // use api to get location
            this.renderUser(this.currentLocationMarker, lng, lat);

            // just to fly to current user on map
            this.map.flyTo({
                center: [lng, lat],
                essential: true
            });
        });
    }

    renderLinks() {
        this.linksSub = this.afs.collectionGroup('links',
            ref => ref.where('otherUser', '==', this.currentUserRef.ref)
                .where('pendingRequest', '==', false).where('linkPermissions', '>=', 2048)).snapshotChanges().subscribe(res => {
            this.allUserMarkers.forEach(tempMarker => {
                tempMarker.remove();
            });
            res.forEach(doc => {
                let otherId, otherRef, oName, oMark;
                // @ts-ignore
                otherId = doc.payload.doc.ref.parent.parent.id;
                // console.log(otherId);
                otherRef = this.rtdb.database.ref('/location/' + otherId);
                this.afs.doc('/users/' + otherId).get().pipe(first()).subscribe(oUserDoc => {
                    // get other user name and profile pic
                    oName = oUserDoc.get('name');
                    const oUrl = oUserDoc.get('profilepic');

                    // create marker and style it
                    const el = this.createMarker();
                    el.style.width = '30px';
                    el.style.height = '30px';
                    if (oUrl.startsWith('h')) {
                        el.style.backgroundImage = 'url(' + oUrl + ')';
                    } else {
                        this.storage.storage.refFromURL(oUrl).getDownloadURL().then(url => {
                            el.style.backgroundImage = 'url(' + url + ')';
                        });
                    }
                    otherRef.on('value', snapshot => {
                        if (snapshot.val()) {
                            const vals = snapshot.val();
                            // get other users longitude, latitude, and lastOnline vals
                            const longi = vals.longitude;
                            const latid = vals.latitude;
                            const locat = vals.place;

                            const lastOn = vals.lastOnline;
                            const oStat = vals.isOnline ? 'Online' : this.convertTime(Date.now() - lastOn);

                            el.id = oUserDoc.id;
                            oMark = new mapboxgl.Marker(el);
                            this.allUserMarkers.push(oMark);
                            el.addEventListener('click', async (e) => {
                                this.showUserDetails = true;
                                this.showEventDetails = false;
                                this.otherUserName = oName;
                                this.otherUserStatus = oStat;
                                this.otherUserLocation = locat;
                                this.otherUserId = oUserDoc.id
                            });
                            this.renderUser(oMark, longi, latid);
                        }
                    });
                });
            });
        });
    }
    renderUser(marker, lng, lat) {
        try {
            marker.setLngLat([lng, lat])
                .addTo(this.map);
        } catch (e) {
            console.log(e.message);
        }
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

    updateLocation(lRef, long, lat) {
        let locat = 'Loading...';
        const reqStr = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + long + ',' + lat + '.json?access_token=' +
            mapboxgl.accessToken;

        // get info from api
        fetch(reqStr).then(response => response.json())
            .then(data => {
                let i = 0;
                let found = false;
                while (i < data.features.length && !found) {
                    const feat = data.features[i];
                    if (feat.place_type[0] === 'poi') {
                        // get just the name of the place, no address
                        locat = feat.text;
                        found = true;
                    } else if (feat.place_type[0] === 'address') {
                        locat = feat.place_name;
                        found = true;
                    }
                    i++;
                }
            }).then(() => {
            // update in database
            lRef.update({
                longitude: long,
                latitude: lat,
                place: locat
            });
        });
    }

    updateStatus(lRef) {
        const offline = {
            isOnline: false,
            lastOnline: Date.now(),
        };
        const online = {
            isOnline: true,
            lastOnline: Date.now(),
        };

        // checks connection and sets values accordingly
        this.rtdb.database.ref('.info/connected').on('value', (snapshot) => {
            if (snapshot.val()) {
                lRef.onDisconnect().update(offline).then(() => {
                    lRef.update(online);
                });
            }
        });
    }

    presentEvents() {
        const nowString = firestore.Timestamp.now();

        const query1 = this.afs.collection('events', ref => ref.where('isPrivate', '==', false)
            .where('endTime','>=',nowString));
        const query2 = this.afs.collection('events', ref => ref.where('creator', '==', this.currentUserRef.ref)
            .where('endTime','>=',nowString));
        const query3 = this.afs.collection('events', ref => ref.where('members', 'array-contains', this.currentUserRef.ref)
            .where('endTime','>=',nowString));


        const events = merge(query1.snapshotChanges(), query2.snapshotChanges(), query3.snapshotChanges());


        this.eventSub = events.subscribe(eventData => {
            console.log(eventData);
            eventData.map((event) => {
                this.renderEvent(event.payload.doc);
            });
        });
    }

    presentGeoPing(){
        const nowString = firestore.Timestamp.now();

        const query1 = this.afs.collection('geoping', ref => ref.where('isPrivate', '==', false)
            .where('timeExpire','>=',nowString));
        const query2 = this.afs.collection('geoping', ref => ref.where('userSent', '==', this.currentUserRef.ref)
            .where('timeExpire','>=',nowString));
        const query3 = this.afs.collection('geoping', ref => ref.where('members', 'array-contains', this.currentUserRef.ref)
            .where('timeExpire','>=',nowString));


        const pings = merge(query1.snapshotChanges(), query2.snapshotChanges(), query3.snapshotChanges());


        this.geopingSub = pings.subscribe(eventData => {
            eventData.map((event) => {
                this.renderPings(event.payload.doc);
            });
        });
    }


    renderPings(doc){
        const pingInfo = doc.data();
        const el = this.createMarker();

        el.id = doc.id;
        if (!!document.querySelector('#' + el.id)) {
            document.querySelector('#' + el.id).remove();
        }

        pingInfo.userSent.get().then(val => {
            el.addEventListener('click', (e) => {
                this.showEventDetails = false;
                this.showUserDetails = false;
                this.showPing = true;
                this.pingMessage = pingInfo.message;
                this.pingDate = this.convertTime(Date.now() - pingInfo.timeCreate.toDate());

                if (val.get('profilepic').startsWith('h')) {
                    this.pingImg = val.get('profilepic');
                } else {
                    this.storage.storage.refFromURL(val.get('profilepic')).getDownloadURL().then(url => {
                        this.pingImg = url;
                    });
                }

                this.pingAuthor = val.get('name');
            });
        });

        el.style.backgroundImage = 'url(\'../assets/chatbubble.svg\')';
        el.className += ' ping-marker';

        const marker = new mapboxgl.Marker(el);
        try {
            marker.setLngLat([pingInfo.position.geopoint.longitude, pingInfo.position.geopoint.latitude]).addTo(this.map);
        } catch (e) {
            console.log(e.message);
        }
    }

    renderEvent(doc) {
        const eventInfo = doc.data();
        const el = this.createMarker();
        el.setAttribute('data-name', eventInfo.name);
        el.setAttribute('data-private', eventInfo.isPrivate);
        el.setAttribute('data-type', eventInfo.type);
        this.currentUserRef.collection('links', ref => ref.where('otherUser', '==', eventInfo.creator)
            .where('pendingRequest', '==', false)).get().pipe(first()).subscribe(val => {
                el.setAttribute('data-link', val.empty ? 'false' : 'true');
        });
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
        let minutes = startTime.getMinutes() < 10 ? '0' : '';
        minutes += startTime.getMinutes();

        el.addEventListener('click', (e) => {
            this.showEventDetails = true;
            this.showUserDetails = false;
            this.showPing = false;
            this.currentEventTitle = eventInfo.name;
            this.currentEventDes = eventInfo.type + ' @ ' + startTime.toDateString() + ' ' + startTime.getHours() + ':' + minutes;
            this.currentEventId = el.id;
        });
        const marker = new mapboxgl.Marker(el);
        try {
            marker.setLngLat([eventInfo.position.geopoint.longitude, eventInfo.position.geopoint.latitude]).addTo(this.map);
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
        el.style.width = '30px';
        el.style.height = '30px';
        this.cus = this.currentUserRef.valueChanges().subscribe(ref => {
            if (ref !== null) {
                if (ref.profilepic.startsWith('h')) {
                    el.style.backgroundImage = 'url(' + ref.profilepic + ')';
                } else {
                    this.storage.storage.refFromURL(ref.profilepic).getDownloadURL().then(url => {
                        el.style.backgroundImage = 'url(' + url + ')';
                    });
                }
                el.addEventListener('click', (e) => {
                    this.showUserDetails = true;
                    this.showEventDetails = false;
                    this.showPing = false;
                    this.otherUserName = ref.name;
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
            this.map.on('load', () => {
                this.renderCurrent();
                this.renderLinks();
                this.presentCurrentLocation();
                this.presentEvents();
                this.presentGeoPing();
            });
        }).catch((error) => {
            console.log('Error getting location', error);
        });
    }

    buildMap(coords: Coordinates) {
        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/sreegrandhe/ckak2ig0j0u9v1ipcgyh9916y?optimize=true',
            zoom: 18,
            center: [coords.longitude, coords.latitude]
        });
        this.map.on('dragstart', () => {
            this.showEventDetails = false;
            this.showUserDetails = false;
            this.showPing = false;
        });
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

            if (this.queryLink) {
                (elements[i] as HTMLElement).style.display = elements[i].getAttribute('data-link') === 'false' ? 'none' : null;
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

    async presentEventCreatorModal(data: string) {
        const modal = await this.modalController.create({
            component: MarkercreatorPage,
            componentProps: {
                eventID: data
            }
        });
        return await modal.present();
    }

}
