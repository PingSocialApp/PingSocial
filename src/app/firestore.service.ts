import {Injectable} from '@angular/core';
import {AngularFirestoreDocument, AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {BehaviorSubject} from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class FirestoreService {
    currentUserRef: AngularFirestoreDocument;
    currentUserId: string;
    userData: BehaviorSubject<any> = new BehaviorSubject(null);

    constructor(private firestore: AngularFirestore, private auth: AngularFireAuth) {
        this.currentUserRef = this.firestore.collection('users').doc(this.auth.auth.currentUser.uid);
        this.currentUserId = this.auth.auth.currentUser.uid;
        this.currentUserRef.snapshotChanges().subscribe(data => {
           this.userData.next(data);
        });
    }
}
