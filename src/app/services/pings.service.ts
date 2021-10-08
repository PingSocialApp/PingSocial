import { Injectable } from '@angular/core';
import {firestore} from 'firebase/app';
import {AngularFirestore} from '@angular/fire/firestore';
import { v4 as uuidv4 } from 'uuid';
import { AuthHandler } from './authHandler.service';
import { UsersService } from './users.service';
import { UtilsService } from './utils.service';


@Injectable({
  providedIn: 'root'
})
export class PingsService {

  constructor(private afs: AngularFirestore, private auth: AuthHandler, private us: UsersService, private utils: UtilsService) { }

  sendPing(members: Array<any>, message: string): Promise<void> {
    if(!this.us.myObj){
      console.error('No myObj');
      this.utils.presentToast('Whoops! Failed to send Ping', 'error');
      return;
    }

    const batch = this.afs.firestore.batch();
    for(const member of members){
      batch.set(this.afs.collection('pings').doc(uuidv4()).ref, {
        responseMessage: message,
        userSent: {
            id: this.auth.getUID(),
            name: this.us.myObj.name,
            profilepic: this.us.myObj.profilepic,
        },
        userRec: {
            id: member.uid,
            name: member.name,
            profilepic: member.profilepic,
        },
        timeStamp: firestore.FieldValue.serverTimestamp(),
        sentMessage: 'New Message!'
      });
    }

    return batch.commit();
  }
}
