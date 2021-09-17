import {Component, OnDestroy, OnInit} from '@angular/core';
import { Subscription } from 'rxjs';
import { EventsService } from '../services/events.service';
import { UtilsService } from '../services/utils.service';

@Component({
    selector: 'app-tab1',
    templateUrl: 'tab1.page.html',
    styleUrls: ['tab1.page.scss'],
    providers: []
})
export class Tab1Page implements OnInit, OnDestroy {
    slideOptions: any;
    eventID: string;
    eventSub: Subscription;


    constructor(private es: EventsService, private utils: UtilsService) {
        this.eventID = '';
    }

    ngOnInit(){
        this.slideOptions = {initialSlide: 0, speed: 400};

        this.eventSub = this.es.checkedInEvent.subscribe({
            next: (val:string) => {
                this.slideOptions.initialSlide = val === '' ? 0 : 1;
                this.eventID = val;
            },
            error: (err) => {
                console.error(err);
                this.utils.presentToast('whoops! Unable to get Event Details', 'error');
            }
        });
    }

    ngOnDestroy(){
        this.eventSub.unsubscribe();
    }


}
