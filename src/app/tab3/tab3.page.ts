import {Component} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireStorage} from '@angular/fire/storage';
import {AngularFireAuth} from '@angular/fire/auth';
import {SettingsPage} from '../settings/settings.page';
import {ModalController} from '@ionic/angular';
import {RequestsPage} from '../requests/requests.page';


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
    providers: [AngularFireStorage, AngularFireAuth, AngularFireStorage]
})

export class Tab3Page {
    currentUserRef: any;
    requestAmount: number;
    links: Array<Link>;
    private idArr: Array<string>;

    constructor(private modalController: ModalController, private firestore: AngularFirestore, private storage: AngularFireStorage,
                private auth: AngularFireAuth) {
        this.currentUserRef = this.firestore.collection('users').doc(
            this.auth.auth.currentUser.uid);
        this.links = [];
        this.getLinks();
        this.currentUserRef.collection('links', ref => ref
            .where('pendingRequest', '==', true)).snapshotChanges().subscribe(res => {
            this.requestAmount = res.length;
        });
    }

    getLinks() {
        this.currentUserRef.collection('links', ref => ref.where('pendingRequest', '==', false)).get().subscribe(myLinks => {
            this.firestore.collectionGroup('links', ref => ref.where('otherUser', '==', this.currentUserRef.ref)
                .where('pendingRequest', '==', false))
                .get().subscribe(otherLinks => {
                this.links = [];
                this.idArr = [];
                this.renderRLink(myLinks.docs);
                this.renderSLink(otherLinks.docs);
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
            link.get('otherUser').get().then(USdata => {
                if (!(this.idArr.includes(USdata.id))) {
                    this.links.push(this.renderLink(USdata));
                    this.idArr.push(USdata.id);
                }
            });
        });
    }

    async renderSLink(linkData: Array<any>) {
        linkData.map(link => {
            link.parent.parent.get().then(USdata => {
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
            name: USdata.get('name'),
            bio: USdata.get('bio'),
            img: ''
        };
        if (USdata.get('profilepic').startsWith('h')) {
            linkObject.img = USdata.get('profilepic');
        } else {
            this.storage.storage.refFromURL(USdata.get('profilepic')).getDownloadURL().then(url => {
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

    async presentRequestsPage() {
        const modal = await this.modalController.create({
            component: RequestsPage
        });
        return await modal.present();
    }

    async presentSettingsModal() {
        const modal = await this.modalController.create({
            component: SettingsPage
        });
        return await modal.present();
    }
}
