import {Component, Input, OnInit} from '@angular/core';
import {ModalController, ToastController} from '@ionic/angular';
import {AngularFirestore} from '@angular/fire/firestore';
import * as firebase from 'firebase';

@Component({
    selector: 'app-rating',
    templateUrl: './rating.page.html',
    styleUrls: ['./rating.page.scss'],
})
export class RatingPage implements OnInit {
    rate: number;
    review: string;
    textAmt: number;
    @Input() eventID;
    @Input() currentUserId;

    constructor(private modalController: ModalController, private afs: AngularFirestore, private toastController: ToastController) {
        this.textAmt = 0;
        this.rate = 3;
        this.review = '';
    }

    ngOnInit() {
    }

    async presentToast(m: string) {
        const toast = await this.toastController.create({
            message: m,
            duration: 2000
        });
        await toast.present();
    }

    async checkout() {
        if(this.review.length > 1000){
            await this.presentToast('Whoops! Your review is too long');
            return;
        }

        const batch = this.afs.firestore.batch();

        batch.update(this.afs.collection('events').doc(this.eventID).collection('attendeesPrivate').doc(this.currentUserId).ref, {
            timeExited: firebase.firestore.FieldValue.serverTimestamp(),
            rating: this.rate,
            review: this.review
        });

        batch.update(this.afs.collection('eventProfile').doc(this.currentUserId).ref, {
            partyAt: null
        });

        batch.commit().then(async () => {
            await this.modalController.dismiss();
        }).catch(e => console.log(e));
    }
}
