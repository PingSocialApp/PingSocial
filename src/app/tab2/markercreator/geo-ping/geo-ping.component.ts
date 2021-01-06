import {AfterViewInit, Component, OnInit} from '@angular/core';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {AngularFireStorage} from '@angular/fire/storage';
import {AngularFireAuth} from '@angular/fire/auth';
import * as mapboxgl from 'mapbox-gl';
import * as geofirex from 'geofirex';
import {environment} from '../../../../environments/environment';
import {ModalController, ToastController} from '@ionic/angular';
import {GeoFireClient} from 'geofirex';
import {Geolocation} from '@ionic-native/geolocation/ngx';
import * as firebase from 'firebase';

@Component({
    selector: 'app-geo-ping',
    templateUrl: './geo-ping.component.html',
    styleUrls: ['./geo-ping.component.scss'],
    providers: [Geolocation]
})
export class GeoPingComponent implements OnInit, AfterViewInit {
    textAmt: number;
    message: string;
    isPublic: boolean;
    durationString: string;
    showPublic: boolean;
    links: Array<object>;
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

    }

    ngOnInit() {
        this.afs.collection('links', ref => ref.where('userSent', '==', this.currentUserRef.ref)
            .where('pendingRequest', '==', false)).get().subscribe(res => {
            this.links = [];
            this.renderLink(res.docs);
        });
    }

    ngAfterViewInit() {
        this.geolocation.getCurrentPosition().then((resp) => {
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
            this.location = res.result.geometry.coordinates;
        });
    }

    handleInput(event) {
        const query = event.target.value.toLowerCase();
        for (let i = 0; i < document.getElementsByTagName('ion-item').length; i++) {
            const shouldShow = document.getElementsByTagName('h2')[i].textContent.toLowerCase().indexOf(query) > -1;
            document.getElementsByTagName('ion-item')[i].style.display = shouldShow ? 'block' : 'none';
        }
    }

    private renderLink(docs: Array<firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData>>) {
        docs.map(link => {
            link.get('userRec').get().then(USdata => {
                const linkObject = {
                    id: USdata.id,
                    name: USdata.get('name'),
                    bio: USdata.get('bio'),
                    img: '',
                    checked: false
                };

                const profilePic = USdata.get('profilepic');

                if (profilePic.startsWith('h')) {
                    linkObject.img = profilePic;
                } else {
                    this.storage.storage.refFromURL(profilePic).getDownloadURL().then(url => {
                        linkObject.img = url;
                    });
                }
                this.links.push(linkObject);
            });
        });
    }

    showLocation() {
        if(document.getElementById('mapContainer').style.display === 'none'
            || document.getElementById('mapContainer').style.display === ''){
            document.getElementById('mapContainer').style.display = 'inherit';
        }else{
            document.getElementById('mapContainer').style.display = 'none';
        }
        this.showPublic = false;
    }

    setValue($event: any) {
        this.durationString = $event.detail.value;
    }

    togglePublic() {
        this.showPublic = !this.showPublic;
        document.getElementById('mapContainer').style.display = 'none';
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

    sendPing(){
        let duration;
        if(this.durationString === '5 Min'){
            duration = new Date(new Date().getTime() + 5*60000);
        }else if (this.durationString === '1 Hour') {
            duration = new Date(new Date().getTime() + 60*60000);
        }else {
            duration = new Date(new Date().getTime() + 24*60*60000);
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
            if(!this.isPublic){
                const toggle = (document.getElementsByTagName('ion-checkbox') as unknown as Array<any>);
                const userArray = [];
                for (const element of toggle) {
                    if (element.checked) {
                        userArray.push(this.afs.collection('users').doc(element.id).ref);
                    }
                }
                if (userArray.length > 15) {
                    this.presentToast('Whoops! You have more than 15 people');
                } else {
                    val.update({
                        members: userArray
                    }).then(() => {
                        this.presentToast('Ping Made!');
                        this.closeModal();
                    }).catch(err => {
                        this.presentToast(err);
                    });
                }
            }
        }).catch(err => {
            this.presentToast(err);
        });
    }
}
