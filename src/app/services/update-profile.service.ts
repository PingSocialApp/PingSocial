import {Injectable} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {AngularFireStorage} from '@angular/fire/storage';
import {ToastController} from '@ionic/angular';
import {GetResult, Storage} from '@capacitor/storage';

@Injectable({
    providedIn: 'root',
})
export class UpdateProfileService {
    fileName: string;
    latestPhoto: string | ArrayBuffer;
    currentUserId: string;
    currentUserRef: AngularFirestoreDocument;
    currentUserId: GetResult;

    constructor(private toastController: ToastController,
                private auth: AngularFireAuth, private firestore: AngularFirestore, private storage: AngularFireStorage) {
        this.currentUserId = this.auth.auth.currentUser.uid;
        this.currentUserRef = this.firestore.collection('users').doc(this.currentUserId);
    }

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
            this.presentToast('Whoops! Looks like you forgot your name');
            return;
        } else {
            const batch = this.firestore.firestore.batch();
            const obj = {
                name: (document.getElementById('username') as HTMLInputElement).value,
                bio: (document.getElementById('bio') as HTMLInputElement).value
            };

            batch.update(this.firestore.collection('socials').doc(this.currentUserId).ref, {
                facebookID: (document.getElementById('fb') as HTMLInputElement).value,
                instagramID: (document.getElementById('ig') as HTMLInputElement).value,
                twitterID: (document.getElementById('tw') as HTMLInputElement).value,
                personalEmailID: (document.getElementById('peem') as HTMLInputElement).value,
                linkedinID: (document.getElementById('li') as HTMLInputElement).value,
                professionalEmailID: (document.getElementById('prem') as HTMLInputElement).value,
                snapchatID: (document.getElementById('sc') as HTMLInputElement).value,
                tiktokID: (document.getElementById('tt') as HTMLInputElement).value,
                venmoID: (document.getElementById('ve') as HTMLInputElement).value,
                websiteID: (document.getElementById('ws') as HTMLInputElement).value,
            });

            if (this.fileName != null) {
                // TODO delete old profile pic
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

            batch.update(this.currentUserRef.ref, obj);
            batch.commit().then(() => this.presentToast('Profile Updated!')).catch(e => {
                console.log(e);
                this.presentToast('Whoops! An unexpected error occurred');
            });

            // TODO Update Profile Type
        }
    }

    async presentToast(displayMessage: string) {
        const toast = await this.toastController.create({
            message: displayMessage,
            duration: 2000
        });
        toast.present();
    }
}
