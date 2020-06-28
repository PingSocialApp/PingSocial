import {Component, OnInit} from '@angular/core';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {ModalController, ToastController} from '@ionic/angular';
import {firestore} from 'firebase/app';
import {AngularFireStorage} from '@angular/fire/storage';
import {AngularFireAuth} from '@angular/fire/auth';

export interface Link {
    id: string;
    img: string;
    name: string;
    bio: string;
}

@Component({
    selector: 'app-new-ping',
    templateUrl: './new-ping.page.html',
    styleUrls: ['./new-ping.page.scss'],
    providers: [AngularFireStorage, AngularFireAuth]
})

export class NewPingPage implements OnInit {
    currentUserRef: AngularFirestoreDocument;
    links: Array<Link>;
    pingMessage: string;

    constructor(private fs: AngularFirestore, private auth: AngularFireAuth, private modalCtrl: ModalController,
                private toastController: ToastController, private storage: AngularFireStorage) {
        this.currentUserRef = this.fs.collection('users').doc(this.auth.auth.currentUser.uid);
        this.links = [];
        this.fs.collection('links', ref => ref.where('userSent', '==', this.currentUserRef.ref)).snapshotChanges().subscribe(res => {
            this.links = [];
            this.renderLink(res);
        });
    }

    ngOnInit() {
    }

    sendPing() {
        if (this.pingMessage === '' || this.pingMessage === undefined) {
            this.presentToast('Whoops! You have an empty message');
            return;
        }
        const toggle = (document.getElementsByTagName('ion-checkbox') as unknown as Array<any>);
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < toggle.length; i++) {
            if (toggle[i].checked) {
                this.fs.collection('pings').add({
                    responseMessage: this.pingMessage,
                    userSent: this.currentUserRef.ref,
                    userRec: this.fs.collection('users').doc(toggle[i].id).ref,
                    timeStamp: firestore.FieldValue.serverTimestamp(),
                    sentMessage: 'New Message!'
                }).then(newPingId => {
                }).catch((e) => console.log(e));
            }
        }
        this.closeModal();
    }

    async renderLink(linkData: Array<any>) {
        await Promise.all(linkData.map(link => {
            link.payload.doc.get('userRec').get().then(USdata => {
                const linkObject: Link = {
                    id: USdata.id,
                    img: '',
                    name: USdata.get('name'),
                    bio: USdata.get('bio')
                };
                if (USdata.get('profilepic').startsWith('h')) {
                    linkObject.img = USdata.get('profilepic');
                } else {
                    this.storage.storage.refFromURL(USdata.get('profilepic')).getDownloadURL().then(url => {
                        linkObject.img = url;
                    }).catch((e) => console.log(e));
                }
                this.links.push(linkObject);
            });
        }));
    }

    closeModal() {
        // using the injected ModalController this page
        // can "dismiss" itself and optionally pass back data
        this.modalCtrl.dismiss({
            dismissed: true
        });
    }

    async presentToast(m: string) {
        const toast = await this.toastController.create({
            message: m,
            duration: 2000
        });
        toast.present();
    }

    handleInput(event) {
        const query = event.target.value.toLowerCase();
        // console.log(query);
        for (let i = 0; i < document.getElementsByTagName('ion-item').length; i++) {
            const shouldShow = document.getElementsByTagName('h2')[i].textContent.toLowerCase().indexOf(query) > -1;
            document.getElementsByTagName('ion-item')[i].style.display = shouldShow ? 'block' : 'none';
        }
    }
}