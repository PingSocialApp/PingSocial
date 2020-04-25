import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {RequestsProgramService} from '../requests-program.service';
import {AngularFireStorage} from '@angular/fire/storage';

@Component({
    selector: 'app-userprofile',
    templateUrl: './userprofile.page.html',
    styleUrls: ['./userprofile.page.scss'],
    providers: [RequestsProgramService, AngularFireStorage]
})
export class UserprofilePage implements OnInit {
    userRef: AngularFirestoreDocument;
    userId: string;
    userName: string;
    userBio: string;
    displayTF: boolean;
    theirInfo: boolean;
    myInfo: boolean;
    img: string;
     userPhone: string;
     instagram: string;
     facebook: string;
     linkedin: string;
     professionalEmail: string;
     tiktok: string;
     personalEmail: string;
     twitter: string;
     website: string;
     venmo: string;
     snapchat: string;

    constructor(private acr: ActivatedRoute, private firestore: AngularFirestore, private rps: RequestsProgramService,
                private storage: AngularFireStorage) {
        this.displayTF = true;
        this.userRef = this.firestore.collection('users').doc(this.acr.snapshot.params.id);
        this.userRef.snapshotChanges()
            .subscribe(res => {
                // @ts-ignore
                const userData = res.payload.data();
                this.userId = res.payload.id;
                this.userName = userData.name;
                this.userBio = userData.bio;
                this.userPhone = userData.numberID.replace('(','').replace(')','')
                    .replace('-','').replace(' ','');
                this.instagram = userData.instagramID;
                this.facebook = userData.facebookID;
                this.linkedin = userData.linkedinID;
                this.personalEmail = userData.personalEmailID;
                this.professionalEmail = userData.professionalEmailID;
                this.tiktok = userData.tiktokID;
                this.twitter = userData.twitterID;
                this.venmo = userData.venmoID;
                this.snapchat = userData.snapchatID;
                this.website = userData.websiteID;
                if(!(this.website.includes('http://')) && !(this.website.includes('https://')) && this.website.length > 0){
                    this.website = 'http://' + userData.websiteID;
                }


                if (res.payload.data().profilepic.startsWith('h')) {
                    this.img = res.payload.data().profilepic;
                } else {
                    this.storage.storage.refFromURL(res.payload.data().profilepic).getDownloadURL().then(url => {
                        this.img = url;
                    });
                }
            });
    }

    ngOnInit() {
        this.firestore.collection('links', ref => ref.where('userSent', '==', this.userRef.ref)
            .where('userRec', '==', this.firestore.collection('users').doc('4CMyPB6tafUbL1CKzCb8').ref).where('pendingRequest', '==', false))
            .snapshotChanges().subscribe(data => {
                this.myInfo = data.length !== 0;
        });
        // tslint:disable-next-line:max-line-length
        this.firestore.collection('links', ref => ref.where('userSent', '==', this.firestore.collection('users').doc('4CMyPB6tafUbL1CKzCb8').ref)
            .where('userRec', '==', this.userRef.ref).where('pendingRequest', '==', false))
            .snapshotChanges().subscribe(data => {
                this.theirInfo = data.length !== 0;
        });

    }

    segmentChanged(ev: any) {
        this.displayTF = ev.detail.value === 'tf' ? true : false;
    }

    createRequest(id: string){
        this.rps.sendRequest(id);
    }

}
