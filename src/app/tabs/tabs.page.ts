import {Component, OnDestroy, OnInit} from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { StatusBar } from '@capacitor/status-bar';
import { RequestsService } from '../services/requests.service';

@Component({
    selector: 'app-tabs',
    templateUrl: 'tabs.page.html',
    styleUrls: ['tabs.page.scss'],
    providers: [AngularFireDatabase]
})
export class TabsPage implements OnInit, OnDestroy{
    requestAmount: number;
    requestAmountSub: any;

    constructor(private rs: RequestsService) {
    }

    ngOnDestroy(): void {
        this.requestAmountSub.unsubscribe();
    }

    ngOnInit(): void {
        StatusBar.show();
        this.requestAmountSub = this.rs.getTotalNumRequests().subscribe((val:number) => {
            this.requestAmount = val;
        });
    }

}
