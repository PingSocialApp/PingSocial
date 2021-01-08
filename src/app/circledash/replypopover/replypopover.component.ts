import {Component, OnInit} from '@angular/core';
import {NavParams, PopoverController, ToastController} from '@ionic/angular';
import {firestore} from 'firebase/app';
import {AngularFirestore} from '@angular/fire/firestore';
import {first} from 'rxjs/operators';

@Component({
    selector: 'app-replypopover',
    templateUrl: './replypopover.component.html',
    styleUrls: ['./replypopover.component.scss'],

})
export class ReplypopoverComponent implements OnInit {
    responseMessage: string;

    constructor(private navParams: NavParams, private popoverController: PopoverController,
                private toastController: ToastController, private afs: AngularFirestore) {
    }

    ngOnInit() {

    }

    sendReplyData() {
        if (this.responseMessage === '') {
            this.presentToast('Whoops! You have an empty message');
            return;
        }
        this.afs.collection('pings').doc(this.navParams.get('pingId')).get().pipe(first()).subscribe((ref) => {
            this.afs.collection('pings').doc(this.navParams.get('pingId')).update({
                responseMessage: this.responseMessage,
                userRec: ref.get('userSent'),
                userSent: ref.get('userRec'),
                sentMessage: ref.get('responseMessage'),
                timeStamp: firestore.FieldValue.serverTimestamp()
            }).then(() => {
                this.presentToast('Reply Sent!');
                this.popoverController.dismiss();
            }).catch((error) => {
                // The document probably doesn't exist.
                console.error('Error updating document: ', error);
            });
        });
    }

    async presentToast(m: string) {
        const toast = await this.toastController.create({
            message: m,
            duration: 2000
        });
        toast.present();
    }

}
