import {Component, OnInit} from '@angular/core';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {Link} from '../tab3/tab3.page';
import {AngularFireStorage} from '@angular/fire/storage';
import {AngularFireAuth} from '@angular/fire/auth';

@Component({
    selector: 'app-requests',
    templateUrl: './requests.page.html',
    styleUrls: ['./requests.page.scss'],
})
export class RequestsPage implements OnInit {
    currentUserRef: AngularFirestoreDocument;
    currentUser: any;
    links: Array<Link>;

    constructor(private firestore: AngularFirestore, private storage: AngularFireStorage, private auth: AngularFireAuth) {
        this.currentUserRef = this.firestore.collection('users').doc(
            this.auth.auth.currentUser.uid);
        this.links = [];
        this.firestore.collection('links', ref => ref.where('userRec', '==', this.currentUserRef.ref)
            .where('pendingRequest', '==', true)).snapshotChanges().subscribe(res => {
            this.links = [];
            this.renderLink(res);
        });
    }

    ngOnInit() {
        this.currentUserRef.snapshotChanges()
            .subscribe(res => {
                this.currentUser = res.payload.data();
            });
    }

    async renderLink(linkData: Array<any>) {
        await Promise.all(linkData.map(link => {
            const linkeD = link.payload.doc.data();
            linkeD.userSent.get().then(USdata => {
                let imgUrl = '';
                if (this.currentUser.profilepic.startsWith('h')) {
                    imgUrl = this.currentUser.profilepic;
                } else {
                    this.storage.storage.refFromURL(this.currentUser.profilepic).getDownloadURL().then(url => {
                        imgUrl = 'url(' + url + ')';
                    });
                }
                const linkObject: Link = {
                    id: link.payload.doc.id,
                    img: imgUrl,
                    name: USdata.data().name,
                    bio: USdata.data().bio
                };
                this.links.push(linkObject);
            });
        }));
    }

    acceptUser(linkId: string) {
        this.firestore.collection('links').doc(linkId).update({
            pendingRequest: false
        });
    }

    deleteUser(linkId: string) {
        this.firestore.collection('links').doc(linkId).delete();
    }

}
