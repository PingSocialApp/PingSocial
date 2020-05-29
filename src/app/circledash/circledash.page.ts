import { Component, OnInit } from '@angular/core';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {ModalController, PopoverController, ToastController} from '@ionic/angular';
import {NewPingPage} from './new-ping/new-ping.page';
import { ReplypopoverComponent} from './replypopover/replypopover.component';
import {AngularFireStorage} from '@angular/fire/storage';
import {FirestoreService} from '../firestore.service';

export interface Ping{
    id: any;
    userSentImg: string;
    userSentId: string;
    userSent: string;
    sentMessage: string;
    recMessage: string;
}

@Component({
  selector: 'app-circledash',
  templateUrl: './circledash.page.html',
  styleUrls: ['./circledash.page.scss'],
    providers: [AngularFireStorage]
})


export class CircledashPage implements OnInit {
  currentUser: AngularFirestoreDocument;
  pingArray: Array<Ping>;
  responseMessages: Array<string>;


    // tslint:disable-next-line:max-line-length
  constructor(private fs: FirestoreService, private firestore: AngularFirestore, public popoverController: PopoverController, public modalController: ModalController,
              private toastController: ToastController, private storage: AngularFireStorage) {
    this.pingArray = [];
    this.responseMessages = [];
      this.fs.userData
          .subscribe(res => {
              if(res !== null){
                  this.renderPings(res.payload.data().unreadPings);
                  this.pingArray = [];
                  this.responseMessages = res.payload.data().responseMessage;
              }
          });
  }

   ngOnInit() {

  }

    async renderPings(unreadPings: any) {
       await Promise.all(unreadPings.map(ping => {
           ping.get().then(pingdata => {
               const pingId = ping.id;
               pingdata = pingdata.data();
               if (pingdata.responseMessage === '') {
                   pingdata.userSent.get().then(userdata => {
                       let imgUrl = '';
                       if (userdata.data().profilepic.startsWith('h')) {
                           imgUrl = userdata.data().profilepic;
                       } else {
                           this.storage.storage.refFromURL(userdata.data().profilepic).getDownloadURL().then(url => {
                               imgUrl = 'url(' + url + ')';
                           });
                       }
                       const pingObject: Ping = {
                           id: pingId,
                           userSentId: userdata.id,
                           userSentImg: imgUrl,
                           userSent: userdata.data().name,
                           sentMessage: pingdata.sentMessage,
                           recMessage: ''
                       };
                       this.pingArray.push(pingObject);
                   }).catch(e => {
                       console.log(e);
                   });
               } else {
                   pingdata.userRec.get().then(userdata => {
                       // userdata = userdata.data();
                       let imgUrl = '';
                       if (userdata.data().profilepic.startsWith('h')) {
                           imgUrl = userdata.data().profilepic;
                       } else {
                           this.storage.storage.refFromURL(userdata.data().profilepic).getDownloadURL().then(url => {
                               imgUrl = 'url(' + url + ')';
                           });
                       }
                       const pingObject: Ping = {
                           id: pingId,
                           userSentImg: imgUrl,
                           userSent: userdata.data().name,
                           userSentId: userdata.id,
                           sentMessage: pingdata.sentMessage,
                           recMessage: pingdata.responseMessage
                       };

                       this.pingArray.push(pingObject);
                   }).catch(e => {
                       console.log(e);
                   });
               }
           });
        }));
    }

    async presentNewPingModal() {
        const modal = await this.modalController.create({
            component: NewPingPage,
        });
        return await modal.present();
    }

    handleInput(event) {
        const query = event.target.value.toLowerCase();
        // console.log(query);
        for (let i = 0; i < document.getElementsByTagName('ion-item').length; i++) {
            const shouldShow = document.getElementsByTagName('h2')[i].textContent.toLowerCase().indexOf(query) > -1 ||
                document.getElementsByTagName('h3')[i].textContent.toLowerCase().indexOf(query) > -1;
            document.getElementsByTagName('ion-item-sliding')[i].style.display = shouldShow ? 'block' : 'none';
        }
    }

    async replyPing(ev: any, id: any, us: string) {
        const popover = await this.popoverController.create({
            component: ReplypopoverComponent,
            event: ev,
            componentProps: {
                messages: this.responseMessages,
                pingId: id,
                fs: this.firestore,
                userSent: us
            },
            translucent: true
        });
        await popover.present();
    }

    deletePing(id: any){
      this.firestore.collection('pings').doc(id).delete().then(async function() {
          console.log('Document successfully deleted!');
          this.presentToast('Ping Successfully Deleted!');
      }).catch((error) => {
          console.error('Error removing document: ', error);
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
