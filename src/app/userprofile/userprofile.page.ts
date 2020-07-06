import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AngularFirestore, AngularFirestoreDocument, DocumentReference} from '@angular/fire/firestore';
import {RequestsProgramService} from '../requests-program.service';
import {AngularFireStorage} from '@angular/fire/storage';
import {AlertController, ModalController, ToastController} from '@ionic/angular';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFireDatabase} from '@angular/fire/database';
import {environment} from '../../environments/environment';
import * as mapboxgl from 'mapbox-gl';

@Component({
    selector: 'app-userprofile',
    templateUrl: './userprofile.page.html',
    styleUrls: ['./userprofile.page.scss'],
    providers: [RequestsProgramService, AngularFireStorage, AngularFireAuth, AngularFireDatabase]
})
export class UserprofilePage implements OnInit {
    currCode: number;
    userRef: AngularFirestoreDocument;
    linkDoc: DocumentReference;
    userId: string;
    userName: string;
    userBio: string;
    displayTF: boolean;
    theirInfo: boolean;
    myInfo: boolean;
    img: string;
    userPhone: string;
    userInstagram: string;
    userFacebook: string;
    userLinkedin: string;
    userProfessionalEmail: string;
    userTiktok: string;
    userPersonalEmail: string;
    userTwitter: string;
    userWebsite: string;
    userVenmo: string;
    userSnapchat: string;
    phone: boolean;
    email: boolean;
    instagram: boolean;
    snapchat: boolean;
    facebook: boolean;
    tiktok: boolean;
    twitter: boolean;
    venmo: boolean;
    linkedin: boolean;
    professionalemail: boolean;
    website: boolean;
    location: boolean;
    userLocation = '';

    constructor(private modalController: ModalController, private alertController: AlertController, private rtdb: AngularFireDatabase, private acr: ActivatedRoute, private auth: AngularFireAuth, private firestore: AngularFirestore, private rps: RequestsProgramService,
                private storage: AngularFireStorage, private toastController: ToastController) {
        mapboxgl.accessToken = environment.mapbox.accessToken;
        this.displayTF = true;
        this.userRef = this.firestore.collection('users').doc(this.acr.snapshot.params.id);
        this.userRef.snapshotChanges()
            .subscribe(res => {
                // @ts-ignore
                const userData = res.payload.data();
                this.userId = res.payload.id;
                this.userName = userData.name;
                this.userBio = userData.bio;

                if (userData.profilepic.startsWith('h')) {
                    this.img = userData.profilepic;
                } else {
                    this.storage.storage.refFromURL(userData.profilepic).getDownloadURL().then(url => {
                        this.img = url;
                    });
                }

                this.firestore.collection('links', ref => ref.where('userSent', '==', this.userRef.ref)
                    .where('userRec', '==', this.firestore.collection('users').doc(
                        this.auth.auth.currentUser.uid).ref).where('pendingRequest', '==', false)
                ).snapshotChanges().subscribe(linkeData => {
                    if (linkeData.length !== 0) {
                        this.renderUserPermissions(userData, linkeData[0].payload.doc.data());
                        this.theirInfo = true;
                    } else {
                        this.theirInfo = false;
                    }
                });
            });
        this.firestore.collection('links', ref => ref.where('userRec', '==', this.userRef.ref)
            .where('userSent', '==', this.firestore.collection('users').doc(
                this.auth.auth.currentUser.uid).ref)
            .where('pendingRequest', '==', false)).get().subscribe(res => {
            if (!res.empty) {
                this.linkDoc = res.docs[0].ref;
                this.renderMyPermissions(res.docs[0].data());
                this.myInfo = true;
            } else {
                this.myInfo = false;
            }
        });
    }

    ngOnInit() {
        this.closeModal();
    }

    segmentChanged(ev: any) {
        this.displayTF = ev.detail.value === 'tf';
    }

    createRequest(id: string) {
        this.rps.sendRequest(id, 2047);
    }

