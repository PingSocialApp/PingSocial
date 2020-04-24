import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import {SettingsPage} from '../settings/settings.page';
import {AngularFirestore} from '@angular/fire/firestore';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {
  unreadPings: number;

  constructor(public modalController: ModalController, private firestore: AngularFirestore) {
      this.firestore.collection('users').doc('4CMyPB6tafUbL1CKzCb8').snapshotChanges().subscribe(ref => {
        // @ts-ignore
        this.unreadPings = ref.payload.data().unreadPings.length;
      });
  }

  async presentModal() {
    const modal = await this.modalController.create({
      component: SettingsPage
    });
    return await modal.present();
  }

}
