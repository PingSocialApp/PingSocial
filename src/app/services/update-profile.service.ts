import {Injectable} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {AngularFireStorage} from '@angular/fire/storage';
import {ToastController} from '@ionic/angular';

@Injectable({
    providedIn: 'root',
})
export class UpdateProfileService {
    fileName: string;
    latestPhoto: string | ArrayBuffer;
    currentUserId: string;
    currentUserRef: AngularFirestoreDocument;

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

    async updateSettings(interests: Array<string>, values: Array<string>) {
        if ((document.getElementById('username') as HTMLInputElement).value === '') {
            this.presentToast('Whoops! Looks like you forgot your name');
            return;
        } else if (interests === undefined || values === undefined) {
            this.presentToast('Whoops! Looks like your preferences might be empty');
            return;
        } else if (interests.length > 5 || interests.length > 5) {
            this.presentToast('Whoops! Looks like you entered more than 5 interest/values');
            return;
        } else {
            await this.updateProfilePic();
            await this.updateSocials();

            // TODO Update Profile Type
            await this.currentUserRef.update({
                name: (document.getElementById('username') as HTMLInputElement).value,
                bio: (document.getElementById('bio') as HTMLInputElement).value
            }).catch(error => {
                this.presentToast('Whoops, unexpected error');
            });

            await this.firestore.collection('preferences').doc(this.currentUserId).update({
                preferences: interests,
                valueTraits: values,
            }).then(val => {
                this.presentToast('Profile Updated!');
            }).catch(error => {
                this.presentToast('Whoops, unexpected error');
            });
        }
    }

    private async updateSocials() {
        this.firestore.collection('socials').doc(this.currentUserId).update({
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
        }).catch(error => {
            this.presentToast('Whoops, unexpected error');
        });
    }

    private async updateProfilePic() {
        if (this.fileName != null) {
            // TODO delete old profile pic
            const ref = this.storage.ref(this.currentUserId + this.fileName);
            if (typeof this.latestPhoto === 'string') {
                ref.putString(this.latestPhoto, 'data_url').then(snapshot => {
                    this.currentUserRef.update({
                        profilepic: 'gs://circles-4d081.appspot.com/' + (
                            this.currentUserId
                            + this.fileName)
                    }).then(value => {
                        this.fileName = null;
                        this.latestPhoto = null;
                    }).catch(error => {
                        this.presentToast('Whoops, unexpected error');
                    });
                });
            }
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
