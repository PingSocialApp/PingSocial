import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {RequestsService} from '../services/requests.service';
import {ActionSheetController, AlertController, ModalController, ToastController} from '@ionic/angular';
import {AngularFireDatabase} from '@angular/fire/database';
import {environment} from '../../environments/environment';
import * as mapboxgl from 'mapbox-gl';
import {Subscription} from 'rxjs';
import { UsersService } from '../services/users.service';
import { LinksService } from '../services/links.service';
import { UtilsService } from '../services/utils.service';

@Component({
    selector: 'app-userprofile',
    templateUrl: './userprofile.page.html',
    styleUrls: ['./userprofile.page.scss'],
    providers: [RequestsService, AngularFireDatabase]
})
export class UserprofilePage implements OnInit, OnDestroy {
    userObj: any;
    currCode: number;
    userId: string;
    displayTF: boolean;
    theirInfo: boolean;
    myInfo: boolean;
    permissions: boolean[];
    socials: any;
    private userSocialsSub: Subscription;
    userBasicSub: Subscription;
    myDataSub: Subscription;

    constructor(private actionSheet: ActionSheetController, private modalController: ModalController,
                private alertController: AlertController, private rtdb: AngularFireDatabase, private acr: ActivatedRoute, private ls: LinksService,
                private rps: RequestsService, private us: UsersService, private utils: UtilsService
                ) {
        mapboxgl.accessToken = environment.mapbox.accessToken;
        this.displayTF = true;
    }

    async ngOnInit() {
        const isModalOpened = await this.modalController.getTop();
        this.userId = this.acr.snapshot.params.id;
        // tslint:disable-next-line:no-unused-expression
        isModalOpened ? this.closeModal() : null;
        this.getMyData();
        this.getOtherData();

        this.userBasicSub = this.us.getUserBasic(this.userId).subscribe((data:any) => {
            this.userObj = data.data;
        }, err => {
            console.error(err.error);
        });
    }

    ngOnDestroy(){
        this.myDataSub.unsubscribe();
        this.userBasicSub.unsubscribe();
        this.userSocialsSub.unsubscribe();
    }

    getMyData(){
        this.myDataSub = this.ls.getToSocials(this.userId).subscribe((res:any) => {
            if (res.data !== -1) {
                this.permissions = this.getPermission(res.data);
                this.myInfo = true;
            } else {
                this.myInfo = false;
            }
        }, err => {
            console.error(err.error);
        });
    }

    getOtherData(){
        this.userSocialsSub = this.ls.getFromSocials(this.userId).subscribe((linkData:any) => {
            if (linkData.data != null) {
                linkData.phone = linkData.phone.replace('(', '').replace(')', '')
                    .replace('-', '').replace(' ', '');
                linkData.website = !((linkData.website.includes('http://')) || (linkData.website.includes('https://')) 
                || linkData.website.length <= 0) ?
                    'http://' + linkData.website : linkData.website;

                this.socials = linkData;
                this.theirInfo = true;
                //TODO Location
            }else{
                this.theirInfo = false;
            }   
        }, err => {
            console.error(err.error);
        });
    }

    segmentChanged(ev: any) {
        this.displayTF = ev.detail.value === 'tf';
    }

    createRequest(id: string) {
        this.rps.sendRequest(id, 2047);
    }

    async renderUserPermissions(userData: any, userPermissions: any) {
        const permissions = this.getPermission(userPermissions);
        this.socials = Object.values(userData);
        this.socials.push('');
        for (let i = 0; i < this.socials.length; i++) {
            this.socials[i] = permissions[i] ? this.socials[i] : '';
        }

        this.socials[0] = this.socials[0].replace('(', '').replace(')', '')
            .replace('-', '').replace(' ', '');

        this.socials[4] = !((this.socials[4].includes('http://')) || (this.socials[4].includes('https://')) || this.socials[4].length <= 0) ?
            'http://' + this.socials[4] : this.socials[4];

        await this.rtdb.database.ref('/location/' + this.userId).on('value', snapshot => {
            if (snapshot.val()) {
                // get other users longitude, latitude, and lastOnline vals
                const locat = snapshot.val().place == null ? 'Unavailable' : snapshot.val().place;
                const oStat = this.convertTime(Date.now() - snapshot.val().lastOnline);
                this.socials[11] = permissions[0] ? locat + ' ' + oStat : '';
            }
        });
    }

    convertTime(t) {
        if (t >= 86_400_000) {
            // days
            return Math.floor(t / 86_400_000) + 'd ago';
        } else if (t >= 3_600_000) {
            // hours
            return Math.floor(t / 3_600_000) + 'h ago';
        } else if (t >= 60_000) {
            // mins
            return Math.floor(t / 60_000) + 'm ago';
        } else if (t >= 1000) {
            // secs
            return Math.floor(t / 1000) + 's ago';
        } else {
            return 'Just Now';
        }
    }

    getPermission(value: any) {
        const permissions = value.toString(2).split('');
        while (permissions.length < 12) {
            permissions.unshift('0');
        }
        const boolValues = [];
        for (let i = 0; i < 12; i++) {
            boolValues[i] = permissions[i] === '1';
        }
        return boolValues;
    }

    closeModal() {
        // using the injected ModalController this page
        // can "dismiss" itself and optionally pass back data
        this.modalController.dismiss({
            dismissed: true
        });
    }

    changePermissions() {
        this.ls.updatePermissions(this.permissions, this.userId).subscribe(async (val:any) => {
            if (this.currCode !== val.data.code) {
                if (this.currCode !== undefined) {
                    await this.utils.presentToast('User Permissions have been updated!');
                }
                this.currCode = val.data.code;
            }
        }, async (err)=> {
            await this.utils.presentToast('Whoops! Update failed');
        })
    }

    async presentActionSheet() {
        const actionSheet = await this.actionSheet.create({
            header: this.socials[0],
            buttons: [{
                text: 'Call',
                icon: 'call',
                handler: () => {
                    window.open('tel:' + this.socials[0]);
                }
            }, {
                text: 'Text/SMS',
                icon: 'chatbubble',
                handler: () => {
                    window.open('sms:' + this.socials[0]);
                }
            }, {
                text: 'Cancel',
                icon: 'close',
                role: 'cancel'
            }]
        });
        await actionSheet.present();
    }

    async showLocation() {
        const alert = await this.alertController.create({
            header: this.userObj.name + ' is at ',
            subHeader: this.socials[11],
            buttons: ['OK']
        });
        await alert.present();
    }
}
