import { Component } from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import { Storage } from '@ionic/storage';
import {Observable} from 'rxjs';
import {Router} from '@angular/router';


@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  providers: [AngularFireAuth]
})
export class TabsPage {
  requestAmount: number;
  currentUserRef: AngularFirestoreDocument;

  constructor(private auth: AngularFireAuth, private db: AngularFirestore, private storage: Storage, private router: Router) {
    // this.auth.authState.subscribe(this.firebaseAuthChangeListener);
    this.auth.auth.onAuthStateChanged((user) => {
      if(user){
        this.currentUserRef = this.db.collection('users').doc(user.uid);
        this.db.collection('links', ref => ref.where('userRec', '==', this.currentUserRef.ref)
            .where('pendingRequest', '==', true)).snapshotChanges().subscribe(res => {
          this.requestAmount = res.length;
        });
      }else{
        this.router.navigate(['/']);
      }
    });
  }

  // private firebaseAuthChangeListener(response) {
  //   // if needed, do a redirect in here
  //   if (response) {
  //     console.log('Logged in :)');
  //   } else {
  //     console.log('Logged out :(');
  //     this.router.navigate(['/']);
  //   }
  // }

}
