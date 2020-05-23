import { Injectable } from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireMessaging} from '@angular/fire/messaging';
import {Platform} from '@ionic/angular';
import * as firebase from 'firebase/app';

@Injectable({
  providedIn: 'root',
})

export class NotificationsService {

  constructor(public afs: AngularFirestore, private platform: Platform, public afMessaging: AngularFireMessaging) { }

  async getToken(userId: string){
    this.afMessaging.requestToken
        .subscribe(
            (token) => {
                this.afs.collection('devices').doc(userId).update({
                    devices: firebase.firestore.FieldValue.arrayUnion(token)
                });
                console.log('Permission granted! Save to the server!', token);
              },
            (error) => { console.error(error); },
        );
  }

    listen() {
        this.afMessaging.messages
            .subscribe((message) => {
                return message;
            });
    }

}
