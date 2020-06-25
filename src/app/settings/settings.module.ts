import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {SettingsPageRoutingModule} from './settings-routing.module';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {RouterModule} from '@angular/router';
import {AngularFireStorageModule} from '@angular/fire/storage';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule,
        AngularFireStorageModule,
        AngularFireAuthModule,
        SettingsPageRoutingModule
    ],
    // declarations: [SettingsPage]
})
export class SettingsPageModule {
}
