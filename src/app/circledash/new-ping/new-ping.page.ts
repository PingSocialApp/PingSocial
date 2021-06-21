import {Component, OnDestroy, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {ModalController} from '@ionic/angular';
import {firestore} from 'firebase/app';
import {AngularFireAuth} from '@angular/fire/auth';
import {BehaviorSubject} from 'rxjs';
import { UtilsService } from 'src/app/services/utils.service';
import { AuthHandler } from 'src/app/services/authHandler.service';
import { v4 as uuidv4 } from 'uuid';
import { LinksService } from 'src/app/services/links.service';

@Component({
    selector: 'app-new-ping',
    templateUrl: './new-ping.page.html',
    styleUrls: ['./new-ping.page.scss'],
    providers: [AngularFireAuth]
})

export class NewPingPage implements OnInit, OnDestroy {
    links: any;
    offset: number;
    linksBS: BehaviorSubject<number>;
    pingMessage: string;

    constructor(private fs: AngularFirestore,  private modalCtrl: ModalController,
                private utils: UtilsService, private ls: LinksService, private auth: AuthHandler) {
    }

    ngOnInit() {
        this.offset = 0;
        this.linksBS = new BehaviorSubject(this.offset);
        this.linksBS.subscribe(() => this.getLinks());
    }

    ngOnDestroy() {
        this.links.unsubscribe();
    }

    getLinks() {
        this.links = this.ls.getAllLinks(this.offset);
    }

    doRefresh(event) {
        this.offset = 0;
        this.linksBS.next(this.offset);
        event.target.complete();
    }

    loadData(event){
        ++this.offset;
        this.linksBS.next(this.offset);
        event.target.complete();
    }

    sendPing() {
        if (this.pingMessage === '' || this.pingMessage === undefined) {
            this.utils.presentToast('Whoops! You have an empty message');
            return;
        }
        const toggles = (document.getElementsByTagName('ion-checkbox') as unknown as Array<any>);
        const batch = this.fs.firestore.batch();
        for (const toggle of toggles) {
            if (toggle.checked) {
                batch.set(uuidv4, {
                    responseMessage: this.pingMessage,
                    userSent: this.auth.getUID(),
                    userRec: toggle.id,
                    timeStamp: firestore.FieldValue.serverTimestamp(),
                    sentMessage: 'New Message!'
                })
            }
        }
        batch.commit().then(() => this.closeModal()).catch(e => {
            console.error(e);
            this.utils.presentToast('Whoops! Pings not sent');
        })
    }

    closeModal() {
        this.modalCtrl.dismiss({
            dismissed: true
        });
    }

    handleInput(event) {
        const query = event.target.value.toLowerCase();
        for (let i = 0; i < document.getElementsByTagName('ion-item').length; i++) {
            const shouldShow = document.getElementsByTagName('h2')[i].textContent.toLowerCase().indexOf(query) > -1;
            document.getElementsByTagName('ion-item')[i].style.display = shouldShow ? 'block' : 'none';
        }
    }
}