import {Component, ViewChild, ElementRef} from '@angular/core';
import {ToastController, LoadingController, Platform} from '@ionic/angular';
import {BarcodeScanner, BarcodeScannerOptions} from '@ionic-native/barcode-scanner/ngx';
import {RequestsProgramService} from '../requests-program.service';
import jsQR from 'jsqr';

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

    constructor(public barcodeScanner: BarcodeScanner, private toastCtrl: ToastController, public rs: RequestsProgramService) {

    }

    scan() {
        // Function doesn't work on web version
        this.barcodeScanner.scan().then(barcodeData => {
            const dataArray = this.dataReveal(barcodeData.text);
            this.rs.sendRequest(dataArray[0], dataArray[1]);
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
                this.rs.sendRequest(dataArray[0], dataArray[1]);
            }else{
                const toast = await this.toastCtrl.create({
                    message: 'Invalid Code. Please Try Again',
                    duration: 2000
                });
                toast.present();
            }
        };
        img.src = URL.createObjectURL(file);
    }

    dataReveal(rawData: string){
        return [rawData.substring(rawData.indexOf('/')+1),rawData.substring(0,rawData.indexOf('/'))];
    }
}
