import {Component, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireStorage} from '@angular/fire/storage';
import {AngularFireAuth} from '@angular/fire/auth';
import {ModalController} from '@ionic/angular';
import {forkJoin, Observable} from 'rxjs';
import {mergeMap} from 'rxjs/operators';

@Component({
    selector: 'app-requests',
    templateUrl: './requests.page.html',
    styleUrls: ['./requests.page.scss'],
    providers: [AngularFireStorage]
})
export class RequestsPage implements OnInit {
    links: Observable<any>;

    constructor(private modalCtrl: ModalController, private firestore: AngularFirestore, private storage: AngularFireStorage,
                private auth: AngularFireAuth) {
    }

    ngOnInit() {
        this.links = this.firestore.collection('users').doc(this.auth.auth.currentUser.uid)
            .collection('links', ref => ref.where('pendingRequest', '==', true)).snapshotChanges()
            .pipe(mergeMap(querySnap => forkJoin(
                querySnap.map(doc => {
                    const data = doc.payload.doc;
                    return data.get('otherUser').get().then(userData => {
                        return {
                            id: data.id,
                            img: this.getImage(userData.get('profilepic')),
                            name: userData.get('name'),
                            bio: userData.get('bio')
                        };
                    });
                })
            )));
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

    acceptUser(linkId: string) {
        this.firestore.collection('users').doc(
            this.auth.auth.currentUser.uid).collection('links').doc(linkId).update({
            pendingRequest: false
        }).then(val => {
            console.log('updated');
        })
    }

    deleteUser(linkId: string) {
        this.firestore.collection('users').doc(
            this.auth.auth.currentUser.uid).collection('links').doc(linkId).delete();
    }

    closeModal() {
        this.modalCtrl.dismiss();
    }

}
