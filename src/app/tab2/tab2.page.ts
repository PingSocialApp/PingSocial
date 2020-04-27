import {Component} from '@angular/core';
import {ModalController} from '@ionic/angular';
import {SettingsPage} from '../settings/settings.page';
import {AngularFirestore} from '@angular/fire/firestore';

@Component({
    selector: 'app-tab2',
    templateUrl: 'tab2.page.html',
    styleUrls: ['tab2.page.scss']
})

export class Tab2Page {
    unreadPings: number;
    phone = true;
    email = true;
    instagram = true;
    snapchat = true;
    facebook = true;
    tiktok = true;
    twitter = true;
    venmo = true;
    linkedin = true;
    professionalemail = true;
    website = true;
    qrData: string;

    // tslint:disable-next-line:max-line-length

    constructor(public modalController: ModalController, private firestore: AngularFirestore) {
        this.firestore.collection('users').doc('4CMyPB6tafUbL1CKzCb8').snapshotChanges().subscribe(ref => {
            // @ts-ignore
            this.unreadPings = ref.payload.data().unreadPings.length;
        });
        this.updateVals();
    }

    async presentModal() {
        const modal = await this.modalController.create({
            component: SettingsPage
        });
        return await modal.present();
    }

    updateVals() {
        // tslint:disable-next-line:no-bitwise
        const phoneVal = +!!this.phone << 10;
        // tslint:disable-next-line:no-bitwise
        const emailVal = +!!this.email << 9;
        // tslint:disable-next-line:no-bitwise
        const instagramVal = +!!this.instagram << 8;
        // tslint:disable-next-line:no-bitwise
        const snapVal = +!!this.snapchat << 7;
        // tslint:disable-next-line:no-bitwise
        const facebookVal = +!!this.facebook << 6;
        // tslint:disable-next-line:no-bitwise
        const tiktokVal = +!!this.tiktok << 5;
        // tslint:disable-next-line:no-bitwise
        const twitterVal = +!!this.twitter << 4;
        // tslint:disable-next-line:no-bitwise
        const venmoVal = +!!this.venmo << 3;
        // tslint:disable-next-line:no-bitwise
        const linkedinVal = +!!this.linkedin << 2;
        // tslint:disable-next-line:no-bitwise
        const proemailVal = +!!this.professionalemail << 1;
        // tslint:disable-next-line:no-bitwise
        const websiteVal = +!!this.website << 0;
        // tslint:disable-next-line:no-bitwise max-line-length
        const code = phoneVal | emailVal | instagramVal | snapVal | facebookVal | tiktokVal | twitterVal | venmoVal | linkedinVal | proemailVal | websiteVal;
        this.qrData = code + '/' + '4CMyPB6tafUbL1CKzCb8';
    }
}
