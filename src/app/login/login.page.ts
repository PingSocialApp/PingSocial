import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AngularFireAuth} from '@angular/fire/auth';
import {AlertController} from '@ionic/angular';
import { UtilsService } from '../services/utils.service';
import { UsersService } from '../services/users.service';

// tslint:disable-next-line:import-spacing

@Component({
    selector: 'app-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
    providers: []
})
export class LoginPage implements OnInit {
    email: string;
    newEmail: string;
    newPass: string;
    password: string;
    loginScreen: boolean;
    rePass: string;

    // tslint:disable-next-line:no-shadowed-variable
    constructor(private alertController: AlertController, public router: Router, private auth: AngularFireAuth,
        private utils: UtilsService, private us: UsersService) {
        this.loginScreen = true;
    }

    ngOnInit() {
        this.newEmail = '';
        this.newPass = '';
        this.rePass = '';
        this.email = '';
        this.password = '';
    }

    async createAccount() {
        if(this.newEmail === '') {
            this.utils.presentToast('Whoops! Missing Email', 'warning');
        }else if(this.newPass === ''){
            this.utils.presentToast('Whoops! Missing Password', 'warning');
        }else if(this.newPass !== this.rePass){
            this.utils.presentToast('Whoops! Passwords don\'t match', 'warning');
        }else {
            const alert = await this.utils.presentAlert('Creating Account');

            this.auth.createUserWithEmailAndPassword(this.newEmail, this.newPass).then(() => {
                this.us.createUser().subscribe(() => {
                    Promise.all([this.router.navigate(['/registration']),alert.dismiss()]);
                }, fail => {
                    Promise.all([this.utils.presentToast(fail.error, 'error'),alert.dismiss()]);
                    console.error(fail.error);
                });
            }).catch((error) => {
                Promise.all([this.utils.presentToast(error.message, 'error')]);
                console.error(error.message);
            });
        }
    }

    async login() {
        if(this.email === ''){
            this.utils.presentToast('Whoops! Empty Email', 'warning');
        } else if(this.password === ''){
            this.utils.presentToast('Whoops! Empty Email', 'warning');
        } else {
            const alert = await this.utils.presentAlert('Logging In');

            this.auth.signInWithEmailAndPassword(this.email, this.password).then(() => {
                this.email = '';
                this.password = '';
                Promise.all([this.router.navigate(['/tabs']), alert.dismiss()]);
            }).catch((error) => {
                Promise.all([this.utils.presentToast(error.message, 'error'),alert.dismiss()]);
                console.error(error.message);
            });
        }
    }

    async forgotPassAlert() {
        const alert = await this.alertController.create({
            header: 'Aw man',
            message: 'We\'ll send you an email to reset it',
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    cssClass: 'secondary',
                    handler: () => {
                    }
                }, {
                    text: 'Ok',
                    handler: (alertData) => {
                        try {
                            this.auth.sendPasswordResetEmail(alertData.email)
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
            ],
            inputs: [
                {
                    name: 'email',
                    type: 'email',
                    placeholder: this.email
                }
            ]
        });

        await alert.present();
    }
}
