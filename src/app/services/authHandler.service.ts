import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import { environment } from 'src/environments/environment';
import { from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';


@Injectable({
    providedIn: 'root'
})
export class AuthHandler implements HttpInterceptor {
    uid:string

    constructor(private auth: AngularFireAuth) {
        this.initUID();
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>{
        if(req.url.includes(environment.apiURL.default)){
            return from(this.auth.idToken).pipe(switchMap(token => {
                if(token){
                    const authReq = req.clone({
                        setHeaders: {
                            'Content-Type': 'application/json',
                             Authorization: token,
                            'Access-Control-Allow-Headers': 'Authorization',
                        }
                    });
                    return next.handle(authReq);
                }
                return next.handle(req);
            }));
        }
        return next.handle(req);
    }

    initUID(){
        this.auth.user.subscribe(val => {
            this.uid = val.uid;
        });
    }

    getUID(){
        return this.uid;
    }
}
