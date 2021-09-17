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
    requestExists: boolean;

    constructor(private actionSheet: ActionSheetController, private modalController: ModalController,
                private alertController: AlertController, private acr: ActivatedRoute,
                private ls: LinksService,
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

        this.userBasicSub = this.us.getUserBasic(this.userId).subscribe({
            next: (data:any) => {
                this.userObj = data.data;
        }, error: (err) => {
            this.utils.presentToast('Whoops! Unable to get profile info', 'error');
            console.error(err.error);
        }});
    }

    ngOnDestroy(){
        this.myDataSub.unsubscribe();
        this.userBasicSub.unsubscribe();
        this.userSocialsSub.unsubscribe();
    }

    getMyData(){
        this.myDataSub = this.ls.getToSocials(this.userId).subscribe((res:any) => {
            if (res.data !== -1) {
                this.permissions = res.data;
                this.myInfo = true;
            } else {
                this.myInfo = false;
            }
        }, err => {
            this.utils.presentToast('Whoops! Unable to get you socials', 'error');
            console.error(err.error);
        });
    }

    getOtherData(){
        this.userSocialsSub = this.ls.getFromSocials(this.userId).subscribe((socialsData:any) => {
            const linkData = socialsData.data;
            if(linkData === 'isRequest'){
                this.theirInfo = false;
                this.requestExists = true;
            } else if (linkData != null) {
                linkData.phone = linkData.phone.replace('(', '').replace(')', '')
                    .replace('-', '').replace(' ', '');
                linkData.web = !((linkData.web.includes('http://')) || (linkData.web.includes('https://'))
                || linkData.web.length <= 0) ?
                    'https://' + linkData.web : linkData.web;

                this.socials = linkData;
                this.theirInfo = true;
            }else{
                this.theirInfo = false;
            }
        }, err => {
            console.error(err.error);
            this.utils.presentToast('Whoops! Unable to get their socials', 'error');
        });
    }

    segmentChanged(ev: any) {
        this.displayTF = ev.detail.value === 'tf';
    }

    createRequest(id: string) {
        this.rps.sendRequest(id, 2047).subscribe(() => this.utils.presentToast('Request Sent!', 'success'), (err) => {
            console.error(err.error.data);
            this.utils.presentToast('Whoops! Unable to send request', 'error');
        });
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

    async changePermissions() {
        const loading = await this.utils.presentAlert('Updating Permissions');

        this.ls.updatePermissions(this.permissions, this.userId).subscribe((val:any) => {
            Promise.all([this.utils.presentToast('User Permissions have been updated!', 'success'),loading.dismiss()]);
            this.currCode = val.data.code;
        }, async (err)=> {
            console.error(err);
            Promise.all([this.utils.presentToast('Whoops! Update failed', 'error'),loading.dismiss()]);
        })
    }

    async presentActionSheet() {
        const actionSheet = await this.actionSheet.create({
            header: this.socials.phone,
            buttons: [{
                text: 'Call',
                icon: 'call',
                handler: () => {
                    window.open('tel:' + this.socials.phone);
                }
            }, {
                text: 'Text/SMS',
                icon: 'chatbubble',
                handler: () => {
                    window.open('sms:' + this.socials.phone);
                }
            }, {
                text: 'Cancel',
                icon: 'close',
                role: 'cancel'
            }]
        });
        await actionSheet.present();
    }

    doRefresh(event){
        this.getOtherData();

        this.userBasicSub = this.us.getUserBasic(this.userId).subscribe({
            next: (data:any) => {
                this.userObj = data.data;
                event.target.complete();
            }, error: (err) => {
                this.utils.presentToast('Whoops! Unable to get profile info', 'error');
                console.error(err.error);
                event.target.complete();
            }
        });
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
