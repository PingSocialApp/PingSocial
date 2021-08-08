import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MarkercreatorPage} from '../tab2/markercreator/markercreator.page';
import {IonSlides, ModalController} from '@ionic/angular';
import {ActivatedRoute} from '@angular/router';
import {Observable, Subject} from 'rxjs';
import { AuthHandler } from '../services/authHandler.service';
import { EventsService } from '../services/events.service';

@Component({
    selector: 'app-eventmanager',
    templateUrl: './eventmanager.page.html',
    styleUrls: ['./eventmanager.page.scss'],
})
export class EventmanagerPage implements OnInit, OnDestroy {
    isMe: boolean;
    invitedSub: Observable<any>;
    createdSub: Observable<any>;
    createdOffset: number;
    invitedOffset: number;
    private eventsBS: Subject<any>;

    @ViewChild('mySlides') slides: IonSlides;

    slideOpts = {
        initialSlide: 0,
        speed: 400
    };

    constructor(private acr: ActivatedRoute, private modalController: ModalController,
        private es: EventsService, private auth: AuthHandler) {    }

    ngOnInit() {
        this.isMe = this.acr.snapshot.params.id === this.auth.getUID();
        this.createdOffset = 0;
        this.invitedOffset = 0;
        this.eventsBS = new Subject();
        this.eventsBS.subscribe(() => this.getEvents());
        this.invitedSub = this.es.getInvitedEvents(this.invitedOffset);
        this.createdSub = this.es.getUserEvents(this.acr.snapshot.params.id, this.createdOffset);
    }

    ngOnDestroy(): void {
    }

    getEvents() {
        this.slides.getActiveIndex().then(index => {
            if(index === 1){
                this.invitedSub = this.es.getInvitedEvents(this.invitedOffset);
            } else {
                this.createdSub = this.es.getUserEvents(this.acr.snapshot.params.id, this.createdOffset);
            }
        }).catch(e => console.error(e));
    }

    doRefresh(event) {
        this.slides.getActiveIndex().then(index => {
            if(index === 1){
                this.invitedOffset = 0;
            }else {
                this.createdOffset = 0;
            }
    }).catch(e => console.error(e));

        this.eventsBS.next();
        event.target.complete();
    }

    loadData(event){
        this.slides.getActiveIndex().then(index => {
            if(index === 0){
                this.createdOffset++;
            }else{
                this.invitedOffset++;
            }
            this.eventsBS.next();
            event.target.complete();
        }).catch(e => console.error(e));
    }

    async presentEventCreatorModal(data: string) {
        const modal = await this.modalController.create({
            component: MarkercreatorPage,
            componentProps: {
                eventID: data
            }
        });
        return await modal.present();
    }

    handleInput(event) {
        const query = event.target.value.toLowerCase();
        for (let i = 0; i < document.getElementsByTagName('ion-card').length; i++) {
            const shouldShow = document.getElementsByTagName('ion-card-title')[i].textContent.toLowerCase().indexOf(query) > -1
            document.getElementsByTagName('ion-card')[i].style.display = shouldShow ? 'block' : 'none';
        }
    }

    async addEvent() {
        const modal = await this.modalController.create({
            component: MarkercreatorPage,
            componentProps: {
                eventID: ''
            }
        });

        modal.onDidDismiss().then(() => this.eventsBS.next());

        return await modal.present();
    }
}
