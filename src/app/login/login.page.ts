import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AngularFireAuth} from '@angular/fire/auth';
import {ToastController} from '@ionic/angular';

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
    constructor(public router: Router, private auth: AngularFireAuth, private toastController: ToastController) {
        this.loginScreen = true;
    }

    ngOnInit() {

    }

    createAccount() {
        if ((this.newEmail !== '' && this.newPass !== '') && (this.newPass === this.rePass)) {
            this.auth.auth.createUserWithEmailAndPassword(this.newEmail, this.newPass).then((value) => {
            }).catch(async (error) => {
                const toast = await this.toastController.create({
                    message: error.message,
                    duration: 2000
                });
                await toast.present();
            });
        }
    }

    login() {
        if (this.email !== '' && this.password !== '') {
            this.auth.auth.signInWithEmailAndPassword(this.email, this.password).then((value) => {
                this.router.navigate(['/tabs']);
            }).catch(async (error) => {
                const toast = await this.toastController.create({
                    message: error.message,
                    duration: 2000
                });
                await toast.present();
            });
        }
    }
}
