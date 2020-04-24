import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import {IonicStorageModule} from '@ionic/storage';

import { LoginPageRoutingModule } from './login-routing.module';

import { LoginPage } from './login.page';

// tslint:disable-next-line:import-spacing

import {FirebaseUIModule, firebase, firebaseui} from 'firebaseui-angular';

import {AngularFireModule} from '@angular/fire';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {environment} from '../../environments/environment';
import {RouterModule} from '@angular/router';

const firebaseUiAuthConfig: firebaseui.auth.Config = {
  signInFlow: 'popup',
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
  ],
  tosUrl: 'google.com',
  privacyPolicyUrl: 'google.com',
  credentialHelper: firebaseui.auth.CredentialHelper.ACCOUNT_CHOOSER_COM
};

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IonicStorageModule.forRoot(),
    LoginPageRoutingModule,
    RouterModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    FirebaseUIModule.forRoot(firebaseUiAuthConfig)
  ],
  declarations: [LoginPage],
  bootstrap: [LoginPage]
})
export class LoginPageModule {
}
