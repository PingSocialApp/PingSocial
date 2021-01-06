import {Component, Input, OnInit} from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import * as geofirex from 'geofirex';
import {environment} from '../../../environments/environment';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFireStorage} from '@angular/fire/storage';
import {firestore} from 'firebase/app';
import {AlertController, ModalController, ToastController} from '@ionic/angular';
import {Calendar} from '@ionic-native/calendar/ngx';
import * as firebase from 'firebase';
import {GeoFireClient} from 'geofirex';

@Component({
    selector: 'app-eventcreator',
    templateUrl: './eventcreator.page.html',
    styleUrls: ['./eventcreator.page.scss'],
    providers: [AngularFirestore, AngularFireAuth, AngularFireStorage, Calendar]
})
export class EventcreatorPage implements OnInit {
    map: mapboxgl.Map;
    currentUserRef: AngularFirestoreDocument;
    currentUser: any;
    geocoder: any;
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
    eventCreator: any;
    eventCreatorName: string;
    geo: GeoFireClient;

    constructor(private cal: Calendar, private alertController: AlertController, private modalController: ModalController, private toastController: ToastController,
                private firestore: AngularFirestore, private auth: AngularFireAuth, private storage: AngularFireStorage) {
        mapboxgl.accessToken = environment.mapbox.accessToken;
        this.currentUserRef = this.firestore.collection('users').doc(this.auth.auth.currentUser.uid);
        this.links = [];
        this.isPublic = false;
        this.geo = geofirex.init(firebase);
    }

    // tslint:disable-next-line:use-lifecycle-interface
    ngOnInit() {
        this.editMode = this.eventID !== '';
        (document.getElementById('startTime') as HTMLInputElement).value = new Date().toISOString();
        (document.getElementById('endTime') as HTMLInputElement).value = new Date().toISOString();
        if (this.editMode) {
            this.firestore.collection('events').doc(this.eventID).get().subscribe((ref) => {
                const data = ref.data();
                (document.getElementById('startTime') as HTMLInputElement).value = data.startTime;
                (document.getElementById('endTime') as HTMLInputElement).value = data.endTime;
                this.eventName = data.name;
                this.eventCreator = data.creator.id;
                data.creator.get().then((userRef) => {
                    this.eventCreatorName = userRef.get('name');
                });
                this.eventDes = data.description;
                this.isPublic = data.isPrivate;
                this.eventType = data.type;
                this.location = [data.position.geopoint.longitude,data.position.geopoint.latitude];
                this.map.flyTo({
                    center: this.location,
                    essential: true
                });
                if (this.isPublic) {
                    this.members = data.members;
                }
                this.isCreator = data.creator.id === this.currentUserRef.ref.id;
                new mapboxgl.Marker().setLngLat(this.location).addTo(this.map);
            }, () => {

            }, () => {
                // tslint:disable-next-line:max-line-length
                this.firestore.collection('links', ref => ref.where('userSent', '==', this.currentUserRef.ref)).get().subscribe(res => {
                    console.log(res.docs);
                    this.links = [];
                    this.renderLink(res.docs);
                });
            });
        } else {
            this.isCreator = true;
            this.currentUserRef.ref.get().then((userRef) => {
                this.eventCreatorName = userRef.get('name');
            });
            this.firestore.collection('links', ref => ref.where('userSent', '==', this.currentUserRef.ref)).get().subscribe(res => {
                this.links = [];
                console.log(res.docs);
                this.renderLink(res.docs);
            });
        }
    }

    // ngOnInit() {
    //
    // }

    // tslint:disable-next-line:use-lifecycle-interface
    ngAfterViewInit() {
        this.buildMap();
        (document.querySelector('#choosermap .mapboxgl-canvas') as HTMLElement).style.width = '100%';
        (document.querySelector('#choosermap .mapboxgl-canvas') as HTMLElement).style.height = 'auto';
    }

