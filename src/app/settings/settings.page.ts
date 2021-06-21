import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ModalController} from '@ionic/angular';
import {AngularFireAuth} from '@angular/fire/auth';
import {Router} from '@angular/router';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {UsersService} from '../services/users.service';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {UtilsService} from '../services/utils.service'

@Component({
    selector: 'app-settings',
    templateUrl: './settings.page.html',
    styleUrls: ['./settings.page.scss'],
    providers: [AngularFireAuth, UsersService]
})


export class SettingsPage implements OnInit {
    @ViewChild('fileinput', {static: false}) fileinput: ElementRef;

    currentUserRef: AngularFirestoreDocument;
    currentUserBasic: any;
    currentUserId: string;
    currentUserSocials: Observable<any>;

    constructor(private modalCtrl: ModalController, private auth: AngularFireAuth, private r: Router, private firestore: AngularFirestore
        ,private us: UsersService, private utils: UtilsService) {
        this.currentUserId = this.auth.auth.currentUser.uid;
        this.currentUserRef = this.firestore.collection('users').doc(this.currentUserId);
        this.currentUserBasic = new Observable<any>();
        this.currentUserSocials = new Observable<any>();
    }

    ngOnInit() {
        this.currentUserBasic = this.us.getUserBasic(this.auth.auth.currentUser.uid).pipe(map((ret:any) => {
            document.getElementById('imagePreview').style.backgroundImage = 'url(' + ret.data.profilepic + ')';
            return {
                name: ret.data.name,
                bio: ret.data.bio
            }
        }))

        this.currentUserSocials = this.firestore.collection('socials').doc(this.currentUserId).get().pipe(map(ret => ret.data()));
    }

    updateSettings() {
        this.us.updateProfile().subscribe(val => {
            this.utils.presentToast('Profile Updated!');
        }, err => {
            this.utils.presentToast('Whoops! Update Failed');
            console.error(err.error);
        });
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
        this.us.handleFile(files);
    }

}
