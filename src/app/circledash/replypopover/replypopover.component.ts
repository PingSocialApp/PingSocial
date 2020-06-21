import {Component, OnInit} from '@angular/core';
import {NavParams, PopoverController, ToastController} from '@ionic/angular';
import {firestore} from 'firebase';
import {AngularFireAuth} from '@angular/fire/auth';

@Component({
    selector: 'app-replypopover',
    templateUrl: './replypopover.component.html',
    styleUrls: ['./replypopover.component.scss'],

})
export class ReplypopoverComponent implements OnInit {
    responseMessage: string;
    currentUserId: string;

    constructor(private auth: AngularFireAuth,
                private navParams: NavParams, private popoverController: PopoverController, private toastController: ToastController) {
        this.currentUserId = this.auth.auth.currentUser.uid;
    }

    ngOnInit() {

    }

    sendReplyData() {
        const db = this.navParams.get('fs');
        if (this.responseMessage === '') {
            this.presentToast('Whoops! You have an empty message');
            return;
        }
        db.collection('pings').doc(this.navParams.get('pingId')).get().subscribe((ref) => {
            db.collection('pings').doc(this.navParams.get('pingId')).update({
                responseMessage: this.responseMessage,
                userRec: ref.data().userSent,
                userSent: ref.data().userRec,
                sentMessage: ref.data().responseMessage,
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
