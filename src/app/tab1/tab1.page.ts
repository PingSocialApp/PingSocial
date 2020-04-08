import {Component, ViewChild, ElementRef} from '@angular/core';
import {ToastController, LoadingController, Platform} from '@ionic/angular';
import {BarcodeScanner,BarcodeScannerOptions} from '@ionic-native/barcode-scanner/ngx';
import jsQR from 'jsqr';

@Component({
    selector: 'app-tab1',
    templateUrl: 'tab1.page.html',
    styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
    // https://devdactic.com/pwa-qr-scanner-ionic/

    @ViewChild('fileinput', { static: false }) fileinput: ElementRef;
    @ViewChild('canvas', { static: false }) canvas: ElementRef;

    canvasElement: any;
    videoElement: any;
    canvasContext: any;
    scanResult = null;

    constructor(public barcodeScanner: BarcodeScanner,  private toastCtrl: ToastController) {
    }

   scan(){
       // Function doesn't work on web version
       this.barcodeScanner.scan().then(barcodeData => {
           console.log('Barcode data', barcodeData);
       }).catch(err => {
           console.log('Error', err);
       });
   }

    captureImage() {
        this.fileinput.nativeElement.click();
    }

    handleFile(files: FileList) {
        const file = files.item(0);
        const img = new Image();
        img.onload = () => {
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
                this.showQrToast();
            }
        };
        img.src = URL.createObjectURL(file);
    }
    async showQrToast() {
        const toast = await this.toastCtrl.create({
            message: `Open ${this.scanResult}?`,
            position: 'top',
            buttons: [
                {
                    text: 'Open',
                    handler: () => {
                        window.open(this.scanResult, '_system', 'location=yes');
                    }
                }
            ]
        });
        toast.present();
    }

}
