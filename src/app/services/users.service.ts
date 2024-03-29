import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireStorage} from '@angular/fire/storage';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {concatMap, first, retry, tap} from 'rxjs/operators';
import { UtilsService } from './utils.service';
import { AuthHandler } from './authHandler.service';
import { from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  fileName: string;
  latestPhoto: string | ArrayBuffer;
  myObj: any;
  latestLocation: Array<number>

  constructor(private http: HttpClient, private auth: AuthHandler, private firestore: AngularFirestore,
    private storage: AngularFireStorage, private utils: UtilsService) {
      this.myObj = null;
      this.latestLocation = [0,0];
  }

  handleFile(files: FileList) {
    const file = files.item(0);

    const filesize = ((file.size/1024)/1024); // MB

    if(filesize > 3.0){
      this.utils.presentToast('Whoops! Profile picture bigger than 3MB', 'warning');
      return;
    }

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

  getUserBasic(id:string) {
    return this.http.get(environment.apiURL.users + id).pipe(retry(3), first(), tap({
      next: (val:any) => {
        if(id === this.auth.getUID()){
          this.myObj = val.data;
        }
      }
    }));
  }

  getUserLocation() {
    return this.http.get(environment.apiURL.users + this.auth.getUID() + 'location',
      ).pipe(retry(3));
  }

  setUserLocation(locationObject){
    return this.http.put(environment.apiURL.users + 'location', locationObject,
      ).pipe(retry(3));
  }

  createUser(){
     const seed = Math.floor(Math.random() * Math.floor(10000));

      const userObject = {
          name: 'User' + seed,
          bio: 'New to Ping!',
          checkedIn: '',
          profilepic: 'https://picsum.photos/seed/' + seed + '/300'
      };

      return this.http.post(environment.apiURL.users, userObject).pipe(retry(3));
  }

  setNotifToken(notifToken: string){
    return this.http.put(environment.apiURL.users + 'notification', {notifToken}).pipe(retry(3));
  }

  updateProfile() {
      const uid = this.auth.getUID();

        const userObject = {
            name: (document.getElementById('username') as HTMLInputElement).value,
            bio: (document.getElementById('bio') as HTMLInputElement).value,
            profilepic: '',
        };

        this.firestore.collection('socials').doc(uid).set({
            facebook: (document.getElementById('fb') as HTMLInputElement).value,
            instagram: (document.getElementById('ig') as HTMLInputElement).value,
            twitter: (document.getElementById('tw') as HTMLInputElement).value,
            personalEmail: (document.getElementById('peem') as HTMLInputElement).value,
            linkedin: (document.getElementById('li') as HTMLInputElement).value,
            professionalEmail: (document.getElementById('prem') as HTMLInputElement).value,
            snapchat: (document.getElementById('sc') as HTMLInputElement).value,
            tiktok: (document.getElementById('tt') as HTMLInputElement).value,
            venmo: (document.getElementById('ve') as HTMLInputElement).value,
            website: (document.getElementById('ws') as HTMLInputElement).value,
            phone: (document.getElementById('ph') as HTMLInputElement).value,
        }).catch(e => console.error(e));

        const ref = this.storage.ref(uid);

        if (this.fileName != null && typeof this.latestPhoto === 'string') {
            ref.putString(this.latestPhoto, 'data_url').then(snapshot => {
            }).catch((er) => {
              this.utils.presentToast('Whoops! Profile pic had a problem', 'error');
              console.error(er);
            })
             // TODO only send profilepic on new update
            return from(this.storage.storage.refFromURL('gs://circles-4d081.appspot.com/' + uid).getDownloadURL()).pipe(concatMap(val => {
              // @ts-ignore
              userObject.profilepic = val;
              return this.http.put(environment.apiURL.users, userObject
                ).pipe(retry(3));
            }));
        }else{
          return this.http.put(environment.apiURL.users, userObject
            ).pipe(retry(3));
        }
    }
}
