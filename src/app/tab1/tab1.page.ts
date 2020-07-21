import {Component} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireStorage} from '@angular/fire/storage';
import {RequestsProgramService} from '../requests-program.service';
import { AngularFireFunctions } from '@angular/fire/functions';

@Component({
    selector: 'app-tab1',
    templateUrl: 'tab1.page.html',
    styleUrls: ['tab1.page.scss'],
    providers: [AngularFirestore, AngularFireStorage]
})
export class Tab1Page {
    suggestions: Array<any>;

    constructor(private fns: AngularFireFunctions,public rs: RequestsProgramService, private firestore: AngularFirestore,
                private storage: AngularFireStorage) {
            this.suggestions = [];
            this.runSuggestions();
    }

    renderSuggestions(val: Array<any>) {
        this.suggestions = [];
        val.forEach(info => {
            this.firestore.collection('users').doc(info.id).get().subscribe(userDoc => {
                const suggestionObject = {
                    id: userDoc.id,
                    name: userDoc.get('name'),
                    bio: userDoc.get('bio'),
                    img: '',
                    percentage: info.percentage
                };
                if (userDoc.get('profilepic').startsWith('h')) {
                    suggestionObject.img = userDoc.get('profilepic');
                } else {
                    this.storage.storage.refFromURL(userDoc.get('profilepic')).getDownloadURL().then(url => {
                        suggestionObject.img = url;
                    });
                }
                this.suggestions.push(suggestionObject);
            });
        });
    }

    runSuggestions(){
        const algoFun = this.fns.httpsCallable('suggestionsAlgorithm');
        algoFun({variable: null}).subscribe(userIdArray => {
            // Array of uid's and percentages
            this.renderSuggestions(userIdArray);
        });
    }

    doRefresh(event) {
        this.runSuggestions();
        event.target.complete();
    }
}
