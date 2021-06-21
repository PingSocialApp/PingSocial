import {Component, OnDestroy, OnInit} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {Subscription} from 'rxjs';
import {AngularFireDatabase} from '@angular/fire/database';

@Component({
    selector: 'app-tabs',
    templateUrl: 'tabs.page.html',
    styleUrls: ['tabs.page.scss'],
    providers: [AngularFireAuth]
})
export class TabsPage implements OnInit, OnDestroy{
    requestAmount: number;
    pingLengthRef: Subscription;

    constructor(private auth: AngularFireAuth, private db: AngularFireDatabase) {
    }

    ngOnDestroy(): void {
        this.pingLengthRef.unsubscribe();
    }

    ngOnInit(): void {
        this.pingLengthRef = this.db.object('pendingRequests/' + this.auth.auth.currentUser.uid)
            .valueChanges().subscribe((res:any) => {
            this.requestAmount = res;
        });
    }

}
