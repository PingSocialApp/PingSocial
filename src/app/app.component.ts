import {Component} from '@angular/core';
import {Platform} from '@ionic/angular';
import {SplashScreen} from '@capacitor/splash-screen';
import {StatusBar, Style, StyleOptions} from '@capacitor/status-bar';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
})
export class AppComponent{
    constructor(
        private platform: Platform,
    ) {
        this.initializeApp();
    }

    initializeApp() {
        this.platform.ready().then(() => {
            const options: StyleOptions = {
                style: Style.Light,
            }

            StatusBar.setStyle(options);
            SplashScreen.hide();
        });
    }

    cancelScan(){
        Promise.all([BarcodeScanner.stopScan(), BarcodeScanner.showBackground()]).then(() => {
            document.getElementById('app-content').style.display = 'flex';
            document.getElementById('qr-scanner').style.display = 'none';
        }).catch(e => console.error(e));
    }

}
