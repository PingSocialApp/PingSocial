import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http'
import { environment } from 'src/environments/environment';
import {catchError, retry, scan, share } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LinksService {

  constructor(private http: HttpClient) { }

  getAllLinks(offset:number, limit?:number){
    if(!limit){
      limit = 50;
    }
    let params = new HttpParams();
    params = params.set('limit', limit.toString());
    params = params.set('offset', offset.toString());
    return this.http.get(environment.apiURL.links,{
        params
    }).pipe(retry(3), catchError(err => {
      console.error(err);
      return of({data: []});
  }),share(), scan((all:any,current:any) => {
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

  getToSocials(id: string){
    return this.http.get(environment.apiURL.links + 'tosocials/' + id).pipe(retry(3));
  }

  getFromSocials(id: string){
    return this.http.get(environment.apiURL.links + 'fromsocials/' + id).pipe(retry(3));
  }

  updatePermissions(permissions: boolean[], id: string){
    let code = 0;
    for(let i = 0; i < permissions.length; i++){
        // tslint:disable-next-line:no-bitwise
        code |= +!!permissions[i] << (permissions.length-i-1);
    }

    return this.http.patch(environment.apiURL.links + 'tosocials/' + id, {
      permissions: code
    }).pipe(retry(3));
  }

  getLastCheckedInLocations(offset: number, limit?:number){
    if(!limit){
      limit = 50;
    }
    let params = new HttpParams();
    params = params.set('limit', limit.toString());
    params = params.set('offset', offset.toString());
    return this.http.get(environment.apiURL.links + 'location',{
        params
    }).pipe(retry(3), catchError(err => {
      console.error(err);
      return of({data: []});
  }),share(), scan((all:any,current:any) => {
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
}
