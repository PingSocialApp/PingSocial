import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {map, mergeMap} from 'rxjs/operators';
import {forkJoin} from 'rxjs';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {AngularFireStorage} from '@angular/fire/storage';
import {ModalController} from '@ionic/angular';

@Component({
    selector: 'app-link-selector',
    templateUrl: './link-selector.page.html',
    styleUrls: ['./link-selector.page.scss'],
    providers: [AngularFireStorage]
})
export class LinkSelectorPage implements OnInit {
    links: any;
    private currentUserRef: AngularFirestoreDocument;
    userArray: Array<string>;
    @Input() ids: Array<string>;

    constructor(private modalController: ModalController,
                private auth: AngularFireAuth, private afs: AngularFirestore, private storage: AngularFireStorage) {
        this.currentUserRef = this.afs.collection('users').doc(this.auth.auth.currentUser.uid);
        this.userArray = [];
    }

    ngOnInit() {
        this.links = this.currentUserRef.collection('links', ref => ref.where('pendingRequest', '==', false)).get()
            .pipe(mergeMap(querySnap => forkJoin(
                querySnap.docs.map(doc => doc.get('otherUser').get())
            )), map((val: any) => {
                return val.map(userData => {
                    return {
                        id: userData.id,
                        img: this.getImage(userData.get('profilepic')),
                        name: userData.get('name'),
                        bio: userData.get('bio'),
                        checked: this.ids.includes(userData.id)
                    };
                });
            }));
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

    async closeModal() {
        await this.modalController.dismiss(this.userArray)
    }

    updateLinkList() {
        const toggle = (document.getElementsByTagName('ion-checkbox') as unknown as Array<any>);
        this.userArray = [];
        for (const element of toggle) {
            if (element.checked) {
                this.userArray.push(element.id);
            }
        }
    }

    loadData($event: any) {

    }
}
