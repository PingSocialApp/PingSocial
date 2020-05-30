import {Component, OnInit} from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import {environment} from '../../../environments/environment';
import {Link} from '../../tab3/tab3.page';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFireStorage} from '@angular/fire/storage';
import * as firebase from 'firebase';
import {ModalController, ToastController} from '@ionic/angular';

@Component({
    selector: 'app-eventcreator',
    templateUrl: './eventcreator.page.html',
    styleUrls: ['./eventcreator.page.scss'],
    providers: [AngularFirestore, AngularFireAuth, AngularFireStorage]
})
export class EventcreatorPage implements OnInit {
    map: mapboxgl.Map;
    currentUserRef: AngularFirestoreDocument;
    currentUser: any;
    geocoder: any;
    startTime: string;
    endTime: string;
    eventName: string;
    location: Array<any>;
    isPublic: boolean;
    links: Array<Link>;
    eventDes: string;
    eventType: string;

    constructor(private modalController: ModalController, private toastController: ToastController, private firestore: AngularFirestore, private auth: AngularFireAuth, private storage: AngularFireStorage) {
        mapboxgl.accessToken = environment.mapbox.accessToken;
        this.currentUserRef = this.firestore.collection('users').doc(this.auth.auth.currentUser.uid);
        this.links = [];
        this.firestore.collection('links', ref => ref.where('userSent', '==', this.currentUserRef.ref)).snapshotChanges().subscribe(res => {
            this.links = [];
            this.renderLink(res);
        });
        this.isPublic = false;
    }

    ngOnInit() {
    }

    ngAfterViewInit() {
        this.buildMap();
        (document.querySelector('#choosermap .mapboxgl-canvas') as HTMLElement).style.width = '100%';
        (document.querySelector('#choosermap .mapboxgl-canvas') as HTMLElement).style.height = 'auto';
        this.startTime = new Date().toISOString();
    }

    buildMap() {
        this.map = new mapboxgl.Map({
            container: 'choosermap',
            style: 'mapbox://styles/sreegrandhe/ckak2ig0j0u9v1ipcgyh9916y',
            zoom: 2,
        });
        // @ts-ignore
        this.geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl
        });
        document.getElementById('geocoder-container').appendChild(this.geocoder.onAdd(this.map));
        this.geocoder.on('result', (res) => {
            this.location = res.result.geometry.coordinates;
        });
    }

    async renderLink(linkData: Array<any>) {
        await Promise.all(linkData.map(link => {
            const linkeD = link.payload.doc.data();
            linkeD.userRec.get().then(USdata => {
                let imgUrl = '';
                if (USdata.data().profilepic.startsWith('h')) {
                    imgUrl = USdata.data().profilepic;
                } else {
                    this.storage.storage.refFromURL(USdata.data().profilepic).getDownloadURL().then(url => {
                        imgUrl = url;
                    });
                }
                const linkObject: Link = {
                    id: USdata.id,
                    img: imgUrl,
                    name: USdata.data().name,
                    bio: USdata.data().bio
                };
                this.links.push(linkObject);
            });
        }));
    }

    createEvent() {
        let toggle = (document.getElementsByTagName('ion-checkbox') as unknown as Array<any>);
        if(toggle.length > 15){
            this.presentToast('Whoops! You can only have 15 people');
        }else if (this.eventName === '' || this.startTime === '' || this.endTime === '' || this.eventDes === '' || this.eventType === '' || typeof this.location === 'undefined') {
            this.presentToast('Whoops you have an empty entry!');
        } else {
            this.firestore.collection('events').add({
                name: this.eventName,
                creator: this.currentUserRef.ref,
                startTime: this.startTime,
                endTime: this.endTime,
                description: this.eventDes,
                location: this.location,
                type: this.eventType,
                isPrivate: this.isPublic
            }).then(newEvent => {
                if (this.isPublic) {
                    let userArray = [];
                    for (let element of toggle) {
                        if (element.checked) {
                            userArray.push(this.firestore.collection('users').doc(element.id).ref);
                        }
                    }
                    newEvent.update({
                        members: userArray
                    });
                }
                this.presentToast('Event Created!');
                this.closeModal();
            });
        }
    }

    closeModal() {
        // using the injected ModalController this page
        // can "dismiss" itself and optionally pass back data
        this.modalController.dismiss({
            dismissed: true
        });
    }

    async presentToast(message: string) {
        const toast = await this.toastController.create({
            message: message,
            duration: 2000
        });
        toast.present();
    }

    handleInput(event) {
        const query = event.target.value.toLowerCase();
        for (let i = 0; i < document.getElementsByTagName('ion-item').length; i++) {
            const shouldShow = document.getElementsByTagName('h2')[i].textContent.toLowerCase().indexOf(query) > -1;
            document.getElementsByTagName('ion-item')[i].style.display = shouldShow ? 'block' : 'none';
        }
    }

}
