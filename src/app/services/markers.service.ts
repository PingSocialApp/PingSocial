import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { catchError, retry, share } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})

export class MarkersService {

  constructor(private http: HttpClient) { }

  getRelevantEvents(latitude: number, longitude: number, radius:number) {
    let params = new HttpParams();
        params = params.set('latitude', latitude.toString());
        params = params.set('longitude', longitude.toString());
        params = params.set('radius', radius.toString());

    return this.http.get(environment.apiURL.markers + 'events', {params}
        ).pipe(retry(3), catchError(error => {
          console.error(error);
          return of(
            {
              data: {
                  type: 'FeatureCollection',
                  features: []
              }
            });
        }));
  }

  getRelevantGeoPings(latitude: number, longitude: number, radius:number) {
    let params = new HttpParams();
        params = params.set('latitude', latitude.toString());
        params = params.set('longitude', longitude.toString());
        params = params.set('radius', radius.toString());

    return this.http.get(environment.apiURL.markers + 'geopings',{params}
    ).pipe(retry(3), catchError(error => {
      console.error(error);
      return of(
        {
          data: {
              type: 'FeatureCollection',
              features: []
          }
        });
    }));
  }

  getLinks(latitude: number, longitude: number, radius:number) {
    let params = new HttpParams();
        params = params.set('latitude', latitude.toString());
        params = params.set('longitude', longitude.toString());
        params = params.set('radius', radius.toString());

    return this.http.get(environment.apiURL.markers + 'links',{params}
        ).pipe(retry(3), catchError(error => {
          console.error(error);
          return of(
            {
              data: {
                  type: 'FeatureCollection',
                  features: []
              }
            });
        }));
  }
}
