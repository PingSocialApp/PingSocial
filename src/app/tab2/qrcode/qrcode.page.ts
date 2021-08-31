import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BarcodeScanner, ScanOptions, SupportedFormat} from '@capacitor-community/barcode-scanner';
import {AlertController, ModalController, ToastController} from '@ionic/angular';
import jsQR from 'jsqr';
import { Share } from '@capacitor/share';
import { RequestsService } from 'src/app/services/requests.service';
import { UsersService } from 'src/app/services/users.service';
import { AuthHandler } from 'src/app/services/authHandler.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
    selector: 'app-qrcode',
    templateUrl: './qrcode.page.html',
    styleUrls: ['./qrcode.page.scss'],
    providers: []
})
export class QrcodePage implements OnInit, OnDestroy {
    @ViewChild('fileinput', {static: false}) fileinput: ElementRef;
    @ViewChild('canvas', {static: false}) canvas: ElementRef;

    userId: string;
    canvasElement: any;
    canvasContext: any;
    scanResult = null;
    phone = true;
    email = true;
    instagram = true;
    snapchat = true;
    facebook = true;
    tiktok = true;
    twitter = true;
    venmo = true;
    linkedin = true;
    professionalemail = true;
    website = true;
    qrData: string;
    displayScan: boolean;
    location = true;

    constructor(private modalController: ModalController, private utils: UtilsService,
   private toastCtrl: ToastController, private alertController: AlertController,
                private rs: RequestsService, private us: UsersService, private auth: AuthHandler) {

    }

    ngOnInit() {
        this.userId = this.auth.getUID();
        BarcodeScanner.prepare();
        this.updateVals();
    }

    ngOnDestroy() {
        Promise.all([BarcodeScanner.stopScan(), BarcodeScanner.showBackground()]).then(() => {
            document.getElementById('app-content').style.display = 'flex';
            document.getElementById('qr-scanner').style.display = 'none';
        }).catch(e => console.error(e));
    }

    segmentChanged(ev: any) {
        this.displayScan = ev.detail.value === 'sc';
    }

    async scan() {
        BarcodeScanner.hideBackground();
        const display = document.getElementById('app-content').style.display;
        document.getElementById('app-content').style.display = 'none';
        document.getElementById('qr-scanner').style.display = 'flex';
        const options: ScanOptions = {
            targetedFormats: [SupportedFormat.QR_CODE]
        }
        const result = await BarcodeScanner.startScan(options);
        if (result.hasContent) {
            console.log(result.content); // log the raw scanned content
            this.presentAlertConfirm(this.dataReveal(result.content));
        }
        BarcodeScanner.showBackground();
        document.getElementById('app-content').style.display = display;
        document.getElementById('qr-scanner').style.display = 'none';
    }

    captureImage() {
        this.fileinput.nativeElement.click();
    }

    handleFile(target: any) {
        const file = target.files.item(0);
        const img = new Image();
        this.canvasElement = this.canvas.nativeElement;
        this.canvasContext = this.canvasElement.getContext('2d');
        img.onload = async () => {
            this.canvasContext.drawImage(img, 0, 0, this.canvasElement.width, this.canvasElement.height);
            const imageData = this.canvasContext.getImageData(
                0,
                0,
                this.canvasElement.width,
                this.canvasElement.height
            );
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert'
            });

            if (code) {
                this.scanResult = code.data;
                const dataArray = this.dataReveal(code.data);
                this.presentAlertConfirm(dataArray);
            } else {
                const toast = await this.toastCtrl.create({
                    message: 'Invalid Code. Please Try Again',
                    duration: 2000
                });
                toast.present();
            }
        };
        img.src = URL.createObjectURL(file);
        target.value = '';
    }

    dataReveal(rawData: string) {
        return [rawData.substring(rawData.indexOf('/') + 1), rawData.substring(0, rawData.indexOf('/'))];
    }

    async presentAlertConfirm(dataArray: Array<string>) {
        if (this.userId === dataArray[0]) {
            this.utils.presentToast('Whoops, this is your code!');
            return;
        }
        this.us.getUserBasic(dataArray[0])
            .subscribe(async (data:any) => {
            const alert = await this.alertController.create({
                header: 'Confirm Request!',
                message: 'Do you want to link with ' + data.data.name,
                buttons: [
                    {
                        text: 'Cancel',
                        role: 'cancel',
                        cssClass: 'secondary',
                        handler: () => {
                        }
                    },
                    {
                        text: 'Okay',
                        handler: () => {
                            this.rs.sendRequest(dataArray[0], parseInt(dataArray[1], 10)).subscribe({
                                next: () => {
                                    this.utils.presentToast('Successfull added ' + data.data.name);
                                },
                                error: (error) => {
                                    console.error(error);
                                    this.utils.presentToast('Whoops! Unexpected error, try again')
                                }
                            });
                        }
                    }
                ]
            });
            await alert.present();
        }, err => {
            console.error(err);
            this.utils.presentToast('Whoops! Unable to get link data');
        })
    }

    updateVals() {
        // tslint:disable-next-line:no-bitwise
        const locationVal = +!!this.location << 11;
        // tslint:disable-next-line:no-bitwise
        const phoneVal = +!!this.phone << 10;
        // tslint:disable-next-line:no-bitwise
        const emailVal = +!!this.email << 9;
        // tslint:disable-next-line:no-bitwise
        const instagramVal = +!!this.instagram << 8;
        // tslint:disable-next-line:no-bitwise
        const snapVal = +!!this.snapchat << 7;
        // tslint:disable-next-line:no-bitwise
        const facebookVal = +!!this.facebook << 6;
        // tslint:disable-next-line:no-bitwise
        const tiktokVal = +!!this.tiktok << 5;
        // tslint:disable-next-line:no-bitwise
        const twitterVal = +!!this.twitter << 4;
        // tslint:disable-next-line:no-bitwise
        const venmoVal = +!!this.venmo << 3;
        // tslint:disable-next-line:no-bitwise
        const linkedinVal = +!!this.linkedin << 2;
        // tslint:disable-next-line:no-bitwise
        const proemailVal = +!!this.professionalemail << 1;
        // tslint:disable-next-line:no-bitwise
        const websiteVal = +!!this.website << 0;
        // tslint:disable-next-line:no-bitwise max-line-length
        const code = locationVal | phoneVal | emailVal | instagramVal | snapVal | facebookVal | tiktokVal | twitterVal | venmoVal | linkedinVal | proemailVal | websiteVal;
        this.qrData = code + '/' + this.userId;
    }

    async shareQR() {
        await Share.share({
            title: 'Check out my Ping Code!',
            url: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + this.qrData
        });
    }

    closeModal() {
        this.modalController.dismiss();
    }
}