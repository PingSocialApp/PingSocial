import { Injectable } from '@angular/core';
import {AngularFirestoreDocument, AngularFirestore} from '@angular/fire/firestore';
import {ToastController} from '@ionic/angular';
import {AngularFireAuth} from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class RequestsProgramService {
  currentUserRef: AngularFirestoreDocument;
  currentUserId: string;

  constructor(private firestore: AngularFirestore, private toastController: ToastController, private auth: AngularFireAuth) {
    this.auth.auth.onAuthStateChanged((user) => {
      if(user) {
        this.currentUserId = user.uid;
        this.currentUserRef = this.firestore.collection('users').doc(user.uid);
      }
    });
  }

  sendRequest(userId: string, optionsData: string){
    if(this.currentUserId === userId){
      this.presentToast('Whoops, this is your code!');
      return;
    }
    this.firestore.collection('links', ref => ref.where('userSent', '==', this.currentUserRef.ref)
        .where('userRec', '==', this.firestore.collection('users').doc(userId).ref).where('pendingRequest', '==', true))
        .snapshotChanges().subscribe(data => {
          if(data.length !== 0){
              this.presentToast('Your Request is Pending');
          }else{
            this.firestore.collection('links').add({
              pendingRequest: true,
              userSent: this.currentUserRef.ref,
              userRec: this.firestore.collection('users').doc(userId).ref,
              linkPermissions: optionsData + '/' + userId
            }).then((data) => {
                this.presentToast('Sent Request!');
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
