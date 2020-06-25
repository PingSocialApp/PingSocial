import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {RequestsPageRoutingModule} from './requests-routing.module';
import {RequestsPage} from './requests.page';
import {AngularFireStorageModule} from '@angular/fire/storage';
import {AngularFireAuthModule} from '@angular/fire/auth';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        AngularFireAuthModule,
        IonicModule,
        AngularFireStorageModule,
        RequestsPageRoutingModule
    ],
    declarations: [RequestsPage]
})
export class RequestsPageModule {
}
