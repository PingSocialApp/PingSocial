import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {LoginPageRoutingModule} from './login-routing.module';
import {LoginPage} from './login.page';
// tslint:disable-next-line:import-spacing
import {AngularFireAuthModule} from '@angular/fire/auth';
import {RouterModule} from '@angular/router';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        LoginPageRoutingModule,
        RouterModule,
        AngularFireAuthModule,
    ],
    declarations: [LoginPage],
    bootstrap: [LoginPage]
})
export class LoginPageModule {
}
