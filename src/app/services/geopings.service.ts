import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { retry } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GeopingsService {

  constructor(private http: HttpClient) { }

  createGeoPing(body: object){
    return this.http.post(environment.apiURL.geoPing, body).pipe(retry(3));
  }

  deleteGeoPing(id: string){
    return this.http.delete(environment.apiURL.geoPing).pipe(retry(3));
  }

  shareGeoPing(id: string, uid: string[]){
    return this.http.post(environment.apiURL.geoPing + id, {ids: uid}).pipe(retry(3))
  }
}
