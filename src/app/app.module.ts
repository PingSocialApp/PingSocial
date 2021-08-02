import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouteReuseStrategy} from '@angular/router';
import {IonicModule, IonicRouteStrategy} from '@ionic/angular';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {AngularFireModule} from '@angular/fire';
import {environment} from '../environments/environment';
import {AngularFirestore} from '@angular/fire/firestore';
import {HttpClientModule, HTTP_INTERCEPTORS} from '@angular/common/http';
import { AngularFireStorage } from '@angular/fire/storage';
import { AuthHandler } from './services/authHandler.service';
import { AngularFireDatabase } from '@angular/fire/database';

@NgModule({
    declarations: [AppComponent],
    entryComponents: [],
    imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, 
        HttpClientModule, AngularFireModule.initializeApp(environment.firebase)], 
        
    providers: [
        AngularFirestore,
        AngularFireStorage,
        AngularFireDatabase,
        AuthHandler,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthHandler,
            multi: true
        },
        {provide: RouteReuseStrategy, useClass: IonicRouteStrategy,
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {
}
