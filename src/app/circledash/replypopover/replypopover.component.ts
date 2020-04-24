import {Component, EventEmitter, OnInit, Output} from '@angular/core';
// import {AngularFirestoreDocument} from '@angular/fire/firestore';
import {NavParams, PopoverController, ToastController} from '@ionic/angular';
import * as firebase from 'firebase';

@Component({
    selector: 'app-replypopover',
    templateUrl: './replypopover.component.html',
    styleUrls: ['./replypopover.component.scss'],

})
export class ReplypopoverComponent implements OnInit {
    responseMessage: Array<string>;

    constructor(private navParams: NavParams, private popoverController: PopoverController, private toastController: ToastController) {
        this.responseMessage = this.navParams.get('messages');
    }

    ngOnInit() {

    }

    sendReplyData(message: string) {
        const db = this.navParams.get('fs');
        db.collection('pings').doc(this.navParams.get('pingId')).update({
            responseMessage: message
        }).then(() => {
            // console.log(this.navParams.get('userSent'));
              db.collection('users').doc(this.navParams.get('userSent')).update({
                unreadPings: firebase.firestore.FieldValue.arrayUnion(db.collection('pings').doc(this.navParams.get('pingId')).ref)
            }).then(() => {
                console.log('User Sent successfully updated!');
                db.collection('users').doc('4CMyPB6tafUbL1CKzCb8').update({
                    unreadPings: firebase.firestore.FieldValue.arrayRemove(db.collection('pings').doc(this.navParams.get('pingId')).ref)
                }).then(() => {
                    console.log('You successfully updated!');
                    this.presentToast('Reply sent!');
                    this.popoverController.dismiss();
                }).catch((error) => {
                    // The document probably doesn't exist.
                    console.error('Error updating document: ', error);
                });
            }).catch((error) => {
                // The document probably doesn't exist.
                console.error('Error updating document: ', error);
            });
        }).catch((error) => {
            // The document probably doesn't exist.
            console.error('Error updating document: ', error);
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
