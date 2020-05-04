import {Component, ViewChild, ElementRef} from '@angular/core';
import {ToastController, AlertController} from '@ionic/angular';
import {BarcodeScanner} from '@ionic-native/barcode-scanner/ngx';
import {RequestsProgramService} from '../requests-program.service';
import jsQR from 'jsqr';
import {AngularFirestore} from '@angular/fire/firestore';

@Component({
    selector: 'app-tab1',
    templateUrl: 'tab1.page.html',
    styleUrls: ['tab1.page.scss'],
    providers: [RequestsProgramService]
})
export class Tab1Page {

    @ViewChild('fileinput', {static: false}) fileinput: ElementRef;
    @ViewChild('canvas', {static: false}) canvas: ElementRef;

    canvasElement: any;
    videoElement: any;
    canvasContext: any;
    scanResult = null;

    constructor(public barcodeScanner: BarcodeScanner, private db: AngularFirestore, private toastCtrl: ToastController, private alertController: AlertController, public rs: RequestsProgramService) {

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
            }else{
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

    dataReveal(rawData: string){
        return [rawData.substring(rawData.indexOf('/')+1),rawData.substring(0,rawData.indexOf('/'))];
    }

    async presentAlertConfirm(dataArray: Array<string>) {
        console.log('hey');
        this.db.collection('users').doc(dataArray[0]).get().subscribe(async (data) => {
            const alert = await this.alertController.create({
                header: 'Confirm Request!',
                message: 'Do you want to link with ' + data.data().name,
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
                            this.rs.sendRequest(dataArray[0], dataArray[1]);
                        }
                    }
                ]
            });

            await alert.present();
        });
    }
}
