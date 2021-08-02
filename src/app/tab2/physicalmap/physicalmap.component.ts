import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {ModalController, Platform} from '@ionic/angular';
import {environment} from '../../../environments/environment';
import * as mapboxgl from 'mapbox-gl';
import {Geolocation, Position} from '@capacitor/geolocation'
import {forkJoin, Subscription} from 'rxjs';
import {AngularFireDatabase} from '@angular/fire/database';
import {MarkercreatorPage} from '../markercreator/markercreator.page';
import {RatingPage} from '../../rating/rating.page';
import { MarkersService } from 'src/app/services/markers.service';
import { UsersService } from 'src/app/services/users.service';
import { AuthHandler } from 'src/app/services/authHandler.service';
import { EventsService } from 'src/app/services/events.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
    selector: 'app-physicalmap',
    templateUrl: './physicalmap.component.html',
    styleUrls: ['./physicalmap.component.scss'],
    providers: []
})
export class PhysicalmapComponent implements OnInit, AfterViewInit, OnDestroy {
    showPing: boolean;
    map: mapboxgl.Map;
    currentLocationMarker: any;
    showFilter: boolean;
    allUserMarkers: any;
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
    pingImg: string;
    pingAuthor: string;
    pingDate: string;
    private linksSub: Subscription;
    private markersSub: Subscription;
    showCheckIn: boolean;
    location: any;
    checkedIn: string;

    constructor(private rtdb: AngularFireDatabase, private ms: MarkersService, private us: UsersService, private platform: Platform,
                private modalController: ModalController, public auth: AuthHandler, private es: EventsService,
                private utils: UtilsService) {
        mapboxgl.accessToken = environment.mapbox.accessToken;
    }

    async ngOnInit() {
        this.allUserMarkers = [];
        this.location = [];
        this.showFilter = false;
        this.showEventDetails = false;
        this.showUserDetails = false;
        this.showPing = false;
        this.checkedIn = null;
    }

    ngAfterViewInit() {
        let pos = null;
        Geolocation.getCurrentPosition().then((resp) => {
            this.buildMap(resp.coords);
            this.updateLocation(resp.coords);
            pos = [resp.coords.latitude, resp.coords.longitude];
        }).then(() => {
            this.map.on('load', () => {
                this.presentCurrentLocation();
                this.refreshContent(true);
                Geolocation.watchPosition({
                    enableHighAccuracy: true,
                },(position, err) => {
                    if(this.getDistance(pos[0], pos[1], position.coords.latitude, position.coords.longitude) >= 0.005){
                        this.updateLocation(position.coords);
                    }

                    this.renderCurrent(position);

                    pos = [position.coords.latitude, position.coords.longitude];

                    if(err){
                        console.error(err);
                    }
                });
            });
        }).catch((error) => {
            console.error('Error getting location', error);
        });
    }


    // TODO call on page kill or logout
    // https://blog.devgenius.io/where-ngondestroy-fails-you-54a8c2eca0e0
    ngOnDestroy() {
        this.linksSub.unsubscribe();
        this.markersSub.unsubscribe();
        this.currentLocationMarker.remove();
    }

    refreshContent(reset = false) {
        this.renderLinks(reset);

        const coords = this.map.getCenter();

		// TODO adjust radius
        const sub = forkJoin({
            events: this.ms.getRelevantEvents(coords.lat, coords.lng, this.getRadius(), reset),
            geoPings: this.ms.getRelevantGeoPings(coords.lat, coords.lng, this.getRadius(), reset)
        });
        this.markersSub = sub.subscribe((markersSet:any) => {
            // markersSet.events.data

            // markerSet.geoPings.data

        }, err => console.error(err));
    }

    renderCurrent(pos: Position) {
        // update current user location
            const lng = pos.coords.longitude;
            const lat = pos.coords.latitude;

            this.location = [lng, lat];

            // use api to get location
            this.renderUser(this.currentLocationMarker, lng, lat);
    }

    getRadius(){
        return (78271/(2**this.map.getZoom()))*256;
    }

