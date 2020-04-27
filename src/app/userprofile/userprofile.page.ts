import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AngularFirestore, AngularFirestoreDocument, DocumentReference} from '@angular/fire/firestore';
import {RequestsProgramService} from '../requests-program.service';
import {AngularFireStorage} from '@angular/fire/storage';
import {ToastController} from '@ionic/angular';

@Component({
    selector: 'app-userprofile',
    templateUrl: './userprofile.page.html',
    styleUrls: ['./userprofile.page.scss'],
    providers: [RequestsProgramService, AngularFireStorage]
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
    phone:boolean;
    email:boolean;
    instagram:boolean;
    snapchat:boolean;
    facebook:boolean;
    tiktok:boolean;
    twitter:boolean;
    venmo:boolean;
    linkedin:boolean;
    professionalemail:boolean;
    website:boolean;

    constructor(private acr: ActivatedRoute, private firestore: AngularFirestore, private rps: RequestsProgramService,
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
                this.userPhone = userData.numberID.replace('(', '').replace(')', '')
                    .replace('-', '').replace(' ', '');
                this.userInstagram = userData.instagramID;
                this.userFacebook = userData.facebookID;
                this.userLinkedin = userData.linkedinID;
                this.userPersonalEmail = userData.personalEmailID;
                this.userProfessionalEmail = userData.professionalEmailID;
                this.userTiktok = userData.tiktokID;
                this.userTwitter = userData.twitterID;
                this.userVenmo = userData.venmoID;
                this.userSnapchat = userData.snapchatID;
                this.userWebsite = userData.websiteID;
                if (!((this.userWebsite.includes('http://')) || (this.userWebsite.includes('https://')) || this.userWebsite.length <= 0)) {
                    this.userWebsite = 'http://' + userData.websiteID;
                }


                if (res.payload.data().profilepic.startsWith('h')) {
                    this.img = res.payload.data().profilepic;
                } else {
                    this.storage.storage.refFromURL(res.payload.data().profilepic).getDownloadURL().then(url => {
                        this.img = url;
                    });
                }
            });
        this.firestore.collection('links', ref => ref.where('userSent', '==', this.userRef.ref)
            .where('userRec', '==',this.firestore.collection('users').doc(
            '4CMyPB6tafUbL1CKzCb8').ref)
            .where('pendingRequest', '==', false)).snapshotChanges().subscribe(res => {
                this.linkDoc = res[0].payload.doc.ref;
                this.renderPermissions(res[0].payload.doc.data());
        });

    }

    ngOnInit() {
        this.firestore.collection('links', ref => ref.where('userSent', '==', this.userRef.ref)
            .where('userRec', '==', this.firestore.collection('users').doc('4CMyPB6tafUbL1CKzCb8').ref)
            .where('pendingRequest', '==', false))
            .snapshotChanges().subscribe(data => {
            this.myInfo = data.length !== 0;
        });
        // tslint:disable-next-line:max-line-length
        this.firestore.collection('links', ref => ref.where('userSent', '==', this.firestore.collection('users')
            .doc('4CMyPB6tafUbL1CKzCb8').ref)
            .where('userRec', '==', this.userRef.ref).where('pendingRequest', '==', false))
            .snapshotChanges().subscribe(data => {
            this.theirInfo = data.length !== 0;
        });
    }

    segmentChanged(ev: any) {
        this.displayTF = ev.detail.value === 'tf' ? true : false;
    }

    createRequest(id: string) {
        this.rps.sendRequest(id,'2047');
    }

    renderPermissions(myData: any){
        let permissions = myData.linkPermissions.substring(0,myData.linkPermissions.indexOf('/'));
        permissions = parseInt(permissions, 10).toString(2).split('');
        this.phone = permissions[0] % 2 === 1 ? true : false;
        this.email = permissions[1] % 2 === 1 ? true : false
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

    changePermissions(){
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
            linkPermissions: code + '/' + '4CMyPB6tafUbL1CKzCb8'
        }).then(async value => {
            const toast = await this.toastController.create({
                message: 'User Permissions have been updated!',
                duration: 2000
            });
            toast.present();
        });
    }



}
