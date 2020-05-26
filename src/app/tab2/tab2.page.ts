import {Component} from '@angular/core';
import {IonRouterOutlet, ModalController} from '@ionic/angular';
import {SettingsPage} from '../settings/settings.page';
import {EventcreatorPage} from './eventcreator/eventcreator.page';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {Router} from '@angular/router';
import {environment} from '../../environments/environment';
import * as mapboxgl from 'mapbox-gl';
import {Geolocation} from '@ionic-native/geolocation/ngx';
import {AngularFireStorage} from '@angular/fire/storage';

@Component({
    selector: 'app-tab2',
    templateUrl: 'tab2.page.html',
    styleUrls: ['tab2.page.scss'],
    providers: [AngularFireAuth, Geolocation, AngularFireStorage]
})

export class Tab2Page {
    userId: string;
    unreadPings: number;
    map: mapboxgl.Map;
    currentLocationMarker: any;

    // tslint:disable-next-line:max-line-length

    constructor(private storage: AngularFireStorage, private geo: Geolocation, private routerOutlet: IonRouterOutlet, public modalController: ModalController, private router: Router, private auth: AngularFireAuth, private firestore: AngularFirestore) {
        this.userId = this.auth.auth.currentUser.uid;
        mapboxgl.accessToken = environment.mapbox.accessToken;
        const el = document.createElement('div');
        el.style.width = '50px';
        el.style.height = '50px';
        el.style.backgroundSize = 'cover';
        el.style.borderRadius = '50%';
        el.style.border = 'solid 3px #8FDEE6';
        el.style.boxShadow = '0px 0px 25px #000000';
        this.firestore.collection('users').doc(this.userId).snapshotChanges().subscribe(ref => {
            // @ts-ignore
            let data = ref.payload.data();
            // @ts-ignore
            this.unreadPings = data.unreadPings.length;
            // @ts-ignore
            if (data.profilepic.startsWith('h')) {
                // @ts-ignore
                el.style.backgroundImage = 'url(' + data.profilepic + ')';
                // @ts-ignore
                console.log(data.profilepic);
            } else {
                // @ts-ignore
                this.storage.storage.refFromURL(data.profilepic).getDownloadURL().then(url => {
                    el.style.backgroundImage = 'url(' + url + ')';
                });
            }
        });
        let watch = this.geo.watchPosition({
            enableHighAccuracy: true
        });
        this.currentLocationMarker = new mapboxgl.Marker(el);
        // el.classList.add('marker');
        watch.subscribe((data) => {
            this.currentLocationMarker.setLngLat([data.coords.longitude, data.coords.latitude]).addTo(this.map);
            this.map.flyTo({
                center: [data.coords.longitude, data.coords.latitude],
                essential: true
            });
            // data can be a set of coordinates, or an error (if an error occurred).
            // data.coords.latitude
            // data.coords.longitude
        });
    }

    ngAfterViewInit() {
        this.geo.getCurrentPosition().then((resp) => {
            this.buildMap(resp.coords);
            // resp.coords.latitude
            // resp.coords.longitude
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

    async presentSettingsModal() {
        const modal = await this.modalController.create({
            component: SettingsPage
        });
        return await modal.present();
    }

    async presentEventCreatorModal() {
        const modal = await this.modalController.create({
            component: EventcreatorPage,
        });
        return await modal.present();
    }

}
