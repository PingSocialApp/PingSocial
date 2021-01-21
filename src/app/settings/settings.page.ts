import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ModalController, ToastController} from '@ionic/angular';
import {AngularFireAuth} from '@angular/fire/auth';
import {Router} from '@angular/router';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {AngularFireStorage} from '@angular/fire/storage';
import {UpdateProfileService} from '../services/update-profile.service';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.page.html',
    styleUrls: ['./settings.page.scss'],
    providers: [AngularFireAuth, UpdateProfileService, AngularFireStorage]
})


export class SettingsPage implements OnInit {
    @ViewChild('fileinput', {static: false}) fileinput: ElementRef;

    currentUserRef: AngularFirestoreDocument;
    currentUserBasic: any;
    currentUserId: string;
    currentUserSocials: Observable<any>;

    constructor(private modalCtrl: ModalController, private auth: AngularFireAuth, private r: Router, private firestore: AngularFirestore
        , private toastController: ToastController, private storage: AngularFireStorage, private updateProfileService: UpdateProfileService) {
        this.currentUserId = this.auth.auth.currentUser.uid;
        this.currentUserRef = this.firestore.collection('users').doc(this.currentUserId);
        this.currentUserBasic = new Observable<any>();
        this.currentUserSocials = new Observable<any>();
    }

    ngOnInit() {
        this.currentUserBasic = this.currentUserRef.get().pipe(map(ret => {
            this.setData(ret.get('profilepic'));
            return {
                name: ret.get('name'),
                bio: ret.get('bio')
            }
        }))

        this.currentUserSocials = this.firestore.collection('socials').doc(this.currentUserId).get().pipe(map(ret => ret.data()));
    }

    setData(res){
        if (res.startsWith('h')) {
            document.getElementById('imagePreview').style.backgroundImage = 'url(' + res + ')';
        } else {
            this.storage.storage.refFromURL(res).getDownloadURL().then(url => {
                document.getElementById('imagePreview').style.backgroundImage = 'url(' + url + ')';
            });
        }
    }

    updateSettings() {
        this.updateProfileService.updateSettings();
    }

    logout() {
        this.auth.auth.signOut().then(() => {
            this.closeModal();
            this.r.navigate(['/login']);
        }).catch((er) => console.log(er));
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
        this.updateProfileService.handleFile(files);
    }

}
