import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {Calendar} from '@ionic-native/calendar/ngx';
import {AlertController, ModalController, ToastController} from '@ionic/angular';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFireStorage} from '@angular/fire/storage';
import {GeoFireClient} from 'geofirex';
import {environment} from '../../../../environments/environment';
import * as geofirex from 'geofirex';
import * as firebase from 'firebase';
import * as mapboxgl from 'mapbox-gl';
import {firestore} from 'firebase';
import {first, map, mergeMap} from 'rxjs/operators';
import {forkJoin, Observable} from 'rxjs';

@Component({
    selector: 'app-eventcreator',
    templateUrl: './eventcreator.component.html',
    styleUrls: ['./eventcreator.component.scss'],
    providers:[]
})
export class EventcreatorComponent implements OnInit, AfterViewInit {
    map: mapboxgl.Map;
    currentUserRef: AngularFirestoreDocument;
    currentUser: any;
    geocoder: any;
    eventName: string;
    location: Array<any>;
    isPublic: boolean;
    links: Observable<any>;
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
                private afs: AngularFirestore, private auth: AngularFireAuth, private storage: AngularFireStorage) {
        mapboxgl.accessToken = environment.mapbox.accessToken;
        this.currentUserRef = this.afs.collection('users').doc(this.auth.auth.currentUser.uid);
        this.isPublic = false;
        this.geo = geofirex.init(firebase);
    }


    ngOnInit() {
        this.editMode = this.eventID !== '';
        (document.getElementById('startTime') as HTMLInputElement).value = new Date().toISOString();
        (document.getElementById('endTime') as HTMLInputElement).value = new Date().toISOString();
        if (this.editMode) {
           this.renderEditMode();
        } else {
            this.renderNewMode();
        }
    }

    renderNewMode(){
        this.isCreator = true;
        this.currentUserRef.ref.get().then((userRef) => {
            this.eventCreatorName = userRef.get('name');
        });
        this.links = this.currentUserRef.collection('links', ref => ref.where('pendingRequest', '==', false)).get()
            .pipe(mergeMap(querySnap => forkJoin(
                querySnap.docs.map(doc => doc.get('otherUser').get())
            )), map((val: any) => {
                return val.map(userData => {
                    return {
                        id: userData.id,
                        img: this.getImage(userData.get('profilepic')),
                        name: userData.get('name'),
                        bio: userData.get('bio'),
                        checked: false
                    };
                });
            }));
    }

    renderEditMode(){
           this.afs.collection('events').doc(this.eventID).get().pipe(first()).subscribe((ref) => {
            const data = ref.data();
            (document.getElementById('startTime') as HTMLInputElement).value = data.startTime.toDate().toISOString();
            // TODO Add one hour
            (document.getElementById('endTime') as HTMLInputElement).value = data.endTime.toDate().toISOString();
            this.eventName = data.name;
            this.eventCreator = data.creator.id;
            data.creator.get().then((userRef) => {
                this.eventCreatorName = userRef.get('name');
            });
            this.eventDes = data.description;
            this.isPublic = data.isPrivate;
            this.eventType = data.type;
            this.location = [data.position.geopoint.longitude, data.position.geopoint.latitude];
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
            this.links = this.currentUserRef.collection('links', ref => ref.where('pendingRequest', '==', false)).get()
                .pipe(mergeMap(querySnap => forkJoin(
                    querySnap.docs.map(doc => doc.get('otherUser').get())
                )), map((val: any) => {
                    return val.map(userData => {
                        return {
                            id: userData.id,
                            img: this.getImage(userData.get('profilepic')),
                            name: userData.get('name'),
                            bio: userData.get('bio'),
                            checked: this.isChecked(userData.id)
                        };
                    });
                }));
        });
    }

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

    isChecked(id: string){
        for(const member of this.members) {
            if(member.id === id) {
                return true;
            }
        }
        return false;
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
                            userArray.push(this.afs.collection('users').doc(element.id).ref);
                        }
                    }
                    if (userArray.length > 15) {
                        this.presentToast('Whoops! You have more than 15 people');
                    } else {
                        this.afs.collection('events').doc(this.eventID).update({
                            members: userArray
                        });
                    }
                } else {
                    this.afs.collection('events').doc(this.eventID).update({
                        members: firestore.FieldValue.delete()
                    });
                }
                const position = this.geo.point(this.location[1],this.location[0]);
                this.afs.collection('events').doc(this.eventID).update({
                    name: this.eventName,
                    creator: this.currentUserRef.ref,
                    startTime: firebase.firestore.Timestamp.fromDate(new Date((document.getElementById('startTime') as HTMLInputElement).value)),
                    endTime: firebase.firestore.Timestamp.fromDate(new Date((document.getElementById('endTime') as HTMLInputElement).value)),
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
                this.afs.collection('events').add({
                    name: this.eventName,
                    position,
                    creator: this.currentUserRef.ref,
                    startTime: firebase.firestore.Timestamp.fromDate(new Date((document.getElementById('startTime') as HTMLInputElement).value)),
                    endTime: firebase.firestore.Timestamp.fromDate(new Date((document.getElementById('endTime') as HTMLInputElement).value)),
                    description: this.eventDes,
                    type: this.eventType,
                    isPrivate: this.isPublic
                }).then(newEvent => {
                    if (this.isPublic) {
                        const userArray = [];
                        for (const element of toggle) {
                            if (element.checked) {
                                userArray.push(this.afs.collection('users').doc(element.id).ref);
                            }
                        }
                        if (userArray.length > 15) {
                            this.presentToast('Whoops! You have more than 15 people');
                        } else {
                            newEvent.update({
                                members: userArray
                            }).then(() => {
                                this.presentToast('Event Created!');
                                this.closeModal();
                            })
                        }
                    }else{
                        this.presentToast('Event Created!');
                        this.closeModal();
                    }
                });
            }
        }
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
                        this.afs.collection('events').doc(this.eventID).delete();
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

    closeModal() {
        // using the injected ModalController this page
        // can "dismiss" itself and optionally pass back data
        this.modalController.dismiss({
            dismissed: true
        });
    }

}
