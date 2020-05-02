import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import {AngularFireAuth} from '@angular/fire/auth';

// tslint:disable-next-line:import-spacing

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  email: string;
  newEmail: string;
  newPass: string;
  password: string;
  loginScreen: boolean;
  rePass: string;

  // tslint:disable-next-line:no-shadowed-variable
  constructor(public router: Router, private auth: AngularFireAuth) {
    this.loginScreen = true;
    // Todo
    this.auth.auth.onAuthStateChanged((user) => {
      if(user){
        this.router.navigate(['/tabs']);
      }else{
        // this.r.navigate(['/']);
      }
    });
  }

  ngOnInit() {

  }

  createAccount() {
    if ((this.newEmail !== '' && this.newPass !== '') && (this.newPass === this.rePass)) {
      this.auth.auth.createUserWithEmailAndPassword(this.newEmail, this.newPass).then((value) => {
      }).catch((error) => {
        console.log(error);
      });
    }
  }

  login(){
    if (this.email !== '' && this.password !== ''){
      this.auth.auth.signInWithEmailAndPassword(this.email, this.password).then((value) => {
        this.router.navigate(['/tabs']);
      }).catch((error) => {
        console.log(error)
      });
    }
  }
}
