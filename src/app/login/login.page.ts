import { Component, OnInit } from '@angular/core';
import {FirebaseUISignInFailure, FirebaseUISignInSuccessWithAuthResult} from 'firebaseui-angular';
import { Storage } from '@ionic/storage';
import {Router} from '@angular/router';


// tslint:disable-next-line:import-spacing

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  // tslint:disable-next-line:no-shadowed-variable
  constructor(private Storage: Storage, public router: Router) { }

  ngOnInit() {
  }

  successCallback(signInSuccessData: FirebaseUISignInSuccessWithAuthResult) {
    this.Storage.set('uid',signInSuccessData.authResult.user.uid);
    this.router.navigate(['/tabs']);
  }

  errorCallback(errorData: FirebaseUISignInFailure) {

  }

}
