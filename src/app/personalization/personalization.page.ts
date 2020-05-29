import {Component, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireStorage} from '@angular/fire/storage';
import {AngularFireAuth} from '@angular/fire/auth';


@Component({
    selector: 'app-personalization',
    templateUrl: './personalization.page.html',
    styleUrls: ['./personalization.page.scss'],
    providers: [AngularFireStorage]
})
export class PersonalizationPage implements OnInit {
    userName: string;
    userBio: string;
    img: string;

    constructor(private auth: AngularFireAuth, private fs: AngularFirestore, private storage: AngularFireStorage) {
        this.fs.collection('users').doc(this.auth.auth.currentUser.uid).get().subscribe((data) => {
            var dataUnravel = data.data();
            this.userName = dataUnravel.name;
            this.userBio = dataUnravel.bio;
            if (dataUnravel.profilepic.startsWith('h')) {
                this.img = dataUnravel.profilepic;
            } else {
                this.storage.storage.refFromURL(dataUnravel.profilepic).getDownloadURL().then(url => {
                    this.img = url;
                });
            }
        });
    }

    ngOnInit() {
    }

}
