import {Injectable} from '@angular/core';
import {AngularFirestoreDocument, AngularFirestore} from '@angular/fire/firestore';
import {ToastController} from '@ionic/angular';
import {AngularFireAuth} from '@angular/fire/auth';
import {firestore} from 'firebase';

@Injectable({
    providedIn: 'root'
})
export class RequestsProgramService {
    currentUserRef: AngularFirestoreDocument;
    currentUserId: string;

    constructor(private firestore: AngularFirestore, private toastController: ToastController, private auth: AngularFireAuth) {
        this.currentUserId = this.auth.auth.currentUser.uid;
        this.currentUserRef = this.firestore.collection('users').doc(this.currentUserId);
    }

    sendRequest(userId: string, optionsData: number) {
        if (this.currentUserId === userId) {
            this.presentToast('Whoops, this is your code!');
            return;
        }
        this.firestore.collection('links', ref => ref.where('userSent', '==', this.currentUserRef.ref)
            .where('userRec', '==', this.firestore.collection('users').doc(userId).ref).where('pendingRequest', '==', true))
            .get().subscribe(data => {
            if (!data.empty) {
                this.presentToast('Your Request is Pending');
            } else {
                this.firestore.collection('links').add({
                    pendingRequest: true,
                    userSent: this.currentUserRef.ref,
                    userRec: this.firestore.collection('users').doc(userId).ref,
                    linkPermissions: 0
                }).then((data) => {
                    this.presentToast('Sent Request!');
                });
            }
        });
        this.firestore.collection('links', ref => ref.where('userRec', '==', this.currentUserRef.ref)
            .where('userSent', '==', this.firestore.collection('users').doc(userId).ref).where('pendingRequest', '==', true))
            .get().subscribe(newData => {
            if (!newData.empty) {
                this.presentToast('Your Request is Pending');
            } else {
                this.firestore.collection('links').add({
                    pendingRequest: false,
                    userRec: this.currentUserRef.ref,
                    userSent: this.firestore.collection('users').doc(userId).ref,
                    linkPermissions: optionsData
                }).then((data) => {
                    this.presentToast('Sent Request!');
                });
            }
        });
        this.firestore.collection('pings').add({
            userSent: this.currentUserRef.ref,
            userRec: this.firestore.collection('users').doc(userId).ref,
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
