import {Component} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';

@Component({
    selector: 'app-tabs',
    templateUrl: 'tabs.page.html',
    styleUrls: ['tabs.page.scss'],
    providers: [AngularFireAuth]
})
export class TabsPage {
    requestAmount: number;
    currentUserRef: AngularFirestoreDocument;

    constructor(private auth: AngularFireAuth, private db: AngularFirestore) {
        this.currentUserRef = this.db.collection('users').doc(this.auth.auth.currentUser.uid);
        this.db.collection('links', ref => ref.where('userRec', '==', this.currentUserRef.ref)
            .where('pendingRequest', '==', true)).snapshotChanges().subscribe(res => {
            this.requestAmount = res.length;
        });
    }

}
