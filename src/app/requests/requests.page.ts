import {Component, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Link} from '../tab3/tab3.page';
import {AngularFireStorage} from '@angular/fire/storage';
import {AngularFireAuth} from '@angular/fire/auth';
import {ModalController} from '@ionic/angular';

@Component({
    selector: 'app-requests',
    templateUrl: './requests.page.html',
    styleUrls: ['./requests.page.scss'],
    providers: [AngularFireStorage]
})
export class RequestsPage implements OnInit {
    links: Array<Link>;

    constructor(private modalCtrl: ModalController, private firestore: AngularFirestore, private storage: AngularFireStorage,
                private auth: AngularFireAuth) {
        this.links = [];
        this.firestore.collection('users').doc(
            this.auth.auth.currentUser.uid).collection('links', ref =>
            ref.where('pendingRequest', '==', true)).snapshotChanges().subscribe(res => {
            this.links = [];
            this.renderLink(res);
        })
    }

    ngOnInit() {
    }

    async renderLink(linkData: Array<any>) {
        await Promise.all(linkData.map(link => {
            link.get('userSent').get().then(USdata => {
                const linkObject: Link = {
                    id: link.payload.doc.id,
                    img: '',
                    name: USdata.get('name'),
                    bio: USdata.get('bio')
                };
                if (USdata.get('profilepic').startsWith('h')) {
                    linkObject.img = USdata.get('profilepic');
                } else {
                    this.storage.storage.refFromURL(USdata.get('profilepic')).getDownloadURL().then(url => {
                        linkObject.img = 'url(' + url + ')';
                    });
                }
                this.links.push(linkObject);
            });
        }));
    }

    acceptUser(linkId: string) {

        this.firestore.collection('users').doc(
            this.auth.auth.currentUser.uid).collection('links').doc(linkId).update({
            pendingRequest: false
        });
    }

    deleteUser(linkId: string) {
        this.firestore.collection('users').doc(
            this.auth.auth.currentUser.uid).collection('links').doc(linkId).delete();
    }

    closeModal() {
        this.modalCtrl.dismiss();
    }

}
