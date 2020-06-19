import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AngularFirestore, AngularFirestoreDocument, DocumentReference} from '@angular/fire/firestore';
import {RequestsProgramService} from '../requests-program.service';
import {AngularFireStorage} from '@angular/fire/storage';
import {AlertController, ToastController} from '@ionic/angular';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFireDatabase} from '@angular/fire/database';
import {environment} from '../../environments/environment';
import * as mapboxgl from 'mapbox-gl';
import * as firebase from 'firebase';

@Component({
    selector: 'app-userprofile',
    templateUrl: './userprofile.page.html',
    styleUrls: ['./userprofile.page.scss'],
    providers: [RequestsProgramService, AngularFireStorage, AngularFireAuth, AngularFireDatabase]
})
export class UserprofilePage implements OnInit {
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
    userLocation: any;

    constructor(private alertController: AlertController, private rtdb: AngularFireDatabase, private acr: ActivatedRoute, private auth: AngularFireAuth, private firestore: AngularFirestore, private rps: RequestsProgramService,
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

                if (res.payload.data().profilepic.startsWith('h')) {
                    this.img = res.payload.data().profilepic;
                } else {
                    this.storage.storage.refFromURL(res.payload.data().profilepic).getDownloadURL().then(url => {
                        this.img = url;
                    });
                }

                this.firestore.collection('links', ref => ref.where('userRec', '==', this.userRef.ref)
                    .where('userSent', '==', this.firestore.collection('users').doc(
                        this.auth.auth.currentUser.uid).ref).where('pendingRequest', '==', false)
                    .where('pendingRequest', '==', false)).snapshotChanges().subscribe(linkeData => {
                    if(linkeData.length !== 0) {
                        this.renderUserPermissions(userData, linkeData[0].payload.doc.data());
                        this.theirInfo = true;
                    }else{
                        this.theirInfo = false;
                    }
                });
            });
        this.firestore.collection('links', ref => ref.where('userSent', '==', this.userRef.ref)
            .where('userRec', '==', this.firestore.collection('users').doc(
                this.auth.auth.currentUser.uid).ref)
            .where('pendingRequest', '==', false)).get().subscribe(res => {
                if(!res.empty){
                    this.linkDoc = res.docs[0].ref;
                    this.renderMyPermissions(res.docs[0].data());
                    this.myInfo = true;
                }else{
                    this.myInfo = false;
                }
        });

    }

    ngOnInit() {
    }

    segmentChanged(ev: any) {
        this.displayTF = ev.detail.value === 'tf';
    }

    createRequest(id: string) {
        this.rps.sendRequest(id, '2047');
    }

    renderUserPermissions(userData: any, userPermissions: any) {
        let permissions = userPermissions.linkPermissions.substring(0, userPermissions.linkPermissions.indexOf('/'));
        permissions = parseInt(permissions, 10).toString(2).split('');

        this.userPhone = this.getPermission(permissions[0]) ? userData.numberID.replace('(', '').replace(')', '')
            .replace('-', '').replace(' ', '') : '';
        this.userPersonalEmail = this.getPermission(permissions[1]) ? userData.personalEmailID: '';
        this.userInstagram = this.getPermission(permissions[2]) ? userData.instagramID : '';
        this.userSnapchat = this.getPermission(permissions[3]) ? userData.snapchatID : '';
        this.userFacebook = this.getPermission(permissions[4]) ? userData.facebookID : '';
        this.userTiktok = this.getPermission(permissions[5]) ? userData.tiktokID : '';
        this.userTwitter = this.getPermission(permissions[6]) ? userData.twitterID : '';
        this.userVenmo = this.getPermission(permissions[7]) ? userData.venmoID : '';
        this.userLinkedin = this.getPermission(permissions[8]) ? userData.linkedinID : '';
        this.userProfessionalEmail = this.getPermission(permissions[9]) ?  userData.professionalEmailID : '';
        let website;
        if (!((userData.websiteID.includes('http://')) || (userData.websiteID.includes('https://')) || userData.websiteID.length <= 0)) {
            website = 'http://' + userData.websiteID;
        }else{
            website = userData.websiteID;
        }
        this.userWebsite = this.getPermission(permissions[10]) ?  website : '';
        this.userLocation = this.getPermission(permissions[11]) ? this.getLocation(): '';

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

    getLocation(){
        this.rtdb.database.ref('/location/' + this.userId).on('value', snapshot => {
            if (snapshot.val()) {
                // get other users longitude, latitude, and lastOnline vals
                const longi = snapshot.val().longitude;
                const latid = snapshot.val().latitude;
                const lastOn = snapshot.val().lastOnline;

                // only way ik so far to get current time
                let currTime = 0;
                const timeRef = this.rtdb.database.ref('currentTime/');
                timeRef.set({time: firebase.database.ServerValue.TIMESTAMP});
                timeRef.once('value').then(timeSnap => {
                    if (timeSnap.val()) {
                        currTime = timeSnap.val().time;
                    }
                }).then(() => {
                    // update status and render
                    const oStat = this.convertTime(currTime - lastOn);
                    const tempReqStr = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + longi + ',' + latid + '.json?access_token=' +
                        mapboxgl.accessToken;
                    fetch(tempReqStr).then(response => response.json())
                        .then(data => {
                            let locat = '';
                            data.features.forEach(feat => {
                                if(feat.place_type === 'place' || feat.place_type[1] === 'place') {
                                    // get city of location
                                    locat = feat.place_name;
                                    const firstInd = locat.indexOf(',');
                                    const lastInd = locat.lastIndexOf(',');
                                    if(firstInd !== lastInd) {
                                        locat = locat.substring(0, locat.lastIndexOf(','));
                                    }
                                }
                            });
                            return oStat + ' in ' + locat;
                        });
                });
            }
        });
    }

    renderMyPermissions(myData: any) {
        let permissions = myData.linkPermissions.substring(0, myData.linkPermissions.indexOf('/'));
        permissions = parseInt(permissions, 10).toString(2).split('');
        this.phone = this.getPermission(permissions[0]);
        this.email = this.getPermission(permissions[1]);
        this.instagram = this.getPermission(permissions[2]);
        this.snapchat = this.getPermission(permissions[3]);
        this.facebook = this.getPermission(permissions[4]);
        this.tiktok = this.getPermission(permissions[5]);
        this.twitter = this.getPermission(permissions[6]);
        this.venmo = this.getPermission(permissions[7]);
        this.linkedin = this.getPermission(permissions[8]);
        this.professionalemail = this.getPermission(permissions[9]);
        this.website = this.getPermission(permissions[10]);
        this.location = this.getPermission(permissions[11]);
    }

    getPermission(value: any){
        return (value % 2 === 1);
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
            linkPermissions: code + ''
        }).then(async value => {
            const toast = await this.toastController.create({
                message: 'User Permissions have been updated!',
                duration: 2000
            });
            toast.present();
        });
    }


    async showLocation() {
        const alert = await this.alertController.create({
            header: this.userName + ' is ',
            subHeader: this.userLocation,
            buttons: ['OK']
        });
        await alert.present();
    }
}
