import {Component, OnDestroy, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireStorage} from '@angular/fire/storage';
import {AngularFireAuth} from '@angular/fire/auth';
import {SettingsPage} from '../settings/settings.page';
import {ModalController} from '@ionic/angular';
import {RequestsPage} from '../requests/requests.page';
import {first, map, mergeMap} from 'rxjs/operators';
import {forkJoin, merge, Observable, Subscription} from 'rxjs';

@Component({
    selector: 'app-tab3',
    templateUrl: 'tab3.page.html',
    styleUrls: ['tab3.page.scss'],
    providers: [AngularFireStorage, AngularFireAuth, AngularFireStorage]
})

export class Tab3Page implements OnInit, OnDestroy {
    currentUserRef: any;
    requestAmount: number;
    links: Observable<Array<any>>;
    private pendingLinkSub: Subscription;

    constructor(private modalController: ModalController, private firestore: AngularFirestore, private storage: AngularFireStorage,
                private auth: AngularFireAuth) {
        this.currentUserRef = this.firestore.collection('users').doc(
            this.auth.auth.currentUser.uid);
    }

    ngOnInit(): void {
        this.getLinks();
        this.pendingLinkSub = this.currentUserRef.collection('links', ref => ref
            .where('pendingRequest', '==', true)).snapshotChanges().subscribe(res => {
            this.requestAmount = res.length;
        });
    }

    ngOnDestroy() {
        this.pendingLinkSub.unsubscribe();
    }

    getLinks() {
        const myLinks = this.currentUserRef.collection('links', ref => ref.where('pendingRequest', '==', false)).get().pipe(first());
        const otherLinks = this.firestore.collectionGroup('links', ref => ref.where('otherUser', '==', this.currentUserRef.ref)
            .where('pendingRequest', '==', false))
            .get().pipe(first());

        const links = merge(myLinks, otherLinks);

        this.links = links.pipe(mergeMap((querySnap: any) => forkJoin(
            querySnap.docs.map(doc =>
                doc.get('otherUser').id !== this.currentUserRef.ref.id ?
                    doc.get('otherUser').get() : doc.ref.parent.parent.get()
            ))), map((val: any) => {
            return val.map(userData => {
                return {
                    id: userData.id,
                    img: this.getImage(userData.get('profilepic')),
                    name: userData.get('name'),
                    bio: userData.get('bio')
                };
            });
        }));

        return Promise.resolve();
    }

    async getImage(profilePic: string) {
        if (profilePic.startsWith('h')) {
            return profilePic;
        } else {
            return await this.storage.storage.refFromURL(profilePic).getDownloadURL().then(url => {
                return url;
            }).catch((e) => console.log(e));
        }
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