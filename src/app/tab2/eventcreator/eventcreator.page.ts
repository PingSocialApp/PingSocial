import {Component, Input, OnInit} from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import {environment} from '../../../environments/environment';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFireStorage} from '@angular/fire/storage';
import * as firebase from 'firebase';
import {AlertController, ModalController, ToastController} from '@ionic/angular';

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
    links: Array<any>;
    eventDes: string;
    eventType: string;
    private members: Array<any> = [];

    @Input() eventID: string;
    editMode: boolean;
    isCreator: boolean;

    constructor(private alertController: AlertController, private modalController: ModalController, private toastController: ToastController,
                private firestore: AngularFirestore, private auth: AngularFireAuth, private storage: AngularFireStorage) {
        mapboxgl.accessToken = environment.mapbox.accessToken;
        this.currentUserRef = this.firestore.collection('users').doc(this.auth.auth.currentUser.uid);
        this.links = [];
        this.isPublic = false;
    }

    ngOnInit() {
        this.editMode = this.eventID !== '';
    }

    ngAfterViewInit() {
        this.buildMap();
        (document.querySelector('#choosermap .mapboxgl-canvas') as HTMLElement).style.width = '100%';
        (document.querySelector('#choosermap .mapboxgl-canvas') as HTMLElement).style.height = 'auto';
        if (this.editMode) {
            this.firestore.collection('events').doc(this.eventID).get().subscribe((ref) => {
                const data = ref.data();
                this.startTime = data.startTime;
                this.endTime = data.endTime;
                this.eventName = data.name;
                this.eventDes = data.description;
                this.isPublic = data.isPrivate;
                this.eventType = data.type;
                this.location = data.location;
                this.map.flyTo({
                    center: this.location,
                    essential: true
                });
                if(this.isPublic){
                    this.members = data.members;
                }
                this.isCreator = data.creator.id === this.currentUserRef.ref.id;
                new mapboxgl.Marker().setLngLat(this.location).addTo(this.map);
            });
        } else {
            this.isCreator = true;
            this.startTime = new Date().toISOString();
        }
        this.firestore.collection('links', ref => ref.where('userSent', '==', this.currentUserRef.ref)).snapshotChanges().subscribe(res => {
            this.links = [];
            this.renderLink(res);
        });
    }

    buildMap() {
        if (this.editMode) {
            this.map = new mapboxgl.Map({
                container: 'choosermap',
                style: 'mapbox://styles/sreegrandhe/ckak2ig0j0u9v1ipcgyh9916y',
                zoom: 15,
                center: this.location
            });
        } else {
            this.map = new mapboxgl.Map({
                container: 'choosermap',
                style: 'mapbox://styles/sreegrandhe/ckak2ig0j0u9v1ipcgyh9916y',
                zoom: 2,
            });
        }
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
                var val = false;
                this.members.forEach((user) => {
                    if(user.Pc.path.segments[6] === USdata.id){
                        val = true;
                    }
                });
                const linkObject = {
                    id: USdata.id,
                    img: imgUrl,
                    name: USdata.data().name,
                    bio: USdata.data().bio,
                    checked: val
                };
                this.links.push(linkObject);
            });
        }));
    }

    manageEvent() {
        let toggle = (document.getElementsByTagName('ion-checkbox') as unknown as Array<any>);
        if (this.eventName === '' || this.startTime === '' || this.endTime === '' || this.eventDes === '' || this.eventType === ''
            || typeof this.location === 'undefined') {
            this.presentToast('Whoops! You have an empty entry');
        } else {
            if (this.editMode) {
                if (this.isPublic) {
                    const userArray = [];
                    for (let element of toggle) {
                        if (element.checked) {
                            userArray.push(this.firestore.collection('users').doc(element.id).ref);
                        }
                    }
                    if (userArray.length > 15) {
                        this.presentToast('Whoops! You have more than 15 people');
                    } else {
                        this.firestore.collection('events').doc(this.eventID).update({
                            members: userArray
                        });
                    }
                } else {
                    this.firestore.collection('events').doc(this.eventID).update({
                        members: firebase.firestore.FieldValue.delete()
                    });
                }
                this.firestore.collection('events').doc(this.eventID).update({
                    name: this.eventName,
                    creator: this.currentUserRef.ref,
                    startTime: this.startTime,
                    endTime: this.endTime,
                    description: this.eventDes,
                    location: this.location,
                    type: this.eventType,
                    isPrivate: this.isPublic,
                }).then(() => {
                    this.presentToast('Event Created!');
                    this.closeModal();
                });
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
                        const userArray = [];
                        for (let element of toggle) {
                            if (element.checked) {
                                userArray.push(this.firestore.collection('users').doc(element.id).ref);
                            }
                        }
                        if (userArray.length > 15) {
                            this.presentToast('Whoops! You have more than 15 people');
                        } else {
                            newEvent.update({
                                members: userArray
                            });
                        }
                    }
                    this.presentToast('Event Created!');
                    this.closeModal();
                });
            }
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

    async deleteEvent() {
        const alert = await this.alertController.create({
            header: 'Confirm Event Delete',
            message: 'Are you sure you want to delete this event?',
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    cssClass: 'secondary'
                }, {
                    text: 'Delete',
                    handler: () => {
                        this.firestore.collection('events').doc(this.eventID).delete();
                        this.modalController.dismiss();
                    }
                }
            ]
        });

        await alert.present();
    }
}
