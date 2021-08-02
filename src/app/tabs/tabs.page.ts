import {Component, OnDestroy, OnInit} from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import {Observable} from 'rxjs';
import { RequestsService } from '../services/requests.service';

@Component({
    selector: 'app-tabs',
    templateUrl: 'tabs.page.html',
    styleUrls: ['tabs.page.scss'],
    providers: [AngularFireDatabase]
})
export class TabsPage implements OnInit, OnDestroy{
    requestAmount: number;
    pingLength: Observable<number | any>;

    constructor(private rs: RequestsService) {
    }

    ngOnDestroy(): void {
    }

    ngOnInit(): void {
        this.pingLength = this.rs.getTotalNumRequests();
    }

}
