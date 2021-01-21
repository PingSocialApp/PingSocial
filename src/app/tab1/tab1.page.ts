import {Component} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {AngularFireStorage} from '@angular/fire/storage';
import {MarkercreatorPage} from '../tab2/markercreator/markercreator.page';
import {AlertController, ModalController} from '@ionic/angular';
import {firestore} from 'firebase';
import {RequestsProgramService} from '../services/requests-program.service';
import {AngularFireFunctions} from '@angular/fire/functions';
import {RatingPage} from '../rating/rating.page';

@Component({
    selector: 'app-tab1',
    templateUrl: 'tab1.page.html',
    styleUrls: ['tab1.page.scss'],
    providers: [AngularFireStorage, AngularFireFunctions]
})
export class Tab1Page {
    eventName: string;
    eventDes: string;
    eventId: string;
    currentUserId: string;
    attendees: Observable<any>;
    eventCreator: string;
    eventCreatorId: string;

    constructor(private afs: AngularFirestore, private auth: AngularFireAuth, private storage: AngularFireStorage, private modalController: ModalController,
                private alertController: AlertController, private requestService: RequestsProgramService, private functions: AngularFireFunctions) {
        this.currentUserId = this.auth.auth.currentUser.uid;
        this.afs.collection('eventProfile').doc(this.currentUserId).valueChanges().subscribe(val => {
            // @ts-ignore
            if(val.partyAt == null){
                this.eventId = null;
                return;
            }
            // @ts-ignore
            this.eventId = val.partyAt.id;

            this.attendees = this.afs.collection('events').doc(this.eventId).collection('attendeesPublic').snapshotChanges().pipe(map(v=> {
                return v.map(doc => {
                    const data = doc.payload.doc;
                    return {
                        id: data.id,
                        name: data.get('name'),
                        bio: data.get('bio'),
                        img: this.getImage(data.get('profilepic'))
                    }
                })
            }));
            // @ts-ignore
            val.partyAt.get().then(partyDetails => {
                this.eventName = partyDetails.get('name');
                this.eventCreatorId = partyDetails.get('creator').id;
                partyDetails.get('creator').get().then(details => {
                    this.eventCreator = details.get('name');
                }).catch(e => console.log(e));
            }).catch(er => console.log(er));
        })
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

    async checkOut() {
        const modal = await this.modalController.create({
            component: RatingPage,
            componentProps: {
                eventID: this.eventId,
                currentUserId: this.currentUserId
            }
        });
        return await modal.present();
    }

    async messageUser(id?: string) {
        const alert = await this.alertController.create({
            header: 'New Ping!',
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    cssClass: 'secondary',
                    handler: () => {
                        console.log('Confirm Cancel: blah');
                    }
                }, {
                    text: 'Send',
                    handler: (alertData) => {
                        if(id){
                            const func = this.functions.httpsCallable('massMessage');
                            func({
                                eventId: this.eventId,
                                message: alertData.message
                            }).toPromise().then().catch(e => console.log(e));
                        }else{
                            this.sendPing(alertData, id);
                        }
                    }
                }
            ],
            inputs: [{
                name: 'message',
                type: 'textarea',
                placeholder: 'Hey!'
            }]
        });
        await alert.present();
    }

    private sendPing(alertData, id){
        this.afs.collection('pings').add({
            userSent: this.afs.collection('users').doc(this.currentUserId).ref,
            userRec: this.afs.collection('users').doc(id).ref,
            sentMessage: '',
            responseMessage: alertData.message,
            timeStamp: firestore.FieldValue.serverTimestamp()
        }).catch(e => console.log(e));
    }


    async openEventModal() {
        const modal = await this.modalController.create({
            component: MarkercreatorPage,
            componentProps: {
                eventID: this.eventId
            }
        });
        return await modal.present();
    }

    sendRequest(id) {
        this.requestService.sendRequest(id, 2047);
    }
}
