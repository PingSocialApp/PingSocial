import {Component, OnDestroy, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {MarkercreatorPage} from '../tab2/markercreator/markercreator.page';
import {ModalController} from '@ionic/angular';
import {ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs';

@Component({
    selector: 'app-eventmanager',
    templateUrl: './eventmanager.page.html',
    styleUrls: ['./eventmanager.page.scss'],
})
export class EventmanagerPage implements OnInit, OnDestroy {
    myEvents: Array<object>;
    isMe: boolean;
    private eventsSub: Subscription;

    constructor(private acr: ActivatedRoute, private modalController: ModalController, private firestore: AngularFirestore,
                private auth: AngularFireAuth) {
        this.isMe = this.acr.snapshot.params.id === this.auth.auth.currentUser.uid;
    }

    ngOnInit() {
        // TODO Check to Pipe
        this.eventsSub = this.firestore.collection('events', ref => ref.where('creator', '==',
            this.firestore.collection('users').doc(this.acr.snapshot.params.id).ref).orderBy('startTime', 'asc'))
            .snapshotChanges().subscribe(val => {
                this.renderMyEvents(val);
        });
    }

    ngOnDestroy(): void {
        this.eventsSub.unsubscribe();
    }

    renderMyEvents(val: Array<any>) {
        this.myEvents = [];
        val.forEach(event => {
            const data = event.payload.doc;
            let flag = false;
            if (data.get('isPrivate')) {
                for (const mem of data.get('members')) {
                    if (mem.id === this.auth.auth.currentUser.uid) {
                        flag = true;
                    }
                }
                if (!flag) {
                    return;
                }
            }
            const obj = {
                id: data.id,
                name: data.get('name'),
                des: data.get('description'),
                isPrivate: data.get('isPrivate')
            }
            this.myEvents.push(obj);
        });
    }

    async presentEventCreatorModal(data: string) {
        const modal = await this.modalController.create({
            component: MarkercreatorPage,
            componentProps: {
                eventID: data
            }
        });
        return await modal.present();
    }

    handleInput(event) {
        const query = event.target.value.toLowerCase();
        for (let i = 0; i < document.getElementsByTagName('ion-card').length; i++) {
            const shouldShow = document.getElementsByTagName('ion-card-title')[i].textContent.toLowerCase().indexOf(query) > -1
            document.getElementsByTagName('ion-card')[i].style.display = shouldShow ? 'block' : 'none';
        }
    }

    async addEvent() {
        const modal = await this.modalController.create({
            component: MarkercreatorPage,
            componentProps: {
                eventID: ''
            }
        });
        return await modal.present();
    }
}
