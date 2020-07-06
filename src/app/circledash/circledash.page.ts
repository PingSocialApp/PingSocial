import {Component, OnInit} from '@angular/core';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {AlertController, ModalController, PopoverController, ToastController} from '@ionic/angular';
import {ReplypopoverComponent} from './replypopover/replypopover.component';
import {AngularFireStorage} from '@angular/fire/storage';
import {AngularFireAuth} from '@angular/fire/auth';
import {NewPingPage} from './new-ping/new-ping.page';

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
    pingArray: Array<Ping>;


    // tslint:disable-next-line:max-line-length
    constructor(private alertController: AlertController, private firestore: AngularFirestore, public popoverController: PopoverController, public modalController: ModalController,
                private toastController: ToastController, private storage: AngularFireStorage, private auth: AngularFireAuth) {
        this.pingArray = [];
        this.firestore.collection('pings', ref => ref.where('userRec', '==',
            this.firestore.doc('/users/' + this.auth.auth.currentUser.uid).ref).orderBy('timeStamp', 'desc'))
            .snapshotChanges().subscribe(res => {
            if (res !== null) {
                this.renderPings(res);
                this.pingArray = [];
            }
        });
    }

    ngOnInit() {

    }

    async renderPings(pings: any) {
        await Promise.all(pings.map(ping => {
            const pingId = ping.payload.doc.id;
            let pingdata = ping.payload.doc;
            pingdata.get('userSent').get().then(userdata => {
                let ud = userdata.data();
                let imgUrl = '';
                if (ud.profilepic.startsWith('h')) {
                    imgUrl = ud.profilepic;
                } else {
                    this.storage.storage.refFromURL(ud.profilepic).getDownloadURL().then(url => {
                        imgUrl = 'url(' + url + ')';
                    });
                }
                const pingObject: Ping = {
                    id: pingId,
                    userSentId: userdata.id,
                    userSentImg: imgUrl,
                    userSent: ud.name,
                    sentMessage: pingdata.sentMessage,
                    recMessage: pingdata.responseMessage
                };
                this.pingArray.push(pingObject);
            }).catch(e => {
                console.log(e);
            });
        }));
    }

    async presentAlert(message: string, header: string) {
        if (message === '') {
            message = 'Ping Auto Generated Message';
        }
        const alert = await this.alertController.create({
            cssClass: 'my-custom-class',
            header: header,
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
                fs: this.firestore,
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
