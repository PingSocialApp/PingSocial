import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
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
export class EventmanagerPage implements OnInit, OnDestroy, AfterViewInit {
    isMe: boolean;
    invitedSub: Observable<any>;
    createdSub: Observable<any>;
    createdOffset: number;
    invitedOffset: number;
    private eventsBS: Subject<any>;
    currentSlide: any;

    @ViewChild('mySlides') slides: IonSlides;

    slideOpts:any = {
        initialSlide: 0,
        speed: 400,
    };

    constructor(private acr: ActivatedRoute, private modalController: ModalController,
        private es: EventsService, private auth: AuthHandler) {    }

    ngOnInit() {
        this.currentSlide = 0;
        this.isMe = this.acr.snapshot.params.id === this.auth.getUID();
        this.createdOffset = 0;
        this.invitedOffset = 0;
        this.eventsBS = new Subject();
        this.eventsBS.subscribe(() => this.getEvents());
        this.invitedSub = this.es.getInvitedEvents(this.invitedOffset);
        this.createdSub = this.es.getUserEvents(this.acr.snapshot.params.id, this.createdOffset);
    }

    ngAfterViewInit(){
        if(!this.isMe){
            this.slides.lockSwipes(true);
        }
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
        this.refreshData();
        event.target.complete();
    }

    refreshData(){
        this.slides.getActiveIndex().then(index => {
            if(index === 1){
                this.invitedOffset = 0;
            }else {
                this.createdOffset = 0;
            }
        }).catch(e => console.error(e));

        this.eventsBS.next();
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
        await modal.present();
        modal.onDidDismiss().then(() => {
            this.refreshData();
        });
    }

    segmentChanged(event){
        this.slides.slideTo(event.detail.value);
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

    slideChanged(){
        this.slides.getActiveIndex().then(index => {
            this.currentSlide = index.toString();
        });
    }
}
