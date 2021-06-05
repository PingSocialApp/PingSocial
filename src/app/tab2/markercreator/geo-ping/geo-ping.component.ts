import {AfterViewInit, Component, OnInit} from '@angular/core';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {AngularFireStorage} from '@angular/fire/storage';
import {AngularFireAuth} from '@angular/fire/auth';
import * as mapboxgl from 'mapbox-gl';
import * as geofirex from 'geofirex';
import {environment} from '../../../../environments/environment';
import {ModalController, ToastController} from '@ionic/angular';
import {GeoFireClient} from 'geofirex';
import * as firebase from 'firebase';
import {first, map, mergeMap} from 'rxjs/operators';
import {forkJoin, Observable} from 'rxjs';
import {Geolocation} from '@capacitor/geolocation';
import {LinkSelectorPage} from '../link-selector/link-selector.page';

@Component({
    selector: 'app-geo-ping',
    templateUrl: './geo-ping.component.html',
    styleUrls: ['./geo-ping.component.scss'],
    providers: []
})
export class GeoPingComponent implements OnInit, AfterViewInit {
    textAmt: number;
    message: string;
    isPublic: boolean;
    durationString: string;
    showPublic: boolean;
    links: Array<string>;
    map: mapboxgl.Map;
    geocoder: any;
    geo: GeoFireClient;
    private currentUserRef: AngularFirestoreDocument<unknown>;
    private location: any;
    customAlertOptions: any = {
        header: 'Geo-Ping Duration',
        translucent: true
    };


    constructor(private geolocation: Geolocation, private toastController: ToastController, private afs: AngularFirestore, private storage: AngularFireStorage,
                private auth: AngularFireAuth, private modalController: ModalController) {
        mapboxgl.accessToken = environment.mapbox.accessToken;
        this.textAmt = 0;
        this.showPublic = false;
        this.isPublic = true;
        this.currentUserRef = this.afs.collection('users').doc(this.auth.auth.currentUser.uid);
        this.durationString = '5 Min';
        this.geo = geofirex.init(firebase);
        this.links = [];
    }

    ngOnInit() {
    }

    async getImage(profilePic: string) {
        if (profilePic.startsWith('h')) {
            return profilePic;
        } else {
            return await this.storage.storage.refFromURL(profilePic).getDownloadURL().then(url => {
                return url;
            }).catch((e) => console.log(e));
        }
    }

    ngAfterViewInit() {
        Geolocation.getCurrentPosition().then((resp) => {
            // resp.coords.latitude
            // resp.coords.longitude
            this.location = [resp.coords.latitude, resp.coords.longitude];
            this.buildMap();
            (document.querySelector('#pingmap .mapboxgl-canvas') as HTMLElement).style.width = '100%';
            (document.querySelector('#pingmap .mapboxgl-canvas') as HTMLElement).style.height = 'auto';
        }).catch((error) => {
            console.log('Error getting location', error);
        });
    }

    buildMap() {
        this.map = new mapboxgl.Map({
            container: 'pingmap',
            style: 'mapbox://styles/sreegrandhe/ckak2ig0j0u9v1ipcgyh9916y?optimize=true',
            zoom: 7,
            center: [this.location[1], this.location[0]]
        });
        new mapboxgl.Marker().setLngLat([this.location[1], this.location[0]]).addTo(this.map);
        // @ts-ignore
        this.geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl
        });
        document.getElementById('geocoder-container-geoping').appendChild(this.geocoder.onAdd(this.map));
        this.geocoder.on('result', (res) => {
            this.location = [res.result.geometry.coordinates[1], res.result.geometry.coordinates[0]];
        });
    }

    showLocation() {
        if (document.getElementById('mapContainer').style.display === 'none'
            || document.getElementById('mapContainer').style.display === '') {
            document.getElementById('mapContainer').style.display = 'block';
        } else {
            document.getElementById('mapContainer').style.display = 'none';
        }
        this.showPublic = false;
    }

    setValue($event: any) {
        this.durationString = $event.detail.value;
    }

    togglePublic() {
        this.isPublic = !this.isPublic;
        // document.getElementById('mapContainer').style.display = 'none';
    }

    async showLinks() {
        if (!this.isPublic) {
            const modal = await this.modalController.create({
                component: LinkSelectorPage,
                componentProps: {
                    ids: this.links
                }
            });

            modal.onDidDismiss().then(data => {
                this.links = data.data;
                console.log(this.links);
            });

            return await modal.present();
        }
    }

    async presentToast(m: string) {
        const toast = await this.toastController.create({
            message: m,
            duration: 2000
        });
        await toast.present();
    }

    closeModal() {
        // using the injected ModalController this page
        // can "dismiss" itself and optionally pass back data
        this.modalController.dismiss({
            dismissed: true
        });
    }

    sendPing() {
        let duration;
        if (this.durationString === '5 Min') {
            duration = new Date(new Date().getTime() + 5 * 60000);
        } else if (this.durationString === '1 Hour') {
            duration = new Date(new Date().getTime() + 60 * 60000);
        } else {
            duration = new Date(new Date().getTime() + 24 * 60 * 60000);
        }

        const userArray = [];
        if (!this.isPublic) {
            if (this.links.length > 20) {
                this.presentToast('Whoops! You have more than 20 people');
                return;
            } else if(this.links.length === 0) {
                this.presentToast('Whoops! You didn\'t add anyone');
                return;
            }else {
                this.links.forEach(link => {
                    userArray.push(this.afs.collection('users').doc(link).ref);
                });
            }
        }

        const position = this.geo.point(this.location[0], this.location[1]);
        this.afs.collection('geoping').add({
            userSent: this.currentUserRef.ref,
            message: this.message,
            position,
            isPrivate: !this.isPublic,
            timeCreate: firebase.firestore.FieldValue.serverTimestamp(),
            timeExpire: firebase.firestore.Timestamp.fromDate(duration)
        }).then((val) => {
            if (!this.isPublic) {
                val.update({
                    members: userArray
                }).then(() => {
                    this.presentToast('Ping Made!');
                    this.closeModal();
                }).catch(err => {
                    this.presentToast(err);
                });
            } else {
                this.presentToast('Ping Made!');
                this.closeModal();
            }
        }).catch(err => {
            this.presentToast(err);
        });
    }
}
