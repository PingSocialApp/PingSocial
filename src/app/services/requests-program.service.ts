import {Injectable} from '@angular/core';
import {AngularFirestoreDocument, AngularFirestore} from '@angular/fire/firestore';
import {ToastController} from '@ionic/angular';
import {AngularFireAuth} from '@angular/fire/auth';
import {firestore} from 'firebase/app';
import {first} from 'rxjs/operators';

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

        this.currentUserRef.collection('links', ref => ref
            .where('otherUser', '==', otherUserRef.ref)).get().pipe(first()).subscribe(data => {
            if (!data.empty) {
                if(data.docs[0].get('pendingRequest')){
                    data.docs[0].ref.update({
                        pendingRequest: false
                    }).then(val => {
                       this.presentToast('This member\'s request has been accepted');
                    });
                }else{
                    this.presentToast('This member is already added!');
                }
            } else {
                this.currentUserRef.collection('links').add({
                    pendingRequest: false,
                    otherUser: otherUserRef.ref,
                    linkPermissions: optionsData
                }).then((d) => {
                    this.presentToast('Sent Request!');
                });
            }
        });

        otherUserRef.collection('links', ref => ref
            .where('otherUser', '==', this.currentUserRef.ref)).get().pipe(first()).subscribe(data => {
            if (!data.empty) {
                if(data.docs[0].get('pendingRequest')) {
                    this.presentToast('Waiting for member to accept your request');
                }else{
                    this.presentToast('This member is already added!');
                }
            } else {
                otherUserRef.collection('links').add({
                    pendingRequest: true,
                    otherUser: this.currentUserRef.ref,
                    linkPermissions: 0
                }).then((d) => {
                    this.presentToast('Sent Request!');
                    this.afs.collection('pings').add({
                        userSent: this.currentUserRef.ref,
                        userRec: otherUserRef.ref,
                        sentMessage: '',
                        responseMessage: 'New Link Created!',
                        timeStamp: firestore.FieldValue.serverTimestamp()
                    });
                });
            }
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
