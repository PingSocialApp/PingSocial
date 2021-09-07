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
import { EventsService } from '../services/events.service';
import { concatMap } from 'rxjs/operators';
// import { NotificationService } from '../services/notification.service';

@Component({
    selector: 'app-tab2',
    templateUrl: 'tab2.page.html',
    styleUrls: ['tab2.page.scss'],
    providers: [AngularFireDatabase, AngularFireAuth, PhysicalmapComponent]
})

export class Tab2Page implements OnInit, OnDestroy {
    unreadPings: number | any;
    private unreadPingSub: Subscription;
    checkedInSub: Subscription;

    constructor(private auth: AuthHandler, private es: EventsService,
                // private ns: NotificationService
                private modalController: ModalController, private db: AngularFireDatabase) {

        mapboxgl.accessToken = environment.mapbox.accessToken;
    }

    ngOnInit(): void {
        this.unreadPings = 0;
        this.unreadPingSub = this.auth.getUIDSub().pipe(concatMap((val:any) =>
            this.db.object('userNumerics/numPings/' + val.uid).valueChanges())).subscribe(res => {
            this.unreadPings = res;
        },(error) => console.error(error));

        this.checkedInSub = this.db.object('checkedIn/' + this.auth.getUID()).valueChanges().subscribe((val:string) => {
          this.es.checkedInEvent.next(val || '');
        });
        // this.ns.initPush();
    }

    ngOnDestroy() {
        this.unreadPingSub.unsubscribe();
        this.checkedInSub.unsubscribe();
    }

    async presentQRModal() {
        const modal = await this.modalController.create({
            component: QrcodePage
        });
        return await modal.present();
    }
}