import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { retry, scan, share } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthHandler } from './authHandler.service';

@Injectable({
  providedIn: 'root'
})

export class MarkersService {

  constructor(private auth: AuthHandler, private http: HttpClient) { }

  getRelevantEvents(latitude: number, longitude: number, radius:number, reset?:boolean) {
    let params = new HttpParams();
        params = params.set('latitude', latitude.toString());
        params = params.set('longitude', longitude.toString());
        params = params.set('radius', radius.toString());

    return this.http.get(environment.apiURL.markers + 'events', {params}
        ).pipe(retry(3), share(), scan((all,current:any) => {
          if(reset){
              all = [];
          }
          // TODO Remove repeating markers
          // @ts-ignore
          return all.concat(current.data);
        }, []));
  }

  getRelevantGeoPings(latitude: number, longitude: number, radius:number, reset?:boolean) {
    let params = new HttpParams();
        params = params.set('latitude', latitude.toString());
        params = params.set('longitude', longitude.toString());
        params = params.set('radius', radius.toString());

    return this.http.get(environment.apiURL.markers + 'geopings',{params}
    ).pipe(retry(3), share(), scan((all,current) => {
      if(reset){
          all = [];
      }
      // TODO Remove repeating markers
      // @ts-ignore
      return all.concat(current.data);
    }, []));
  }

  getLinks(latitude: number, longitude: number, radius:number, reset?:boolean) {
    let params = new HttpParams();
        params = params.set('latitude', latitude.toString());
        params = params.set('longitude', longitude.toString());
        params = params.set('radius', radius.toString());

    return this.http.get(environment.apiURL.markers + 'links',{params}
        ).pipe(retry(3), share(), scan((all,current) => {
          if(reset){
              all = [];
          }
          // @ts-ignore
          return all.concat(current.data);
    }, []));
  }
}
