import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {QrcodePageRoutingModule} from './qrcode-routing.module';
// import {QrcodePage} from './qrcode.page';
import {BarcodeScanner} from '@ionic-native/barcode-scanner/ngx';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        QrcodePageRoutingModule
    ],
    // declarations: [QrcodePage],
    providers: [BarcodeScanner],
    exports: [
        // QrcodePage
    ]
})
export class QrcodePageModule {
}
