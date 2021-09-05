import {Component, OnDestroy, OnInit} from '@angular/core';
import {ModalController} from '@ionic/angular';
import {AngularFireAuth} from '@angular/fire/auth';
import {BehaviorSubject, Subscription} from 'rxjs';
import { UtilsService } from 'src/app/services/utils.service';
import { AuthHandler } from 'src/app/services/authHandler.service';
import { LinksService } from 'src/app/services/links.service';
import { UsersService } from 'src/app/services/users.service';
import { PingsService } from 'src/app/services/pings.service';

@Component({
    selector: 'app-new-ping',
    templateUrl: './new-ping.page.html',
    styleUrls: ['./new-ping.page.scss'],
    providers: [AngularFireAuth]
})

export class NewPingPage implements OnInit, OnDestroy {
    links: any;
    offset: number;
    linksBS: BehaviorSubject<number>;
    pingMessage: string;
    myInfoSubscription: Subscription;
    myName: any;
    myPic: any;

    constructor(private modalCtrl: ModalController,
                private utils: UtilsService, private ls: LinksService, private auth: AuthHandler, private us: UsersService,
                private ps: PingsService) {
    }

    ngOnInit() {
        this.offset = 0;
        this.linksBS = new BehaviorSubject(this.offset);
        this.linksBS.subscribe(() => this.getLinks());
        this.myInfoSubscription = this.us.getUserBasic(this.auth.getUID()).subscribe((val:any) => {
            this.myName = val.data.name;
            this.myPic = val.data.profilepic;
        }, (error)=>{
            console.error(error);
            this.utils.presentToast('Whoops! Network Error');
        });
    }

    ngOnDestroy() {
        this.myInfoSubscription.unsubscribe();
    }

    getLinks() {
        this.links = this.ls.getAllLinks(this.offset);
    }

    doRefresh(event) {
        this.offset = 0;
        this.linksBS.next(this.offset);
        event.target.complete();
    }

    loadData(event){
        ++this.offset;
        this.linksBS.next(this.offset);
        event.target.complete();
    }

    sendPing() {
        if (this.pingMessage === '' || this.pingMessage === undefined) {
            this.utils.presentToast('Whoops! You have an empty message');
            return;
        }
        const toggles = (document.getElementsByTagName('ion-checkbox') as unknown as Array<any>);
        const links = [];

        for (const toggle of toggles) {
            if (toggle.checked) {
                links.push({
                    uid: toggle.id,
                    name: toggle.getAttribute('data-name'),
                    profilepic: toggle.getAttribute('data-pic'),
                });
            }
        }

        if(links.length === 0){
            this.utils.presentToast('Whoops! You haven\'t selected anyone');
        }

        this.ps.sendPing(links, this.pingMessage).then(() => {
            this.utils.presentToast('Ping Sent!');
            this.closeModal()
        }).catch(e => {
            console.error(e);
            this.utils.presentToast('Whoops! Pings not sent');
        })
    }

    closeModal() {
        this.modalCtrl.dismiss({
            dismissed: true
        });
    }

    handleInput(event) {
        const query = event.target.value.toLowerCase();
        for (let i = 0; i < document.getElementsByTagName('ion-item').length; i++) {
            const shouldShow = document.getElementsByTagName('h2')[i].textContent.toLowerCase().indexOf(query) > -1;
            document.getElementsByTagName('ion-item')[i].style.display = shouldShow ? 'block' : 'none';
        }
    }
}