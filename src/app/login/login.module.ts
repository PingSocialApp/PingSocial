import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {LoginPageRoutingModule} from './login-routing.module';
import {LoginPage} from './login.page';
// tslint:disable-next-line:import-spacing
import {RouterModule} from '@angular/router';
import { AngularFireStorage } from '@angular/fire/storage';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        LoginPageRoutingModule,
        RouterModule,
    ],
    declarations: [LoginPage],
    bootstrap: [LoginPage],
    providers: [AngularFireStorage]
})
export class LoginPageModule {
}
