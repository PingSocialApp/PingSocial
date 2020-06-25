import {Component} from '@angular/core';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {AngularFireStorage} from '@angular/fire/storage';
import {AngularFireAuth} from '@angular/fire/auth';
import {SettingsPage} from '../settings/settings.page';
import {ModalController} from '@ionic/angular';

export interface Link {
    id: string;
    img: string;
    name: string;
    bio: string;
}

@Component({
    selector: 'app-tab3',
    templateUrl: 'tab3.page.html',
    styleUrls: ['tab3.page.scss'],
    providers: [AngularFireStorage, AngularFireAuth]
})

export class Tab3Page {
    currentUserRef: AngularFirestoreDocument;
    currentUser: any;
    requestAmount: number;
    links: Array<Link>;
    private idArr: Array<string>;

    constructor(private modalController: ModalController, private firestore: AngularFirestore, private storage: AngularFireStorage,
                private auth: AngularFireAuth) {
        this.currentUserRef = this.firestore.collection('users').doc(
            this.auth.auth.currentUser.uid);
        this.links = [];
        this.getLinks();
        this.firestore.collection('links', ref => ref.where('userRec', '==', this.currentUserRef.ref)
            .where('pendingRequest', '==', true)).snapshotChanges().subscribe(res => {
            this.requestAmount = res.length;
        });
    }

    getLinks() {
        this.firestore.collection('links', ref => ref.where('userRec', '==', this.currentUserRef.ref)
            .where('pendingRequest', '==', false)).get().subscribe(userRecData => {
            this.firestore.collection('links', ref => ref.where('userSent', '==', this.currentUserRef.ref)
                .where('pendingRequest', '==', false)).get().subscribe(userSentData => {
                this.links = [];
                this.idArr = [];
                this.renderRLink(userRecData.docs);
                this.renderSLink(userSentData.docs);
            });
        });
        this.links.sort((a, b) => {
            const textA = a.name.toUpperCase();
            const textB = b.name.toUpperCase();
            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        });
        return Promise.resolve();
    }

    async renderRLink(linkData: Array<any>) {
        linkData.forEach(link => {
            const linkeD = link.data();
            linkeD.userSent.get().then(USdata => {
                if (!(this.idArr.includes(USdata.id))) {
                    this.links.push(this.renderLink(USdata));
                    this.idArr.push(USdata.id);
                }
            });
        });
    }

    async renderSLink(linkData: Array<any>) {
        linkData.map(link => {
            const linkeD = link.data();
            linkeD.userRec.get().then(USdata => {
                if (!(this.idArr.includes(USdata.id))) {
                    this.links.push(this.renderLink(USdata));
                    this.idArr.push(USdata.id);
                }
            });
        });
    }

    renderLink(USdata) {
        const linkObject = {
            id: USdata.id,
            name: USdata.data().name,
            bio: USdata.data().bio,
            img: ''
        };
        if (USdata.data().profilepic.startsWith('h')) {
            linkObject.img = USdata.data().profilepic;
        } else {
            this.storage.storage.refFromURL(USdata.data().profilepic).getDownloadURL().then(url => {
                linkObject.img = url;
            });
        }
        return linkObject;
    }

    handleInput(event) {
        const query = event.target.value.toLowerCase();
        for (let i = 0; i < document.getElementsByTagName('ion-item').length; i++) {
            const shouldShow = document.getElementsByTagName('h2')[i].textContent.toLowerCase().indexOf(query) > -1;
            document.getElementsByTagName('ion-item')[i].style.display = shouldShow ? 'block' : 'none';
        }
    }

    doRefresh(event) {
        this.getLinks().then(() => {
            event.target.complete();
        });
    }

    async presentSettingsModal() {
        const modal = await this.modalController.create({
            component: SettingsPage
        });
        return await modal.present();
    }
}
