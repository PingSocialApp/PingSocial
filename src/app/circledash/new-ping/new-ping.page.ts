import {Component, OnInit} from '@angular/core';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {ModalController, ToastController} from '@ionic/angular';
import * as firebase from 'firebase/app';
import {AngularFireStorage} from '@angular/fire/storage';

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
    providers: [AngularFireStorage]
})

export class NewPingPage implements OnInit {
    currentUserRef: AngularFirestoreDocument;
    currentUser: any;
    links: Array<Link>;

    constructor(private firestore: AngularFirestore, private modalCtrl: ModalController, private toastController: ToastController, private storage: AngularFireStorage) {
        this.currentUserRef = this.firestore.collection('users').doc(
            '4CMyPB6tafUbL1CKzCb8');
        this.links = [];
        this.firestore.collection('links', ref => ref.where('userSent', '==', this.currentUserRef.ref)).snapshotChanges().subscribe(res => {
            this.links = [];
            this.renderLink(res);
        });
    }

    ngOnInit() {
        this.currentUserRef.snapshotChanges()
            .subscribe(res => {
                this.currentUser = res.payload.data();
            });
    }

    sendPing() {
        const toggle = (document.getElementsByTagName('ion-checkbox') as unknown as Array<any>);
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < toggle.length; i++) {
            if (toggle[i].checked) {
                this.firestore.collection('users').doc(toggle[i].id).get().subscribe(userdata => {
                    this.firestore.collection('pings').add({
                        sentMessage: (document.getElementById('sendingMessageSelect') as HTMLIonSelectElement).value,
                        userSent: this.currentUserRef.ref,
                        userRec: this.firestore.collection('users').doc(toggle[i].id).ref,
                        timeStamp: firebase.firestore.FieldValue.serverTimestamp(),
                        responseMessage: ''
                    }).then(newPingId => {
                        this.firestore.collection('users').doc(userdata.id).update({
                            unreadPings: firebase.firestore.FieldValue.arrayUnion(newPingId)
                        }).then(value => {
                            this.presentToast();
                            this.closeModal();
                        });
                    });
                });
            }
        }

    }

    async renderLink(linkData: Array<any>) {
        await Promise.all(linkData.map(link => {
            const linkeD = link.payload.doc.data();
            linkeD.userRec.get().then(USdata => {
                let imgUrl = '';
                if (this.currentUser.profilepic.startsWith('h')) {
                    imgUrl = this.currentUser.profilepic;
                } else {
                    this.storage.storage.refFromURL(this.currentUser.profilepic).getDownloadURL().then(url => {
                        imgUrl = url;
                    });
                }
                const linkObject: Link = {
                    id: USdata.id,
                    img: imgUrl,
                    name: USdata.data().name,
                    bio: USdata.data().bio
                };
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

    async presentToast() {
        const toast = await this.toastController.create({
            message: 'Ping Sent!',
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
