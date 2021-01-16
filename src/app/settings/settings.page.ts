import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ModalController, ToastController} from '@ionic/angular';
import {AngularFireAuth} from '@angular/fire/auth';
import {Router} from '@angular/router';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {AngularFireStorage} from '@angular/fire/storage';
import {UpdateProfileService} from '../services/update-profile.service';
import {first} from 'rxjs/operators';

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
    currentUser: any;
    currentUserId: string;
    myInterests: Array<string>;
    myValues: Array<string>;

    constructor(private modalCtrl: ModalController, private auth: AngularFireAuth, private r: Router, private firestore: AngularFirestore
        , private toastController: ToastController, private storage: AngularFireStorage, private updateProfileService: UpdateProfileService) {
        this.currentUserId = this.auth.auth.currentUser.uid;
        this.currentUserRef = this.firestore.collection('users').doc(this.currentUserId);
    }

    ngOnInit() {
        this.currentUserRef.get().pipe(first())
            .subscribe(res => {
                this.currentUserBasic = res.data();
                if (this.currentUserBasic.profilepic.startsWith('h')) {
                    document.getElementById('imagePreview').style.backgroundImage = 'url(' + this.currentUserBasic.profilepic + ')';
                } else {
                    this.storage.storage.refFromURL(this.currentUserBasic.profilepic).getDownloadURL().then(url => {
                        document.getElementById('imagePreview').style.backgroundImage = 'url(' + url + ')';
                    });
                }
            });
        this.firestore.collection('socials').doc(this.currentUserId).get().pipe(first()).subscribe(res => {
            this.currentUser = res.data();
        });
        this.firestore.collection('preferences').doc(this.currentUserId).get().pipe(first()).subscribe(res => {
            this.myValues = res.get('valueTraits');
            this.myInterests = res.get('preferences');
        });
    }

    updateSettings() {
        this.updateProfileService.updateSettings(this.myInterests, this.myValues);
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
        this.updateProfileService.handleFile(files);
    }

}
