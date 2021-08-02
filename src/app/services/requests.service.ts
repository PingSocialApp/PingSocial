import {Injectable} from '@angular/core';
import {first, retry, scan, share} from 'rxjs/operators';
import {HttpClient, HttpParams} from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AngularFireDatabase } from '@angular/fire/database';
import { AuthHandler } from './authHandler.service';

@Injectable({
    providedIn: 'root',
})
export class RequestsService {;

    constructor(private http: HttpClient, private db: AngularFireDatabase, private auth: AuthHandler) {
    }

    sendRequest(userId: string, optionsData: number) {
        const body = {
            permissions: optionsData,
            userRec: {
                uid: userId
            }
        }
        return this.http.post(environment.apiURL.requests, body,
            ).pipe(retry(3));
    }

    cancelRequest(rid: string){
        return this.http.delete(environment.apiURL.requests + rid + '/decline',
            ).pipe(retry(3));
    }

    deleteRequest(rid: string){
        return this.http.delete(environment.apiURL.requests + rid + '/delete',
            ).pipe(retry(3));
    }

    getPendingRequests(offset:number, limit?:number) {
        if(!limit){
            limit = 50;
        }
        let params = new HttpParams();
        params = params.set('limit', limit.toString());
        params = params.set('offset', offset.toString());
        return this.http.get(environment.apiURL.requests + 'pending',{
            params
        }).pipe(retry(3), share(), scan((all:any,current:any) => {
            if(offset === 0){
              all = {
                isDone: false,
                data: [],
              };
          }
          if(current.data.length < limit){
            all.isDone = true;
          }
      
          all.data = [...all.data,...current.data];
      
          return all;
          }, {isDone: false, data: []}));
    }

    getSentRequests(offset:number, limit?:number) {
        if(!limit){
            limit = 50;
        }
        let params = new HttpParams();
        params = params.set('limit', limit.toString());
        params = params.set('offset', offset.toString());
        return this.http.get(environment.apiURL.requests + 'sent',{
            params
        }).pipe(retry(3), share(), scan((all:any,current:any) => {
            if(offset === 0){
              all = {
                isDone: false,
                data: [],
              };
          }
          if(current.data.length < limit){
            all.isDone = true;
          }
      
          all.data = [...all.data,...current.data];
      
          return all;
          }, {isDone: false, data: []}));
    }

    acceptRequest(id: string) {
        return this.http.patch(environment.apiURL.requests + id, {}).pipe(retry(3), first())
    }

    getTotalNumRequests(){
        return this.db.object('userNumerics/pendingRequests/' + this.auth.getUID())
            .valueChanges();
    }
}
