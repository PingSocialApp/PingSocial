import {Injectable} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireStorage} from '@angular/fire/storage';
import {ToastController} from '@ionic/angular';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {GetResult, Storage} from '@capacitor/storage';
import {RESTApi} from './rest-service.service';
import {retry} from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class UpdateProfileService {
    fileName: string;
    latestPhoto: string | ArrayBuffer;
    currentUserId: GetResult;


    constructor(private toastController: ToastController, private http: HttpClient, private auth: AngularFireAuth,
                private firestore: AngularFirestore, private storage: AngularFireStorage, private rs: RESTApi) {}

    handleFile(files: FileList) {
        const file = files.item(0);

        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('imagePreview').style.backgroundImage = 'url(' + e.target.result + ')';
        }
        this.fileName = file.name;
        reader.readAsDataURL(file);
        reader.addEventListener('loadend', () => {
            this.latestPhoto = reader.result;
        });
    }

    async updateSettings() {
        if ((document.getElementById('username') as HTMLInputElement).value === '') {
            await this.presentToast('Whoops! Looks like you forgot your name');
            return;
        } else {
            this.currentUserId = await Storage.get({key: 'name'});
            const userObject = {
                name: (document.getElementById('username') as HTMLInputElement).value,
                bio: (document.getElementById('bio') as HTMLInputElement).value,
                profilepic: null
            };

            const socialsPromise = this.firestore.collection('socials').doc(this.currentUserId.value).update({
                facebook: (document.getElementById('fb') as HTMLInputElement).value,
                instagram: (document.getElementById('ig') as HTMLInputElement).value,
                twitter: (document.getElementById('tw') as HTMLInputElement).value,
                personalEmail: (document.getElementById('peem') as HTMLInputElement).value,
                linkedin: (document.getElementById('li') as HTMLInputElement).value,
                professionalEmail: (document.getElementById('prem') as HTMLInputElement).value,
                snapchat: (document.getElementById('sc') as HTMLInputElement).value,
                tiktok: (document.getElementById('tt') as HTMLInputElement).value,
                venmo: (document.getElementById('ve') as HTMLInputElement).value,
                website: (document.getElementById('ws') as HTMLInputElement).value,
            });

            if (this.fileName != null) {
                // TODO delete old profile pic set uniform name of photo
                const ref = this.storage.ref(this.currentUserId + this.fileName);
                if (typeof this.latestPhoto === 'string') {
                    ref.putString(this.latestPhoto, 'data_url').then(snapshot => {
                        // @ts-ignore
                        obj.profilepic = 'gs://circles-4d081.appspot.com/' + (
                            this.currentUserId
                            + this.fileName);
                    }).catch(() => this.presentToast('Whoops! Profile pic had a problem'))
                }
            }

            const userPromise = this.http.post(environment.apiURL.users + this.currentUserId, userObject,
                await this.rs.getHeader()).pipe(retry(3));

            Promise.all([socialsPromise,userPromise]).then(() => this.presentToast('Profile Updated!')).catch(e => {
                console.log(e);
                this.presentToast('Whoops! An unexpected error occurred');
            });
        }
    }

    async presentToast(displayMessage: string) {
        const toast = await this.toastController.create({
            message: displayMessage,
            duration: 2000
        });
        await toast.present();
    }
}
