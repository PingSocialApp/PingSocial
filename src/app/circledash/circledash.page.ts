import {Component, OnDestroy, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {AlertController, ModalController, PopoverController} from '@ionic/angular';
import {ReplypopoverComponent} from './replypopover/replypopover.component';
import {NewPingPage} from './new-ping/new-ping.page';
import {Observable} from 'rxjs';
import {concatMap, map, tap} from 'rxjs/operators';
import { UtilsService } from '../services/utils.service';
import { AuthHandler } from '../services/authHandler.service';
import { UsersService } from '../services/users.service';

@Component({
    selector: 'app-circledash',
    templateUrl: './circledash.page.html',
    styleUrls: ['./circledash.page.scss'],
    providers: []
})


export class CircledashPage implements OnInit, OnDestroy {
    pingArray: Observable<any>;

    // tslint:disable-next-line:max-line-length
    constructor(private alertController: AlertController, private firestore: AngularFirestore, public popoverController: PopoverController, public modalController: ModalController,
                private utils: UtilsService, private auth: AuthHandler, private us: UsersService) {
    }

    ngOnInit() {
        this.pingArray = this.firestore.collection('pings', ref =>
        ref.where('userRec.id', '==', this.auth.getUID()))
            .snapshotChanges().pipe(map(querySnap => {
                return querySnap.map(snap => {
                    const doc = snap.payload.doc;
                    const obj =  {
                        // @ts-ignore
                        id: doc.id,
                        // @ts-ignore
                        sentMessage: doc.get('sentMessage'),
                        // @ts-ignore
                        recMessage: doc.get('responseMessage'),
                        // @ts-ignore
                        userSent: doc.get('userSent')
                    };
                    return obj;
                });
            }));
    }

    ngOnDestroy(){
        this.pingArray = null;
    }

    async presentAlert(message: string, header: string) {
        if (message === '') {
            message = 'Ping Auto Generated Message';
        }
        const alert = await this.alertController.create({
            header,
            subHeader: message,
            buttons: ['OK']
        });

        await alert.present();
    }

    handleInput(event) {
        const query = event.target.value.toLowerCase();
        for (let i = 0; i < document.getElementsByTagName('ion-item').length; i++) {
            const shouldShow = document.getElementsByTagName('h2')[i].textContent.toLowerCase().indexOf(query) > -1 ||
                document.getElementsByTagName('h3')[i].textContent.toLowerCase().indexOf(query) > -1;
            document.getElementsByTagName('ion-item-sliding')[i].style.display = shouldShow ? 'block' : 'none';
        }
    }

    async replyPing(ev: any, id: any, us: string) {
        const popover = await this.popoverController.create({
            component: ReplypopoverComponent,
            event: ev,
            componentProps: {
                pingId: id,
                userSent: us
            },
        });
        await popover.present();
    }

    deletePing(id: any) {
        this.firestore.collection('pings').doc(id).delete().then(() => {
            this.utils.presentToast('Ping Successfully Deleted!');
        }).catch((error) => {
            console.error('Error removing document: ', error);
        });
    }

    async presentNewPingModal() {
        const modal = await this.modalController.create({
            component: NewPingPage
        });
        return await modal.present();
    }
}
