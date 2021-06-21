import {Component, OnDestroy, OnInit} from '@angular/core';
import {MarkercreatorPage} from '../tab2/markercreator/markercreator.page';
import {ModalController} from '@ionic/angular';
import {ActivatedRoute} from '@angular/router';
import {BehaviorSubject} from 'rxjs';
import { AuthHandler } from '../services/authHandler.service';
import { EventsService } from '../services/events.service';

@Component({
    selector: 'app-eventmanager',
    templateUrl: './eventmanager.page.html',
    styleUrls: ['./eventmanager.page.scss'],
})
export class EventmanagerPage implements OnInit, OnDestroy {
    isMe: boolean;
    eventsSub: any;
    offset: number;
    private eventsBS: BehaviorSubject<number>;

    constructor(private acr: ActivatedRoute, private modalController: ModalController,
        private es: EventsService,
                private auth: AuthHandler) {    }

    ngOnInit() {
        this.isMe = this.acr.snapshot.params.id === this.auth.getUID();

        this.offset = 0;
        this.eventsBS = new BehaviorSubject(this.offset);
        this.eventsBS.subscribe(() => this.getEvents());
    }

    ngOnDestroy(): void {
        // this.eventsSub?.unsubscribe();
    }

    getEvents() {
        this.eventsSub = this.es.getUserEvents(this.acr.snapshot.params.id, this.offset)
    }

    doRefresh(event) {
        this.offset = 0;
        this.eventsBS.next(this.offset);
        event.target.complete();
    }

    loadData(event){
        ++this.offset;
        this.eventsBS.next(this.offset);
        event.target.complete();
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
        return await modal.present();
    }
}
