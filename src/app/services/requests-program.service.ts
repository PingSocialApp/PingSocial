import {Injectable} from '@angular/core';
import {AngularFirestoreDocument, AngularFirestore} from '@angular/fire/firestore';
import {ToastController} from '@ionic/angular';
import {AngularFireAuth} from '@angular/fire/auth';
import {firestore} from 'firebase/app';

@Injectable({
    providedIn: 'root'
})
export class RequestsProgramService {
    currentUserRef: AngularFirestoreDocument;
    currentUserId: string;

    constructor(private afs: AngularFirestore, private toastController: ToastController, private auth: AngularFireAuth) {
        this.currentUserId = this.auth.auth.currentUser.uid;
        this.currentUserRef = this.afs.collection('users').doc(this.currentUserId);
    }

    sendRequest(userId: string, optionsData: number) {
        if (this.currentUserId === userId) {
            this.presentToast('Whoops, this is your code!');
            return;
        }

        const otherUserRef = this.afs.collection('users').doc(userId);

        this.currentUserRef.collection('links', ref => ref.where('pendingRequest', '==', true)
            .where('otherUser', '==', otherUserRef.ref)).get().subscribe(data => {
            if (!data.empty) {
                console.log(data.docs);
                data.docs[0].ref.update({
                    pendingRequest: false
                });
            } else {
                this.currentUserRef.collection('links').add({
                    pendingRequest: false,
                    otherUser: otherUserRef.ref,
                    linkPermissions: 0
                }).then((d) => {
                    this.presentToast('Sent Request!');
                });
            }
        });

        otherUserRef.collection('links', ref => ref.where('pendingRequest', '==', true)
            .where('otherUser', '==', this.currentUserRef.ref)).get().subscribe(data => {
            if (!data.empty) {
                data.docs[0].ref.update({
                    pendingRequest: false
                });
            } else {
                otherUserRef.collection('links').add({
                    pendingRequest: true,
                    otherUser: this.currentUserRef.ref,
                    linkPermissions: 0
                }).then((d) => {
                    this.presentToast('Sent Request!');
                });
            }
        });

        this.afs.collection('pings').add({
            userSent: this.currentUserRef.ref,
            userRec: otherUserRef.ref,
            sentMessage: '',
            responseMessage: 'New Link Created!',
            timeStamp: firestore.FieldValue.serverTimestamp()
        });
    }

    async presentToast(m: string) {
        const toast = await this.toastController.create({
            message: m,
            duration: 2000
        });
        await toast.present();
    }
}
