import {Component, OnDestroy, OnInit} from '@angular/core';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {AlertController, ModalController, PopoverController} from '@ionic/angular';
import {ReplypopoverComponent} from './replypopover/replypopover.component';
import {NewPingPage} from './new-ping/new-ping.page';
import {forkJoin, Observable} from 'rxjs';
import {concatMap} from 'rxjs/operators';
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
    currentUser: AngularFirestoreDocument;
    pingArray: Observable<any>;


    // tslint:disable-next-line:max-line-length
    constructor(private alertController: AlertController, private firestore: AngularFirestore, public popoverController: PopoverController, public modalController: ModalController,
                private utils: UtilsService, private auth: AuthHandler, private us: UsersService) {
    }

    ngOnInit() {
        // TODO Paginate
        this.pingArray = this.firestore.collection('pings', ref => ref.where('userRec', '==',
            this.auth.getUID()).orderBy('timeStamp','desc'))
            .snapshotChanges().pipe(concatMap(querySnap =>
                forkJoin(querySnap.map(doc => {
                    const data = doc.payload.doc;
                    // @ts-ignore
                    return this.us.getUserBasic(this.auth.getUID()).toPromise().then((val:any) => {
                        return {
                            // @ts-ignore
                            id: data.id,
                            // @ts-ignore
                            sentMessage: data.get('sentMessage'),
                            // @ts-ignore
                            recMessage: data.get('responseMessage'),
                            // @ts-ignore
                            userSentId: data.get('userSent').id,
                            userSentImg: val.data.profilepic,
                            userSent: val.data.name,
                        };
                    });
                }))));
    }

    ngOnDestroy(){
        this.pingArray = null;
    }

    async presentAlert(message: string, header: string) {
        if (message === '') {
            message = 'Ping Auto Generated Message';
        }
        const alert = await this.alertController.create({
            cssClass: 'my-custom-class',
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
