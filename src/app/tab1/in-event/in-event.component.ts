import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {BehaviorSubject, Observable} from 'rxjs';
import {MarkercreatorPage} from '../../tab2/markercreator/markercreator.page';
import {AlertController, ModalController} from '@ionic/angular';
import {firestore} from 'firebase/app';
import {RequestsService} from '../../services/requests.service';
import {RatingPage} from '../../rating/rating.page';
import { AuthHandler } from '../../services/authHandler.service';
import { EventsService } from '../../services/events.service';

@Component({
  selector: 'app-in-event',
  templateUrl: './in-event.component.html',
  styleUrls: ['./in-event.component.scss'],
})

export class InEventComponent implements OnInit, OnChanges {
    @Input() eventId: string;
    attendees: Observable<any>;
    attendeesBS: BehaviorSubject<number>;
    eventCreatorId: string;
    offset: any;
    eventDetails: any;
    currentUserId: string;

    constructor(private afs: AngularFirestore, private modalController: ModalController,
                private alertController: AlertController, private requestService: RequestsService,
                private auth: AuthHandler, private es: EventsService) {
    }

    ngOnInit(){
        this.attendeesBS = new BehaviorSubject(this.offset);
        this.currentUserId = this.auth.getUID();
        // this.attendeesBS.subscribe(() => this.getAttendees());
    }

    ngOnChanges(changes: SimpleChanges){
        this.eventDetails = this.eventId === '' ? null : this.es.getEventDetails(this.eventId);
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
                    cssClass: 'secondary'
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

    private sendPing(alertData:any, id:string){
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