    renderUserPermissions(userData: any, userPermissions: any) {
        const permissions = this.getPermission(userPermissions.linkPermissions);

        this.userPhone = permissions[1] ? userData.numberID.replace('(', '').replace(')', '')
            .replace('-', '').replace(' ', '') : '';
        this.userPersonalEmail = permissions[2] ? userData.personalEmailID : '';
        this.userInstagram = permissions[3] ? userData.instagramID : '';
        this.userSnapchat = permissions[4] ? userData.snapchatID : '';
        this.userFacebook = permissions[5] ? userData.facebookID : '';
        this.userTiktok = permissions[6] ? userData.tiktokID : '';
        this.userTwitter = permissions[7] ? userData.twitterID : '';
        this.userVenmo = permissions[8] ? userData.venmoID : '';
        this.userLinkedin = permissions[9] ? userData.linkedinID : '';
        this.userProfessionalEmail = permissions[10] ? userData.professionalEmailID : '';
        let website;
        if (!((userData.websiteID.includes('http://')) || (userData.websiteID.includes('https://')) || userData.websiteID.length <= 0)) {
            website = 'http://' + userData.websiteID;
        } else {
            website = userData.websiteID;
        }
        this.userWebsite = permissions[11] ? website : '';
        this.rtdb.database.ref('/location/' + this.userId).on('value', snapshot => {
            if (snapshot.val()) {
                // get other users longitude, latitude, and lastOnline vals
                const locat = snapshot.val().place == null ? 'Unavailable' : snapshot.val().place;

                const currTime = Date.now();
                const lastOn = snapshot.val().lastOnline;
                const oStat = this.convertTime(currTime - lastOn);

                this.userLocation = permissions[0] ? locat + ' ' + oStat : '';
            }
        });
    }

    convertTime(t) {
        if (t >= 86_400_000) {
            // days
            return Math.floor(t / 86_400_000) + 'd ago';
        } else if (t >= 3_600_000) {
            // hours
            return Math.floor(t / 3_600_000) + 'h ago';
        } else if (t >= 60_000) {
            // mins
            return Math.floor(t / 60_000) + 'm ago';
        } else if (t >= 1000) {
            // secs
            return Math.floor(t / 1000) + 's ago';
        } else {
            return 'Just Now';
        }
    }

    renderMyPermissions(myData: any) {
        const permissions = this.getPermission(myData.linkPermissions);
        this.location = permissions[0];
        this.phone = permissions[1];
        this.email = permissions[2];
        this.instagram = permissions[3];
        this.snapchat = permissions[4];
        this.facebook = permissions[5];
        this.tiktok = permissions[6];
        this.twitter = permissions[7];
        this.venmo = permissions[8];
        this.linkedin = permissions[9];
        this.professionalemail = permissions[10];
        this.website = permissions[11];
    }

    getPermission(value: any) {
        const permissions = value.toString(2).split('');
        while(permissions.length < 12) {
            permissions.unshift('0');
        }
        const boolValues = [];
        for(let i = 0; i < 12; i++){
            boolValues[i] = permissions[i] === '1';
        }
        return boolValues;
    }

    closeModal() {
        // using the injected ModalController this page
        // can "dismiss" itself and optionally pass back data
        this.modalController.dismiss({
            dismissed: true
        });
    }

    changePermissions() {
        // tslint:disable-next-line:no-bitwise
        const locationVal = +!!this.location << 11;
        // tslint:disable-next-line:no-bitwise
        const phoneVal = +!!this.phone << 10;
        // tslint:disable-next-line:no-bitwise
        const emailVal = +!!this.email << 9;
        // tslint:disable-next-line:no-bitwise
        const instagramVal = +!!this.instagram << 8;
        // tslint:disable-next-line:no-bitwise
        const snapVal = +!!this.snapchat << 7;
        // tslint:disable-next-line:no-bitwise
        const facebookVal = +!!this.facebook << 6;
        // tslint:disable-next-line:no-bitwise
        const tiktokVal = +!!this.tiktok << 5;
        // tslint:disable-next-line:no-bitwise
        const twitterVal = +!!this.twitter << 4;
        // tslint:disable-next-line:no-bitwise
        const venmoVal = +!!this.venmo << 3;
        // tslint:disable-next-line:no-bitwise
        const linkedinVal = +!!this.linkedin << 2;
        // tslint:disable-next-line:no-bitwise
        const proemailVal = +!!this.professionalemail << 1;
        // tslint:disable-next-line:no-bitwise
        const websiteVal = +!!this.website << 0;
        // tslint:disable-next-line:no-bitwise max-line-length
        const code = phoneVal | emailVal | instagramVal | snapVal | facebookVal | tiktokVal | twitterVal | venmoVal | linkedinVal | proemailVal | websiteVal | locationVal;
        this.firestore.doc(this.linkDoc).update({
            linkPermissions: code
        }).then(async value => {
            const toast = await this.toastController.create({
                message: 'User Permissions have been updated!',
                duration: 2000
            });
            if(this.currCode !== code) {
                if(this.currCode !== undefined) {
                    await toast.present();
                }
                this.currCode = code;
            }
        });
    }


    async showLocation() {
        const alert = await this.alertController.create({
            header: this.userName + ' is at ',
            subHeader: this.userLocation,
            buttons: ['OK']
        });
        await alert.present();
    }
}
