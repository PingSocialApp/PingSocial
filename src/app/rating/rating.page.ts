import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ModalController} from '@ionic/angular';
import { UtilsService } from '../services/utils.service';
import { EventsService } from '../services/events.service';
import { AuthHandler } from '../services/authHandler.service';

@Component({
    selector: 'app-rating',
    templateUrl: './rating.page.html',
    styleUrls: ['./rating.page.scss'],
})
export class RatingPage implements OnInit, OnDestroy {
    rate: number;
    review: string;
    textAmt: number;
    @Input() eventID;
    checkoutSub: any;

    constructor(private modalController: ModalController, private utils: UtilsService, private es: EventsService) {}

    ngOnInit() {
        this.textAmt = 0;
        this.rate = 3;
        this.review = '';
    }

    ngOnDestroy(){
        this.checkoutSub.unsubscribe();
    }

    async checkout() {
        if(this.review.length > 1000){
            await this.utils.presentToast('Whoops! Your review is too long');
            return;
        }

        this.checkoutSub = this.es.checkout(this.eventID, this.rate, this.review).subscribe(async val => {
            await this.modalController.dismiss({
                isSuccesful: true
            });
            this.utils.presentToast('Checkout Successful!');
        }, async err => {
            await this.modalController.dismiss({
                isSuccesful: false
            });
           this.utils.presentToast('Whoops! Checkout failed');
        });
    }
}
