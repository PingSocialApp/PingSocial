import {Component, OnDestroy, OnInit} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {Subscription} from 'rxjs';

@Component({
    selector: 'app-tabs',
    templateUrl: 'tabs.page.html',
    styleUrls: ['tabs.page.scss'],
    providers: [AngularFireAuth]
})
export class TabsPage implements OnInit, OnDestroy{
    requestAmount: number;
    currentUserRef: AngularFirestoreDocument;
    pingLengthRef: Subscription;

    constructor(private auth: AngularFireAuth, private db: AngularFirestore) {
        this.currentUserRef = this.db.collection('users').doc(this.auth.auth.currentUser.uid);
    }

    ngOnDestroy(): void {
        this.pingLengthRef.unsubscribe();
    }

    ngOnInit(): void {
        this.pingLengthRef = this.currentUserRef.collection('links', ref => ref.where('pendingRequest', '==', true))
            .valueChanges().subscribe(res => {
            this.requestAmount = res.length;
        });
    }

}
