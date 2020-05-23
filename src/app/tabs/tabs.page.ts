import {Component} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {NotificationsService} from '../notifications.service';

@Component({
    selector: 'app-tabs',
    templateUrl: 'tabs.page.html',
    styleUrls: ['tabs.page.scss'],
    providers: [AngularFireAuth]
})
export class TabsPage {
    requestAmount: number;
    currentUserRef: AngularFirestoreDocument;

    constructor(private auth: AngularFireAuth, private db: AngularFirestore, public notifService: NotificationsService) {
        this.currentUserRef = this.db.collection('users').doc(this.auth.auth.currentUser.uid);
        this.db.collection('links', ref => ref.where('userRec', '==', this.currentUserRef.ref)
            .where('pendingRequest', '==', true)).snapshotChanges().subscribe(res => {
            this.requestAmount = res.length;
        });
        this.notifService.getToken(this.auth.auth.currentUser.uid);
    }

}
