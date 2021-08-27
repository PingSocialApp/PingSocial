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

    }

    createAccount() {
        if ((this.newEmail !== '' && this.newPass !== '') && (this.newPass === this.rePass)) {
            this.auth.auth.createUserWithEmailAndPassword(this.newEmail, this.newPass).then((value) => {
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
        if (this.email !== '' && this.password !== '') {
            this.auth.auth.signInWithEmailAndPassword(this.email, this.password).then(value => {
                this.email = '';
                this.password = '';
                this.router.navigate(['/tabs']);
            }).catch((error) => {
                this.utils.presentToast(error.message);
                console.log(error.message);
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
                        console.log('Confirm Cancel');
                    }
                }, {
                    text: 'Ok',
                    handler: (alertData) => {
                        try {
                            this.auth.auth.sendPasswordResetEmail(alertData.email)
                        } catch (e) {
                            console.log(e);
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
