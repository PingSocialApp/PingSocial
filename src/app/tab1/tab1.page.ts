import {Component, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {BehaviorSubject, Observable} from 'rxjs';
import {concatMap, tap} from 'rxjs/operators';
import {MarkercreatorPage} from '../tab2/markercreator/markercreator.page';
import {AlertController, ModalController} from '@ionic/angular';
import {firestore} from 'firebase';
import {RequestsService} from '../services/requests.service';
import {AngularFireFunctions} from '@angular/fire/functions';
import {RatingPage} from '../rating/rating.page';
import { AuthHandler } from '../services/authHandler.service';
import { UsersService } from '../services/users.service';
import { EventsService } from '../services/events.service';

@Component({
    selector: 'app-tab1',
    templateUrl: 'tab1.page.html',
    styleUrls: ['tab1.page.scss'],
    providers: [AngularFireFunctions]
})
export class Tab1Page implements OnInit {
    eventName: string;
    eventDes: string;
    eventId: string;
    currentUserId: string;
    attendees: Observable<any>;
    attendeesBS: BehaviorSubject<number>;
    eventCreator: string;
    eventCreatorId: string;
    offset: any;

    constructor(private afs: AngularFirestore, private modalController: ModalController,
                private alertController: AlertController, private requestService: RequestsService,
                private auth: AuthHandler, private es: EventsService, private us: UsersService) {
    }

    ngOnInit(){
        this.currentUserId = this.auth.getUID();
        this.eventId = '';
        this.attendeesBS = new BehaviorSubject(this.offset);
        // this.attendeesBS.subscribe(() => this.getAttendees());
        
        // this.us.getUserBasic(this.currentUserId).pipe(tap((val:any) => this.eventId=val.data.checkedIn), concatMap((val:any) ))

        //     this.attendees = this.afs.collection('events').doc(this.eventId).collection('attendeesPublic').snapshotChanges().pipe(map(v=> {
        //         return v.map(doc => {
        //             const data = doc.payload.doc;
        //             return {
        //                 id: data.id,
        //                 name: data.name,
        //                 bio: data.bio,
        //                 img: data.profilepic
        //             }
        //         })
        //     }));
        // })
    }

    async checkOut() {
        const modal = await this.modalController.create({
            component: RatingPage,
            componentProps: {
                eventID: this.eventId,
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
                            // TODO Mass Message All attendees
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
            userSent: this.currentUserId,
            userRec: id,
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

    sendRequest(id: string) {
        this.requestService.sendRequest(id, 2047);
    }

    getAttendees() {
        this.attendees = this.es.viewAttendees(this.eventId, this.offset);
    }

}
