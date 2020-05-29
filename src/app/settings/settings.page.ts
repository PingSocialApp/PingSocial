import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ModalController, ToastController} from '@ionic/angular';
import {AngularFireAuth} from '@angular/fire/auth';
import {Router} from '@angular/router';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import * as firebase from 'firebase/app';
import {AngularFireStorage} from '@angular/fire/storage';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.page.html',
    styleUrls: ['./settings.page.scss'],
    providers: [AngularFireAuth, AngularFireStorage]
})


export class SettingsPage implements OnInit {
    @ViewChild('fileinput', { static: false }) fileinput: ElementRef;

    currentUserRef: AngularFirestoreDocument;
    currentUser: any;
    currentUserId: string;
    fileName: string;
    latestPhoto: string | ArrayBuffer;

    constructor(private modalCtrl: ModalController, private auth: AngularFireAuth, private r: Router, private firestore: AngularFirestore
        , private toastController: ToastController, private storage: AngularFireStorage) {
        this.fileName = null;
        this.latestPhoto = null;
        this.currentUserId = this.auth.auth.currentUser.uid;
        this.currentUserRef = this.firestore.collection('users').doc(this.currentUserId);
    }

    ngOnInit(){
        this.currentUserRef.get()
            .subscribe(res => {
                this.currentUser = res.data();
                if (this.currentUser.profilepic.startsWith('h')) {
                    document.getElementById('imagePreview').style.backgroundImage = 'url('+this.currentUser.profilepic+')';
                } else {
                    this.storage.storage.refFromURL(this.currentUser.profilepic).getDownloadURL().then(url => {
                        document.getElementById('imagePreview').style.backgroundImage = 'url('+url+')';
                    });
                }
            });
    }

    updateSettings() {
        //TODO Check 5 Interests
        if ((document.getElementById('username') as HTMLInputElement).value === '' ||
            (document.getElementById('bio') as HTMLInputElement).value === '') {
            this.presentToast('Whoops! Looks like some of your settings might be empty');
        } else {
            if(this.fileName != null){
                const ref = this.storage.ref(this.currentUserId + this.fileName);
                if (typeof this.latestPhoto === 'string') {
                    ref.putString(this.latestPhoto, 'data_url').then(snapshot => {
                        console.log(this.fileName);
                        this.firestore.collection('users').doc(
                            this.currentUserId
                        ).update({
                            profilepic: 'gs://circles-4d081.appspot.com/' + (
                                this.currentUserId
                                + this.fileName)
                        }).then(value => {
                            this.fileName = null;
                            this.latestPhoto = null;
                        })
                    });
                }
            }
                this.currentUserRef.update({
                    name: (document.getElementById('username') as HTMLInputElement).value,
                    bio: (document.getElementById('bio') as HTMLInputElement).value,
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
                }).then(() => {
                    this.presentToast('Settings Updated!');
                });
        }
    }

    async presentToast(displayMessage: string) {
        const toast = await this.toastController.create({
            message: displayMessage,
            duration: 2000
        });
        toast.present();
    }

    logout() {
        this.auth.auth.signOut().then(() => {
            this.closeModal();
            this.r.navigate(['/login']);
        });
    }

    closeModal() {
        this.modalCtrl.dismiss({
            dismissed: true
        });
    }

    captureImage() {
        this.fileinput.nativeElement.click();
    }

    handleFile(files: FileList) {
        const file = files.item(0);

        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('imagePreview').style.backgroundImage=  'url('+e.target.result+')';
        }
        this.fileName = file.name;
        reader.readAsDataURL(file);
        reader.addEventListener('loadend',  () => {
            this.latestPhoto = reader.result;
        });
    }

}
