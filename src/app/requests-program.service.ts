import { Injectable } from '@angular/core';
import {AngularFirestoreDocument, AngularFirestore} from '@angular/fire/firestore';
import {ToastController} from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class RequestsProgramService {
  userRef: AngularFirestoreDocument;

  constructor(private firestore: AngularFirestore, private toastController: ToastController) {
    this.userRef = this.firestore.collection('users').doc(
        '4CMyPB6tafUbL1CKzCb8');
  }

  sendRequest(userId: string){
    this.firestore.collection('links', ref => ref.where('userSent', '==', this.userRef.ref)
        .where('userRec', '==', this.firestore.collection('users').doc(userId).ref).where('pendingRequest', '==', true))
        .snapshotChanges().subscribe(data => {
          if(data.length !== 0){
              this.presentToast('Your Request is Pending');
          }else{
            this.firestore.collection('links').add({
              pendingRequest: true,
              userSent: this.firestore.collection('users').doc(
                  '4CMyPB6tafUbL1CKzCb8').ref,
              userRec: this.firestore.collection('users').doc(userId).ref
            }).then((data) => {
                this.presentToast('Sent Request!')
            });
          }
    });

  }

  async presentToast(m: string) {
    const toast = await this.toastController.create({
      message: m,
      duration: 2000
    });
    toast.present();
  }
}
