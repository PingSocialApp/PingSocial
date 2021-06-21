import {Injectable} from '@angular/core';
import {ToastController} from '@ionic/angular';
import {first, retry, scan, share} from 'rxjs/operators';
import { AuthHandler } from './authHandler.service';
import { UtilsService } from './utils.service';
import {HttpClient, HttpParams} from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class RequestsService {;

    constructor(private toastController: ToastController, private utils: UtilsService, private auth: AuthHandler,
        private http: HttpClient) {
    }

    sendRequest(userId: string, optionsData) {
        return this.http.post(environment.apiURL.requests + userId, {permissions: optionsData},
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
        }).pipe(retry(3), share(), scan((all,current) => {
                if(offset === 0){
                    all = [];
                }
                // @ts-ignore
                return all.concat(current.data);
        }, []));
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
        }).pipe(retry(3), share(), scan((all,current) => {
                if(offset === 0){
                    all = [];
                }
                // @ts-ignore
                return all.concat(current.data);
        }, []));
    }

    acceptRequest(id: string) {
        return this.http.patch(environment.apiURL.requests + id, {}).pipe(retry(3), first())
    }
}
