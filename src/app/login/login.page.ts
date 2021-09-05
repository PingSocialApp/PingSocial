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

    createAccount() {
        if(this.newEmail === '') {
            this.utils.presentToast('Whoops! Missing Email');
        }else if(this.newPass === ''){
            this.utils.presentToast('Whoops! Missing Password');
        }else if(this.newPass !== this.rePass){
            this.utils.presentToast('Whoops! Passwords don\'t match');
        }else {
            this.auth.createUserWithEmailAndPassword(this.newEmail, this.newPass).then((value) => {
                this.us.createUser().subscribe(success => {
                    this.router.navigate(['/registration']);
                }, fail => {
                    this.utils.presentToast(fail.error);
                    console.error(fail.error);
                });
            }).catch((error) => {
                this.utils.presentToast(error.message);
                console.error(error.message);
            });
        }
    }

    login() {
        if(this.email === ''){
            this.utils.presentToast('Whoops! Empty Email');
        } else if(this.password === ''){
            this.utils.presentToast('Whoops! Empty Email');
        } else {
            this.auth.signInWithEmailAndPassword(this.email, this.password).then(() => {
                this.email = '';
                this.password = '';
                this.router.navigate(['/tabs']);
            }).catch((error) => {
                this.utils.presentToast(error.message);
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
