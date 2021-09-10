import {Component, OnInit} from '@angular/core';
import {AlertController, ModalController} from '@ionic/angular';
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


    constructor(private modalCtrl: ModalController, private rs: RequestsService, private utils: UtilsService,
        private alertController: AlertController) {
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
            this.refreshContent();
        }, err => {
            this.utils.presentToast('Whoops! Try again');
            console.error(err);
        });
    }

    deleteUser(linkId: string) {
        this.rs.cancelRequest(linkId).subscribe(() => {
            this.utils.presentToast('Declined!');
            this.refreshContent();
        }, err => {
            this.utils.presentToast('Whoops! Try again');
            console.error(err);
        });
    }

    closeModal() {
        this.modalCtrl.dismiss();
    }

    doRefresh(event) {
        this.refreshContent();
        event.target.complete();
    }

    refreshContent(){
        this.offset = 0;
        this.pendingRequestsBS.next(this.offset);
    }

    loadData(event){
        ++this.offset;
        this.pendingRequestsBS.next(this.offset);
        event.target.complete();
    }

    async showRequestAlert(name:string, linkID: string){
        const alert = await this.alertController.create({
            header: 'Accept Request',
            message: `Do you wish to accept ${name}'s request?`,
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel'
                },
                {
                    text: 'Okay',
                    handler: () => {
                        this.acceptUser(linkID);
                    }
                }
            ]
        });
        await alert.present();
    }
}
