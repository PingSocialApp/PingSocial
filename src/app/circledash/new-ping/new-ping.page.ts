import {Component, OnInit} from '@angular/core';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {ModalController, ToastController} from '@ionic/angular';
import {firestore} from 'firebase/app';
import {AngularFireStorage} from '@angular/fire/storage';
import {AngularFireAuth} from '@angular/fire/auth';
import {map, mergeMap} from 'rxjs/operators';
import {forkJoin, Observable} from 'rxjs';

@Component({
    selector: 'app-new-ping',
    templateUrl: './new-ping.page.html',
    styleUrls: ['./new-ping.page.scss'],
    providers: [AngularFireStorage, AngularFireAuth]
})

export class NewPingPage implements OnInit {
    currentUserRef: AngularFirestoreDocument;
    links: Observable<any>;
    pingMessage: string;

    constructor(private fs: AngularFirestore, private auth: AngularFireAuth, private modalCtrl: ModalController,
                private toastController: ToastController, private storage: AngularFireStorage) {
        this.currentUserRef = this.fs.collection('users').doc(this.auth.auth.currentUser.uid);
    }

    ngOnInit() {
        this.links = this.currentUserRef.collection('links', ref => ref.where('pendingRequest', '==', false)).get()
            .pipe(mergeMap(querySnap => forkJoin(
                querySnap.docs.map(doc => doc.get('otherUser').get())
            )), map((val: any) => {
                return val.map(userData => {
                    return {
                        id: userData.id,
                        img: this.getImage(userData.get('profilepic')),
                        name: userData.get('name'),
                        bio: userData.get('bio')
                    };
                });
            }));
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

    async getImage(profilePic: string) {
        if (profilePic.startsWith('h')) {
            return profilePic;
        } else {
            return await this.storage.storage.refFromURL(profilePic).getDownloadURL().then(url => {
                return url;
            }).catch((e) => console.log(e));
        }
    }

    closeModal() {
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