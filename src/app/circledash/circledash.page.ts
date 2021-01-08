import {Component, OnInit} from '@angular/core';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {AlertController, ModalController, PopoverController, ToastController} from '@ionic/angular';
import {ReplypopoverComponent} from './replypopover/replypopover.component';
import {AngularFireStorage} from '@angular/fire/storage';
import {AngularFireAuth} from '@angular/fire/auth';
import {NewPingPage} from './new-ping/new-ping.page';
import {forkJoin, Observable} from 'rxjs';
import {mergeMap} from 'rxjs/operators';

export interface Ping {
    id: any;
    userSentImg: string;
    userSentId: string;
    userSent: string;
    sentMessage: string;
    recMessage: string;
}

@Component({
    selector: 'app-circledash',
    templateUrl: './circledash.page.html',
    styleUrls: ['./circledash.page.scss'],
    providers: [AngularFireStorage, AngularFireAuth]
})


export class CircledashPage implements OnInit {
    currentUser: AngularFirestoreDocument;
    pingArray: Observable<any>;


    // tslint:disable-next-line:max-line-length
    constructor(private alertController: AlertController, private firestore: AngularFirestore, public popoverController: PopoverController, public modalController: ModalController,
                private toastController: ToastController, private storage: AngularFireStorage, private auth: AngularFireAuth) {
    }

    ngOnInit() {
        this.pingArray = this.firestore.collection('pings', ref => ref.where('userRec', '==',
            this.firestore.doc('/users/' + this.auth.auth.currentUser.uid).ref).orderBy('timeStamp','desc'))
            .snapshotChanges().pipe(mergeMap(querySnap =>
                forkJoin(querySnap.map(doc => {
                    const data = doc.payload.doc;
                    return data.get('userSent').get().then(val => {
                        return {
                            id: data.id,
                            sentMessage: data.get('sentMessage'),
                            recMessage: data.get('responseMessage'),
                            userSentId: data.get('userSent').id,
                            userSentImg: this.getImage(val.get('profilepic')),
                            userSent: val.get('name'),
                        };
                    });
                }))));
    }

    async getImage(profilePic: string) {
        if (profilePic.startsWith('h')) {
            return profilePic;
        } else {
            return await this.storage.storage.refFromURL(profilePic).getDownloadURL().then(url => {
                return url;
            }).catch((e) => console.log(e));
        }
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
            console.log('Document successfully deleted!');
            this.presentToast('Ping Successfully Deleted!');
        }).catch((error) => {
            console.error('Error removing document: ', error);
        });
    }

    async presentToast(m: string) {
        const toast = await this.toastController.create({
            message: m,
            duration: 2000
        });
        await toast.present();
    }

    async presentNewPingModal() {
        const modal = await this.modalController.create({
            component: NewPingPage
        });
        return await modal.present();
    }
}
