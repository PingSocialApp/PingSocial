import {Component, OnDestroy, OnInit} from '@angular/core';
import {ModalController, Platform} from '@ionic/angular';
import {PhysicalmapComponent} from './physicalmap/physicalmap.component';
import {AngularFireAuth} from '@angular/fire/auth';
import {environment} from '../../environments/environment';
import * as mapboxgl from 'mapbox-gl';
import {QrcodePage} from './qrcode/qrcode.page';
import { FCM } from '@capacitor-community/fcm';
import {Subscription} from 'rxjs';
import {AngularFireDatabase} from '@angular/fire/database';
import { AuthHandler } from '../services/authHandler.service';

@Component({
    selector: 'app-tab2',
    templateUrl: 'tab2.page.html',
    styleUrls: ['tab2.page.scss'],
    providers: [AngularFireDatabase, AngularFireAuth, PhysicalmapComponent]
})

export class Tab2Page implements OnInit, OnDestroy {
    unreadPings: any;
    private unreadPingSub: Subscription;
    private notifToken: Subscription;

    constructor(private pm: PhysicalmapComponent, private platform: Platform, private auth: AuthHandler,
                private modalController: ModalController, private fcm: FCM, private db: AngularFireDatabase) {

        mapboxgl.accessToken = environment.mapbox.accessToken;
    }

    ngOnInit(): void {
        this.unreadPingSub = this.db.object('numPings/' + this.auth.getUID()).valueChanges().subscribe(res => {
            this.unreadPings = res;
        });


        // TODO Set Notif Token
        // if (this.platform.is('cordova')) {
        //     this.fcm.getToken().then(token => {
        //         this.firestore.collection('notifTokens').doc(this.currentUserId).update({
        //             notifToken: token
        //         });
        //     });
        // }
    }

    ngOnDestroy() {
        this.unreadPingSub.unsubscribe();
        // this.notifToken.unsubscribe();
    }

    async presentQRModal() {
        const modal = await this.modalController.create({
            component: QrcodePage
        });
        return await modal.present();
    }

    presentEventCreatorModal(s: string) {
        this.pm.presentEventCreatorModal('');
    }
}
