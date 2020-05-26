import {Component} from '@angular/core';
import {SettingsPage} from '../settings/settings.page';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {Router} from '@angular/router';

@Component({
    selector: 'app-tab2',
    templateUrl: 'tab2.page.html',
    styleUrls: ['tab2.page.scss'],
    providers: [AngularFireAuth]
})

export class Tab2Page {
    userId: string;
    unreadPings: number;

    // tslint:disable-next-line:max-line-length

    constructor(public modalController: ModalController, private router: Router, private auth: AngularFireAuth, private firestore: AngularFirestore) {
        this.userId = this.auth.auth.currentUser.uid;
        this.firestore.collection('users').doc(this.userId).snapshotChanges().subscribe(ref => {
            // @ts-ignore
            this.unreadPings = ref.payload.data().unreadPings.length;
        });
    }

    async presentModal() {
        const modal = await this.modalController.create({
            component: SettingsPage
        });
        return await modal.present();
    }

    }
}
