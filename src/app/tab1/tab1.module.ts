import {IonicModule} from '@ionic/angular';
import {RouterModule} from '@angular/router';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Tab1Page} from './tab1.page';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {QrcodePageModule} from '../tab2/qrcode/qrcode.module';

@NgModule({
    imports: [
        IonicModule,
        CommonModule,
        AngularFireAuthModule,
        FormsModule,
        RouterModule.forChild([{path: '', component: Tab1Page}]),
        QrcodePageModule,
    ],
    declarations: [Tab1Page]
})

export class Tab1PageModule {

}
