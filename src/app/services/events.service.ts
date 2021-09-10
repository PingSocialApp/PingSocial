import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, first, retry, scan, share, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  checkedInEvent: BehaviorSubject<string>;

  constructor(private http: HttpClient) {
    // TODO relay last value if late subscribe
    this.checkedInEvent = new BehaviorSubject<string>('');
  }

  getUserEvents(id: string, offset: number, limit?: number){
    if(!limit){
      limit = 50;
    }
    let params = new HttpParams();
    params = params.set('limit', limit.toString());
    params = params.set('offset', offset.toString());
    return this.http.get(environment.apiURL.events + '?action=created&userCreated=' + id,{
        params
    }).pipe(retry(3), catchError(err => {
        console.error(err);
        return of({data: []});
    }), share(), scan((all:any,current:any) => {
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

  getInvitedEvents(offset: number, limit?: number){
    if(!limit){
      limit = 50;
    }
    let params = new HttpParams();
    params = params.set('limit', limit.toString());
    params = params.set('offset', offset.toString());
    return this.http.get(environment.apiURL.events + '?action=invited',{
        params
    }).pipe(retry(3), catchError(err => {
        console.error(err);
        return of({data: []});
    }), share(), scan((all:any,current:any) => {
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

  createEvent(body: object){
    return this.http.post(environment.apiURL.events, body).pipe(retry(3));
  }

  editEvent(id: string, body: object){
    return this.http.put(environment.apiURL.events + id, body).pipe(retry(3));
  }

  getEventDetails(id: string){
    return this.http.get(environment.apiURL.events + id).pipe(retry(3));
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
    }).pipe(retry(3), catchError(err => {
      console.error(err);
        return of({data: []});
    }), share(), scan((all:any,current:any) => {
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

  deleteEvent(id: string){
    return this.http.delete(environment.apiURL.events + id).pipe(retry(3), first());
  }

  inviteAttendee(id: string, uid: string[], isNew: boolean){
    return this.http.post(environment.apiURL.events + id + '/invites', {uids: uid, isNew}).pipe(retry(3), first())
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

  checkin(id: string){
    return this.http.post(environment.apiURL.events + id + '?action=checkin',{}).pipe(retry(3));
  }

  checkout(id: string, rating: number, review: string){
    return this.http.post(environment.apiURL.events + id + '?action=checkout',{
      rating,
      review
    }).pipe(retry(3));
  }

  endEvent(id: string){
    return this.http.patch(environment.apiURL.events + id + '/end', {}).pipe(retry(3));
  }
}
