import {Component, OnInit} from '@angular/core';
import {ModalController} from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import { RequestsService } from '../services/requests.service';
import { UtilsService } from '../services/utils.service';

@Component({
    selector: 'app-requests',
    templateUrl: './requests.page.html',
    styleUrls: ['./requests.page.scss'],
    providers: []
})
export class RequestsPage implements OnInit {
    offset: number;
    pendingRequestsBS: BehaviorSubject<number>;
    links: any;


    constructor(private modalCtrl: ModalController, private rs: RequestsService, private utils: UtilsService) {
    }

    ngOnInit() {
        this.offset = 0;
        this.pendingRequestsBS = new BehaviorSubject(this.offset);
        this.pendingRequestsBS.subscribe(() => this.getPendingRequests());
    }

    getPendingRequests() {
        this.links = this.rs.getPendingRequests(this.offset);
    }

    acceptUser(linkId: string) {
        this.rs.acceptRequest(linkId).subscribe(() => {
            this.utils.presentToast('Accepted!');
        }, err => {
            this.utils.presentToast('Whoops! Try again');
            console.error(err);
        });
    }

    deleteUser(linkId: string) {
        this.rs.cancelRequest(linkId).subscribe(() => {
            this.utils.presentToast('Declined!');
        }, err => {
            this.utils.presentToast('Whoops! Try again');
            console.error(err);
        });
    }

    closeModal() {
        this.modalCtrl.dismiss();
    }

    doRefresh(event) {
        this.offset = 0;
        this.pendingRequestsBS.next(this.offset);
        event.target.complete();
    }

    loadData(event){
        ++this.offset;
        this.pendingRequestsBS.next(this.offset);
        event.target.complete();
    }
}
