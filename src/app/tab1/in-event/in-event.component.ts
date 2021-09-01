import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {MarkercreatorPage} from '../../tab2/markercreator/markercreator.page';
import {AlertController, ModalController} from '@ionic/angular';
import {RequestsService} from '../../services/requests.service';
import {RatingPage} from '../../rating/rating.page';
import { AuthHandler } from '../../services/authHandler.service';
import { EventsService } from '../../services/events.service';
import { PingsService } from 'src/app/services/pings.service';
import { UtilsService } from 'src/app/services/utils.service';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-in-event',
  templateUrl: './in-event.component.html',
  styleUrls: ['./in-event.component.scss'],
})

export class InEventComponent implements OnInit, OnChanges {
    @Input() eventId: string;
    attendees: Observable<any>;
    attendeesBS: BehaviorSubject<number>;
    offset: any;
    eventDetails: any;
    currentUserId: string;
    eventCreatorId: string;

    constructor(private modalController: ModalController,private utils: UtilsService,
                private alertController: AlertController, private requestService: RequestsService,
                private auth: AuthHandler, private es: EventsService, private ps: PingsService, private us: UsersService) {
    }

    ngOnInit(){
        this.offset = 0;
        this.attendeesBS = new BehaviorSubject(this.offset);
        this.currentUserId = this.auth.getUID();
        this.attendeesBS.subscribe(() => this.getAttendees());
    }

    ngOnChanges(_changes: SimpleChanges){
        this.eventDetails = this.eventId === '' ? null : this.es.getEventDetails(this.eventId);
        if(this.eventId !== ''){
            this.eventDetails.subscribe((val:any) => {
                this.eventCreatorId = val?.data.creator.uid;
            });
        }
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

    async messageUser(attendee:any) {
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
                        this.us.getUserBasic(attendee).subscribe(val => {
                            this.ps.sendPing(val.data, alertData).then(() => {
                                this.utils.presentToast('Ping Sent!');
                            }, err => {
                                console.error(err);
                                this.utils.presentToast('Whoops! Couldn\'t Send Ping');
                            })
                        }, userError => {
                            console.error(userError);
                            this.utils.presentToast('Whoops! Couldn\'t Send Ping');
                        });

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
        this.requestService.sendRequest(id, 2047).subscribe(() => this.utils.presentToast('Request Sent!'), err => {
            console.error(err);
            this.utils.presentToast('Whoops! Couldn\'t Send Request');
        });
    }

    getAttendees() {
        this.attendees = this.es.viewAttendees(this.eventId, this.offset);
    }

    doRefresh(event) {
        this.offset = 0;
        this.attendeesBS.next(this.offset);
        event.target.complete();
    }

    loadData(event){
        ++this.offset;
        this.attendeesBS.next(this.offset);
        event.target.complete();
    }

}
