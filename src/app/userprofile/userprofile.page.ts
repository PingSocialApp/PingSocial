import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AngularFirestore, AngularFirestoreDocument, DocumentReference} from '@angular/fire/firestore';
import {RequestsProgramService} from '../requests-program.service';
import {AngularFireStorage} from '@angular/fire/storage';
import {ToastController} from '@ionic/angular';
import {AngularFireAuth} from '@angular/fire/auth';

@Component({
    selector: 'app-userprofile',
    templateUrl: './userprofile.page.html',
    styleUrls: ['./userprofile.page.scss'],
    providers: [RequestsProgramService, AngularFireStorage, AngularFireAuth]
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

    constructor(private acr: ActivatedRoute, private auth: AngularFireAuth, private firestore: AngularFirestore, private rps: RequestsProgramService,
                private storage: AngularFireStorage, private toastController: ToastController) {
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
            .where('pendingRequest', '==', false)).snapshotChanges().subscribe(res => {
                if(res.length !== 0){
                    this.linkDoc = res[0].payload.doc.ref;
                    this.renderMyPermissions(res[0].payload.doc.data());
                    this.myInfo = true;
                }else{
                    this.myInfo = false;
                }
        });

    }

    ngOnInit() {
    }

    segmentChanged(ev: any) {
        this.displayTF = ev.detail.value === 'tf' ? true : false;
    }

    createRequest(id: string) {
        this.rps.sendRequest(id, '2047');
    }

    renderUserPermissions(userData: any, userPermissions: any) {
        let permissions = userPermissions.linkPermissions.substring(0, userPermissions.linkPermissions.indexOf('/'));
        permissions = parseInt(permissions, 10).toString(2).split('');

        this.userPhone = permissions[0] % 2 === 1 ? userData.numberID.replace('(', '').replace(')', '')
            .replace('-', '').replace(' ', '') : '';
        this.userPersonalEmail = permissions[1] % 2 === 1 ? userData.personalEmailID: '';
        this.userInstagram = permissions[2] % 2 === 1 ? userData.instagramID : '';
        this.userSnapchat = permissions[3] % 2 === 1 ? userData.snapchatID : '';
        this.userFacebook = permissions[4] % 2 === 1 ? userData.facebookID : '';
        this.userTiktok = permissions[5] % 2 === 1 ? userData.tiktokID : '';
        this.userTwitter = permissions[6] % 2 === 1 ? userData.twitterID : '';
        this.userVenmo = permissions[7] % 2 === 1 ? userData.venmoID : '';
        this.userLinkedin = permissions[8] % 2 === 1 ? userData.linkedinID : '';
        this.userProfessionalEmail = permissions[9] % 2 === 1 ?  userData.professionalEmailID : '';
        let website;
        if (!((userData.websiteID.includes('http://')) || (userData.websiteID.includes('https://')) || userData.websiteID.length <= 0)) {
            website = 'http://' + userData.websiteID;
        }else{
            website = userData.websiteID;
        }
        this.userWebsite = permissions[10] % 2 === 1 ?  website : '';
    }

    renderMyPermissions(myData: any) {
        let permissions = myData.linkPermissions.substring(0, myData.linkPermissions.indexOf('/'));
        permissions = parseInt(permissions, 10).toString(2).split('');
        this.phone = permissions[0] % 2 === 1 ? true : false;
        this.email = permissions[1] % 2 === 1 ? true : false;
        this.instagram = permissions[2] % 2 === 1 ? true : false;
        this.snapchat = permissions[3] % 2 === 1 ? true : false;
        this.facebook = permissions[4] % 2 === 1 ? true : false;
        this.tiktok = permissions[5] % 2 === 1 ? true : false;
        this.twitter = permissions[6] % 2 === 1 ? true : false;
        this.venmo = permissions[7] % 2 === 1 ? true : false;
        this.linkedin = permissions[8] % 2 === 1 ? true : false;
        this.professionalemail = permissions[9] % 2 === 1 ? true : false;
        this.website = permissions[10] % 2 === 1 ? true : false;
    }

    changePermissions() {
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
        const code = phoneVal | emailVal | instagramVal | snapVal | facebookVal | tiktokVal | twitterVal | venmoVal | linkedinVal | proemailVal | websiteVal;
        this.firestore.doc(this.linkDoc).update({
            linkPermissions: code + '/' + this.auth.auth.currentUser.uid
        }).then(async value => {
            const toast = await this.toastController.create({
                message: 'User Permissions have been updated!',
                duration: 2000
            });
            toast.present();
        });
    }


}