    buildMap() {
        if (this.editMode) {
            this.map = new mapboxgl.Map({
                container: 'choosermap',
                style: 'mapbox://styles/sreegrandhe/ckak2ig0j0u9v1ipcgyh9916y?optimize=true',
                zoom: 15,
                center: this.location
            });
        } else {
            this.map = new mapboxgl.Map({
                container: 'choosermap',
                style: 'mapbox://styles/sreegrandhe/ckak2ig0j0u9v1ipcgyh9916y?optimize=true',
                zoom: 2,
            });
        }
        // @ts-ignore
        this.geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl
        });
        document.getElementById('geocoder-container').appendChild(this.geocoder.onAdd(this.map));
        this.geocoder.on('result', (res) => {
            this.location = res.result.geometry.coordinates;
        });
    }

    async renderLink(linkData: Array<any>) {
        await Promise.all(linkData.map(link => {
            link.get('userRec').get().then(USdata => {
                const linkObject = {
                    id: USdata.id,
                    name: USdata.get('name'),
                    bio: USdata.get('bio'),
                    img: '',
                    checked: null
                };

                if (USdata.get('profilepic').startsWith('h')) {
                    linkObject.img = USdata.get('profilepic');
                } else {
                    this.storage.storage.refFromURL(USdata.get('profilepic')).getDownloadURL().then(url => {
                        linkObject.img = url;
                    });
                }
                this.members.forEach((user) => {
                    if (user.id === USdata.id) {
                        linkObject.checked = true;
                    } else {
                        linkObject.checked = false;
                    }
                });
                this.links.push(linkObject);
            });
        }));
    }

    manageEvent() {
        const toggle = (document.getElementsByTagName('ion-checkbox') as unknown as Array<any>);
        if (this.eventName === '' || (document.getElementById('startTime') as HTMLInputElement).value === '' || (document.getElementById('endTime') as HTMLInputElement).value === '' || this.eventDes === '' || this.eventType === ''
            || typeof this.location === 'undefined') {
            this.presentToast('Whoops! You have an empty entry');
        } else if (new Date((document.getElementById('startTime') as HTMLInputElement).value) > new Date((document.getElementById('startTime') as HTMLInputElement).value)) {
            this.presentToast('Whoops! Your event ended before it started');
        } else {
            if (this.editMode) {
                if (this.isPublic) {
                    const userArray = [];
                    for (const element of toggle) {
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
                        members: firestore.FieldValue.delete()
                    });
                }
                const position = this.geo.point(this.location[1],this.location[0]);
                this.firestore.collection('events').doc(this.eventID).update({
                    name: this.eventName,
                    creator: this.currentUserRef.ref,
                    startTime: (document.getElementById('startTime') as HTMLInputElement).value,
                    endTime: (document.getElementById('endTime') as HTMLInputElement).value,
                    description: this.eventDes,
                    position,
                    type: this.eventType,
                    isPrivate: this.isPublic,
                }).then(() => {
                    this.presentToast('Event Updated!');
                    this.closeModal();
                });
            } else {
                const position = this.geo.point(this.location[1],this.location[0]);
                this.firestore.collection('events').add({
                    name: this.eventName,
                    position,
                    creator: this.currentUserRef.ref,
                    startTime: (document.getElementById('startTime') as HTMLInputElement).value,
                    endTime: (document.getElementById('endTime') as HTMLInputElement).value,
                    description: this.eventDes,
                    type: this.eventType,
                    isPrivate: this.isPublic
                }).then(newEvent => {
                    if (this.isPublic) {
                        const userArray = [];
                        for (const element of toggle) {
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

    async presentToast(m: string) {
        const toast = await this.toastController.create({
            message: m,
            duration: 2000
        });
        await toast.present();
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

    downloadEvent() {
        const reqStr = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + this.location[0] + ',' + this.location[1] + '.json?access_token=' +
            mapboxgl.accessToken;

        // get info from api
        fetch(reqStr).then(response => response.json())
            .then(data => {
                this.cal.createEventInteractively(this.eventName, data.features[0].place_name, this.eventDes,
                    new Date((document.getElementById('startTime') as HTMLInputElement).value),
                    new Date((document.getElementById('endTime') as HTMLInputElement).value)).then(r => {
                        this.presentToast('Event Downloaded!');
                });
            });
    }
}
