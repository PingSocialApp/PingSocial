import {Component, OnDestroy, OnInit} from '@angular/core';
import {ModalController} from '@ionic/angular';
import {PhysicalmapComponent} from './physicalmap/physicalmap.component';
import {AngularFireAuth} from '@angular/fire/auth';
import {environment} from '../../environments/environment';
import * as mapboxgl from 'mapbox-gl';
import {QrcodePage} from './qrcode/qrcode.page';
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

    constructor(private pm: PhysicalmapComponent, private auth: AuthHandler,
                private modalController: ModalController, private db: AngularFireDatabase) {

        mapboxgl.accessToken = environment.mapbox.accessToken;
    }

    ngOnInit(): void {
        this.unreadPingSub = this.db.object('userNumerics/numPings/' + this.auth.getUID()).valueChanges().subscribe(res => {
            this.unreadPings = res;
        },(error) => console.error(error));
    }

    ngOnDestroy() {
        this.unreadPingSub.unsubscribe();
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
