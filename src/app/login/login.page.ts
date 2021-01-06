import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AngularFireAuth} from '@angular/fire/auth';
import {AlertController, ToastController} from '@ionic/angular';

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
    constructor(private alertController: AlertController, public router: Router, private auth: AngularFireAuth, private toastController: ToastController) {
        this.loginScreen = true;
    }

    ngOnInit() {

    }

    createAccount() {
        if ((this.newEmail !== '' && this.newPass !== '') && (this.newPass === this.rePass)) {
            this.auth.auth.createUserWithEmailAndPassword(this.newEmail, this.newPass).then((value) => {
                this.auth.auth.signInWithEmailAndPassword(this.newEmail, this.newPass).then((val) => {
                    this.router.navigate(['/registration']);
                }).catch(async (error) => {
                    const toast = await this.toastController.create({
                        message: error.message,
                        duration: 2000
                    });
                    await toast.present();
                });
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
                        this.auth.auth.sendPasswordResetEmail(alertData.email).then(value => {

                        }).catch(e => {
                            console.log(e);
                        });
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
