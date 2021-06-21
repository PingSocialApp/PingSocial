import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http'
import { environment } from 'src/environments/environment';
import {retry, scan, share } from 'rxjs/operators';

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
    }).pipe(retry(3), share(), scan((all,current) => {
            if(offset === 0){
                all = [];
            }
            // @ts-ignore
            return all.concat(current.data);
    }, []));
  }

  getToSocials(id: string){
    return this.http.get(environment.apiURL.links + id + '/tosocials').pipe(retry(3));
  }

  getFromSocials(id: string){
    return this.http.get(environment.apiURL.links + id + '/fromsocials').pipe(retry(3));
  }

  updatePermissions(permissions: boolean[], id: string){
    let code = 0;
    for(let i = 0; i < permissions.length; i++){
        // tslint:disable-next-line:no-bitwise
        code |= +!!permissions[i] << (11-i);
    }

    return this.http.patch(environment.apiURL.links + id + '/tosocials', {
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
    }).pipe(retry(3), share(), scan((all,current) => {
            if(offset === 0){
                all = [];
            }
            // @ts-ignore
            return all.concat(current.data);
    }, []));
  }
}
