import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {RequestsProgramService} from '../../services/requests-program.service';
import {AngularFireAuth} from '@angular/fire/auth';
import {BarcodeScanner} from '@ionic-native/barcode-scanner/ngx';
import {AngularFirestore} from '@angular/fire/firestore';
import {AlertController, ModalController, ToastController} from '@ionic/angular';
import jsQR from 'jsqr';
import {SocialSharing} from '@ionic-native/social-sharing/ngx'
import {first} from 'rxjs/operators';

@Component({
    selector: 'app-qrcode',
    templateUrl: './qrcode.page.html',
    styleUrls: ['./qrcode.page.scss'],
    providers: [RequestsProgramService, AngularFireAuth, BarcodeScanner, SocialSharing]
})
export class QrcodePage implements OnInit {
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

    constructor(private modalController: ModalController,
    private socialSharing: SocialSharing, private auth: AngularFireAuth, public barcodeScanner: BarcodeScanner,
                private db: AngularFirestore, private toastCtrl: ToastController, private alertController: AlertController,
                public rs: RequestsProgramService) {
        this.userId = this.auth.auth.currentUser.uid;
        this.updateVals();
    }

    ngOnInit() {
    }

    segmentChanged(ev: any) {
        this.displayScan = ev.detail.value === 'sc';
    }

    scan() {
        // Function doesn't work on web version
        this.barcodeScanner.scan().then(barcodeData => {
            const dataArray = this.dataReveal(barcodeData.text);
            this.presentAlertConfirm(dataArray);
        }).catch(err => {
            console.log('Error', err);
        });
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
        this.db.collection('users').doc(dataArray[0]).get().pipe(first())
            .subscribe(async (data) => {
            const alert = await this.alertController.create({
                header: 'Confirm Request!',
                message: 'Do you want to link with ' + data.get('name'),
                buttons: [
                    {
                        text: 'Cancel',
                        role: 'cancel',
                        cssClass: 'secondary',
                        handler: (blah) => {
                        }
                    }, {
                        text: 'Okay',
                        handler: () => {
                            this.rs.sendRequest(dataArray[0], parseInt(dataArray[1], 10));
                        }
                    }
                ]
            });
            await alert.present();
        });
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

    shareQR() {
        const options = {
            message: 'Check out my Ping Code!',
            files: ['https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + this.qrData]
        }
        this.socialSharing.shareWithOptions(options);
    }

    closeModal() {
        this.modalController.dismiss();
    }
}