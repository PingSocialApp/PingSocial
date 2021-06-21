import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { first, retry, scan, share } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EventsService {

  constructor(private http: HttpClient) { }

  getUserEvents(id: string, offset: number, limit?: number){
    if(!limit){
      limit = 50;
    }
    let params = new HttpParams();
    params = params.set('limit', limit.toString());
    params = params.set('offset', offset.toString());
    return this.http.get(environment.apiURL.events + '?userCreated=' + id,{
        params
    }).pipe(retry(3), share(), scan((all,current) => {
            if(offset === 0){
                all = [];
            }
            // @ts-ignore
            return all.concat(current.data);
    }, []));
  }

  createEvent(body: object){
    return this.http.post(environment.apiURL.events, body).pipe(retry(3), first());
  }

  editEvent(id: string, body: object){
    return this.http.put(environment.apiURL.events + id, body).pipe(retry(3));
  }

  getEventDetails(id: string){
    return this.http.get(environment.apiURL.events + id).pipe(retry(3), first());
  }

  getEventShares(id: string, offset: number, limit?: number){
    if(!limit){
      limit = 50;
    }
    let params = new HttpParams();
    params = params.set('limit', limit.toString());
    params = params.set('offset', offset.toString());
    return this.http.get(environment.apiURL.events + id + '/invites',{
        params
    }).pipe(retry(3), share(), scan((all,current) => {
            if(offset === 0){
                all = [];
            }
            // @ts-ignore
            return all.concat(current.data);
    }, []));
  }

  deleteEvent(id: string){
    return this.http.delete(environment.apiURL.events + id).pipe(retry(3), first());
  }

  inviteAttendee(id: string, uid: string[]){
    return this.http.post(environment.apiURL.events + id + '/invites', {uids: uid}).pipe(retry(3), first())
  }

  viewAttendees(id: string, offset: number, limit?: number){
    if(!limit){
      limit = 50;
    }
    let params = new HttpParams();
    params = params.set('limit', limit.toString());
    params = params.set('offset', offset.toString());
    return this.http.get(environment.apiURL.events + id + '/attendees',{
        params
    }).pipe(retry(3), share(), scan((all,current) => {
            if(offset === 0){
                all = [];
            }
            // @ts-ignore
            return all.concat(current.data);
    }, []));
  }

  checkin(id: string){
    return this.http.post(environment.apiURL.events + id + '/?action=checkin',{}).pipe(retry(3));
  }

  checkout(id: string, rating: number, review: string){
    return this.http.post(environment.apiURL.events + id + '/?action=checkout',{
      rating,
      review
    }).pipe(retry(3));
  }

  endEvent(id: string){
    return this.http.patch(environment.apiURL.events + id + '/end', {}).pipe(retry(3));
  }
}
