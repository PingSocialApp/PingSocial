import {AfterViewInit, Component, OnInit} from '@angular/core';
import {ModalController, Platform} from '@ionic/angular';
import {AngularFireAuth} from '@angular/fire/auth';
import {QrcodePage} from './qrcode/qrcode.page';
import {FCM} from '@ionic-native/fcm/ngx';
import {AngularFirestore} from '@angular/fire/firestore';
import {EventcreatorPage} from './eventcreator/eventcreator.page';

@Component({
    selector: 'app-tab2',
    templateUrl: 'tab2.page.html',
    styleUrls: ['tab2.page.scss'],
    providers: [AngularFireAuth, AngularFirestore]
})

export class Tab2Page implements OnInit, AfterViewInit {
    currentUserId: string;
    currentUserRef: any;
    unreadPings: number;
    currentIcon: string;

    currentSlide: number;
    slides: HTMLIonSlidesElement;

    constructor(private platform: Platform, private firestore: AngularFirestore, private auth: AngularFireAuth,
                private modalController: ModalController, private fcm: FCM) {

        this.currentUserId = this.auth.auth.currentUser.uid;
        this.currentUserRef = this.firestore.collection('users').doc(this.currentUserId);

        this.firestore.collection('pings', ref => ref.where('userRec', '==', this.currentUserRef.ref)
        ).valueChanges().subscribe(res => {
            if (res !== null) {
                this.unreadPings = res.length;
            }
        });
        this.currentIcon = 'desktop-outline';
        this.currentSlide = 0;
    }

    ngOnInit(): void {
        if (this.platform.is('cordova')) {
            this.fcm.getToken().then(token => {
                this.firestore.collection('notifTokens').doc(this.currentUserId).update({
                    notifToken: token
                });
            });
        }
    }

    ngAfterViewInit() {
        this.slides = (document.getElementById('mapslides') as HTMLIonSlidesElement);
        this.slides.lockSwipes(true).then(res => {});
    }


    async presentQRModal() {
        const modal = await this.modalController.create({
            component: QrcodePage
        });
        return await modal.present();
    }

    switchMap(){
        this.slides.getActiveIndex().then(r => {
            this.slides.lockSwipes(false).then(res => {});
            this.currentSlide = r;
            if(r % 2 === 1){
                this.slides.slidePrev().then(re => {
                    this.slides.lockSwipes(true).then(res => {});
                });
                this.currentIcon = 'desktop-outline';
            }else{
                this.slides.slideNext().then(re => {
                    this.slides.lockSwipes(true).then(res => {});
                });
                this.currentIcon = 'location';
            }
        });
    }

    async presentEventCreatorModal(data: string) {
        const modal = await this.modalController.create({
            component: EventcreatorPage,
            componentProps: {
                eventID: data
            }
        });
        return await modal.present();
    }
}
