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
            this.utils.presentToast('Whoops! You have an empty message');
            return;
        }
        this.afs.collection('pings').doc(this.navParams.get('pingId')).get().toPromise().then((ref) => {
            this.afs.collection('pings').doc(this.navParams.get('pingId')).set({
                responseMessage: this.responseMessage,
                // TODO if ref.getUserRec is a string then set the object otherwise switch it
                userRec: ref.get('userSent'),
                userSent: ref.get('userRec'),
                sentMessage: ref.get('responseMessage'),
                timeStamp: firestore.FieldValue.serverTimestamp()
            }).then(() => {
                this.utils.presentToast('Reply Sent!');
                this.popoverController.dismiss();
            }).catch((error) => {
                console.error('Error updating document: ', error);
                this.utils.presentToast('Whoops! Couldn\'t send Ping');
            });
        }).catch((error) => {
            console.error(error);
            this.utils.presentToast('Whoops! Couldn\'t send Ping');
        });
    }
}