    renderLinks(reset) {
        const coords = this.map.getCenter();

        this.linksSub = this.ms.getLinks(coords.lat,coords.lng,this.getRadius(),reset).subscribe((res:any) => {
            this.allUserMarkers.forEach(tempMarker => {
                tempMarker.remove();
            });
            res.data.features.forEach(doc => {
                // create marker and style it
                const el = this.createMarker();
                el.style.width = '30px';
                el.style.height = '30px';
                el.style.backgroundImage = 'url(' + doc.profilepic + ')';
                // get other users longitude, latitude, and lastOnline vals
                const longi = doc.geometry[0];
                const latid = doc.geometry[1];
                // const locat = vals.place;

                // const lastOn = vals.lastOnline;
                // const oStat = vals.isOnline ? 'Online' : this.convertTime(Date.now() - lastOn);

                el.id = doc.id;
                const oMark = new mapboxgl.Marker(el);
                this.allUserMarkers.push(oMark);
                el.addEventListener('click', async (e) => {
                    this.showUserDetails = true;
                    this.showEventDetails = false;
                    this.otherUserName = doc.properties.name;
                    // this.otherUserStatus = oStat;
                    // this.otherUserLocation = locat;
                    this.otherUserId = doc.id
                });
                this.renderUser(oMark, longi, latid);
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

    updateLocation(coords) {
        this.us.setUserLocation({
            longitude: coords.longitude,
            latitude: coords.latitude,
        }).subscribe((val: any) => console.log(val.data) ,(err: any) => console.error(err));
    }

    renderPings(doc) {
        const pingInfo = doc;
        const el = this.createMarker();

        el.id = doc.id;
        if (!!document.getElementById(el.id)) {
            document.getElementById(el.id).remove();
        }

        el.addEventListener('click', (e) => {
            this.showEventDetails = false;
            this.showUserDetails = false;
            this.showPing = true;
            this.pingMessage = pingInfo.message;
            // this.pingDate = this.convertTime(Date.now() - pingInfo.timeCreate.toDate());
            this.pingImg = pingInfo.creator.profilepic;
            this.pingAuthor = pingInfo.creator.name;
        });

        el.style.backgroundImage = 'url(\'../assets/chatbubble.svg\')';
        el.className += ' ping-marker';

        const marker = new mapboxgl.Marker(el);
        try {
            marker.setLngLat([pingInfo.position.longitude, pingInfo.position.latitude]).addTo(this.map);
        } catch (e) {
            console.error(e.message);
        }
    }

    renderEvent(doc) {
        const eventInfo = doc;
        const el = this.createMarker();
        el.setAttribute('data-name', eventInfo.name);
        el.setAttribute('data-private', eventInfo.isPrivate);
        el.setAttribute('data-type', eventInfo.type);
        el.setAttribute('data-time', eventInfo.startTime);
        el.id = doc.id;
        if (!!document.getElementById(el.id)) {
            document.getElementById(el.id).remove();
        }
        // @ts-ignore
        if (eventInfo.type === 'party') {
            el.style.backgroundImage = 'url(\'../assets/undraw_having_fun_iais.svg\')';
        } else if (eventInfo.type === 'hangout') {
            el.style.backgroundImage = 'url(\'../assets/undraw_hang_out_h9ud.svg\')';
        } else {
            el.style.backgroundImage = 'url(\'../assets/undraw_business_deal_cpi9.svg\')';
        }
        const startTime = eventInfo.startTime.toDate();
        let minutes = startTime.getMinutes() < 10 ? '0' : '';
        minutes += startTime.getMinutes();

        el.addEventListener('click', (e) => {
            this.showEventDetails = true;
            this.showUserDetails = false;
            this.showPing = false;
            this.currentEventTitle = eventInfo.name;
            this.currentEventDes = eventInfo.type + ' @ ' + startTime.toDateString() + ' ' + startTime.getHours() + ':' + minutes;
            this.currentEventId = el.id;
            this.showCheckIn = this.getDistance(
                eventInfo.position.latitude,
                eventInfo.position.longitude,
                this.location[1],
                this.location[0],
            ) < 0.025 && startTime < new Date();
        });
        const marker = new mapboxgl.Marker(el);
        try {
            marker.setLngLat([eventInfo.position.geopoint.longitude, eventInfo.position.geopoint.latitude]).addTo(this.map);
        } catch (e) {
            console.error(e.message);
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

        this.us.getUserBasic(this.auth.getUID()).subscribe((val:any) => {
            el.style.backgroundImage = 'url(' + val.data.profilepic + ')';
            el.addEventListener('click', (e) => {
                this.showUserDetails = true;
                this.showEventDetails = false;
                this.showPing = false;
                this.otherUserName = val.data.name;
                this.otherUserStatus = 'Online';
                this.otherUserId = 'currentLocation';
                this.otherUserLocation = 'Here';
                this.checkedIn = val.data.checkedIn;
                this.es.checkedInEvent.next(val.data.checkedIn);
            });
            el.id = 'currentLocation';
            this.currentLocationMarker = new mapboxgl.Marker(el);
        })
    }

    private buildMap(coords): void {
        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/sreegrandhe/ckak2ig0j0u9v1ipcgyh9916y?optimize=true',
            zoom: 18,
            minZoom: 10,
            center: [coords.longitude, coords.latitude]
        });
        this.map.on('dragstart', () => {
            this.showEventDetails = false;
            this.showUserDetails = false;
            this.showPing = false;
        });
        this.map.on('dragend', () => {
            this.refreshContent();
        });
    }

    // async presentFilter() {
    //     this.showFilter = !this.showFilter;
    //     if (!this.showFilter) {
    //         const elements = document.getElementsByClassName('mapboxgl-marker');
    //         // tslint:disable-next-line:prefer-for-of
    //         for (let i = 0; i < elements.length; i++) {
    //             (elements[i] as HTMLElement).style.display = 'block';
    //         }
    //     }
    // }

    // filterMarkers() {
    //     const elements = document.getElementsByClassName('mapboxgl-marker');
    //     // tslint:disable-next-line:prefer-for-of
    //     for (let i = 0; i < elements.length; i++) {
    //         (elements[i] as HTMLElement).style.display = 'block';
    //         if (elements[i].id === 'currentLocation') {
    //             continue;
    //         }
    //         let elementStatus = elements[i].getAttribute('data-private');
    //         const elementType = elements[i].getAttribute('data-type');
    //         const elementTime = new Date(elements[i].getAttribute('data-time'));
    //         const currentDate = new Date();

    //         if (this.queryDate && !(elementTime.getFullYear() === currentDate.getFullYear() &&
    //             elementTime.getMonth() === currentDate.getMonth() && elementTime.getDate() === currentDate.getDate())) {
    //             (elements[i] as HTMLElement).style.display = 'none';
    //             continue;
    //         }

    //         if (this.queryLink) {
    //             (elements[i] as HTMLElement).style.display = elements[i].getAttribute('data-link') === 'false' ? 'none' : null;
    //             continue;
    //         }

    //         if (this.queryStatus !== 'All') {
    //             elementStatus = elementStatus === 'false' ? 'Public' : ' Private';
    //         } else {
    //             elementStatus = 'All';
    //         }

    //         if (elementType !== this.queryType && this.queryType !== 'All' || this.queryStatus !== elementStatus) {
    //             (elements[i] as HTMLElement).style.display = 'none';
    //             continue;
    //         }

    //         (document.getElementById('searchbar') as unknown as IonSearchbar).getInputElement().then((input) => {
    //             const shouldShow = elements[i].getAttribute('data-name').toLowerCase().indexOf(input.value.toLowerCase()) > -1;
    //             (elements[i] as HTMLElement).style.display = !shouldShow ? 'none' : (elements[i] as HTMLElement).style.display;
    //         });
    //     }
    // }

    async presentEventCreatorModal(data: string) {
        const modal = await this.modalController.create({
            component: MarkercreatorPage,
            componentProps: {
                eventID: data
            }
        });
        modal.onDidDismiss().then(() => this.refreshContent());
        return await modal.present();
    }

    async checkIn() {
        if (this.checkedIn) {
            if((await this.checkOut()).data.isSuccesful){
                this.es.checkin(this.currentEventId).subscribe((val) => {
                    this.utils.presentToast('Welcome to ' + this.currentEventTitle);
                }, (err) => console.error(err));
            }
        }
    }

    async checkOut() {
        const modal = await this.modalController.create({
            component: RatingPage,
            componentProps: {
                eventID: this.currentEventId,
            }
        });
        await modal.present();
        this.utils.presentToast('Goodbye from ' + this.currentEventTitle);
        return modal.onDidDismiss();
    }

    getDistance(lat1, lon1, lat2, lon2) {
        const earthRadiusKm = 6371;

        const dLat = this.degreesToRadians(lat2-lat1);
        const dLon = this.degreesToRadians(lon2-lon1);

        lat1 = this.degreesToRadians(lat1);
        lat2 = this.degreesToRadians(lat2);

        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return earthRadiusKm * c; // KM
    }

    degreesToRadians(degrees) {
        return degrees * Math.PI / 180;
    }
}
