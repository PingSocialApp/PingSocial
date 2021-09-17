import {Component, OnInit} from '@angular/core';
import {NavParams, PopoverController} from '@ionic/angular';
import {firestore} from 'firebase/app';
import {AngularFirestore} from '@angular/fire/firestore';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
    selector: 'app-replypopover',
    templateUrl: './replypopover.component.html',
    styleUrls: ['./replypopover.component.scss'],

})
export class ReplypopoverComponent implements OnInit {
    responseMessage: string;

    constructor(private navParams: NavParams, private popoverController: PopoverController,
                private utils: UtilsService, private afs: AngularFirestore) {
    }

    ngOnInit() {

    }

    sendReplyData() {
        if (this.responseMessage === '') {
            this.utils.presentToast('Whoops! You have an empty message', 'warning');
            return;
        }

        this.afs.firestore.runTransaction(transaction => {
            return transaction.get(this.afs.collection('pings').doc(this.navParams.get('pingId')).ref).then(ref => {
                transaction.update(this.afs.collection('pings').doc(this.navParams.get('pingId')).ref, {
                    responseMessage: this.responseMessage,
                    userRec: ref.get('userSent'),
                    userSent: ref.get('userRec'),
                    sentMessage: ref.get('responseMessage'),
                    timeStamp: firestore.FieldValue.serverTimestamp()
                });
            })
        }).then(() => {
            this.utils.presentToast('Reply Sent!', 'success');
            this.popoverController.dismiss();
        }).catch(err => {
            console.error(err);
            this.utils.presentToast('Whoops! Unable to Send Ping', 'error');
        });
    }
}
