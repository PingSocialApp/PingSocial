import {Component} from '@angular/core';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {Link} from '../circledash/new-ping/new-ping.page';
import {AngularFireStorage} from '@angular/fire/storage';

@Component({
    selector: 'app-tab3',
    templateUrl: 'tab3.page.html',
    styleUrls: ['tab3.page.scss'],
    providers: [AngularFireStorage]
})
export class Tab3Page {
    currentUserRef: AngularFirestoreDocument;
    currentUser: any;
    requestAmount: number;
    links: Array<Link>;
    rLinks: Array<Link>;
    sLinks: Array<Link>;
    displayRL: boolean;

    constructor(private firestore: AngularFirestore, private storage: AngularFireStorage) {
        this.displayRL = true;
        this.currentUserRef = this.firestore.collection('users').doc(
            '4CMyPB6tafUbL1CKzCb8');
        this.rLinks = [];
        this.firestore.collection('links', ref => ref.where('userRec', '==', this.currentUserRef.ref)
            .where('pendingRequest', '==', false)).snapshotChanges().subscribe(res => {
            this.rLinks = [];
            this.renderRLink(res);
        });
        this.firestore.collection('links', ref => ref.where('userSent', '==', this.currentUserRef.ref)
            .where('pendingRequest', '==', false)).snapshotChanges().subscribe(res => {
            this.sLinks = [];
            this.renderSLink(res);
        });
        this.currentUserRef.snapshotChanges()
            .subscribe(res => {
                this.currentUser = res.payload.data();
            });
        this.firestore.collection('links', ref => ref.where('userRec', '==', this.currentUserRef.ref)
            .where('pendingRequest', '==', true)).snapshotChanges().subscribe(res => {
            this.requestAmount = res.length;
        });
    }

    async renderRLink(linkData: Array<any>) {
        await Promise.all(linkData.map(link => {
            const linkeD = link.payload.doc.data();
            linkeD.userSent.get().then(USdata => {
                let imgUrl = '';
                if (USdata.data().profilepic.startsWith('h')) {
                    imgUrl = USdata.data().profilepic;
                } else {
                    this.storage.storage.refFromURL(USdata.data().profilepic).getDownloadURL().then(url => {
                        imgUrl = url;
                    });
                }
                const linkObject: Link = {
                    id: USdata.id,
                    img: imgUrl,
                    name: USdata.data().name,
                    bio: USdata.data().bio
                };
                this.rLinks.push(linkObject);
            });
        }));
    }

    async renderSLink(linkData: Array<any>) {
        await Promise.all(linkData.map(link => {
            const linkeD = link.payload.doc.data();
            linkeD.userRec.get().then(USdata => {
                let imgUrl = '';
                if (this.currentUser.profilepic.startsWith('h')) {
                    imgUrl = this.currentUser.profilepic;
                } else {
                    this.storage.storage.refFromURL(this.currentUser.profilepic).getDownloadURL().then(url => {
                        imgUrl = url;
                    });
                }
                const linkObject: Link = {
                    id: USdata.id,
                    img: imgUrl,
                    name: USdata.data().name,
                    bio: USdata.data().bio
                };
                this.sLinks.push(linkObject);
            });
        }));
    }

    handleInput(event) {
        const query = event.target.value.toLowerCase();
        // console.log(query);
        for (let i = 0; i < document.getElementsByTagName('ion-item').length; i++) {
            const shouldShow = document.getElementsByTagName('h2')[i].textContent.toLowerCase().indexOf(query) > -1;
            document.getElementsByTagName('ion-item')[i].style.display = shouldShow ? 'block' : 'none';
        }
    }

    segmentChanged(ev: any) {
        this.displayRL = ev.detail.value === 'rl' ? true : false;
        // console.log('Segment changed', ev);
    }
}
