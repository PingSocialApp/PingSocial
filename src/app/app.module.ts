import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouteReuseStrategy} from '@angular/router';
import {IonicModule, IonicRouteStrategy} from '@ionic/angular';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {AngularFireModule} from '@angular/fire';
import {environment} from '../environments/environment';
import {AngularFirestore} from '@angular/fire/firestore';
import {FCM} from '@ionic-native/fcm/ngx';
import {ORIGIN as FUNCTIONS_ORIGIN} from '@angular/fire/functions';
import { URL as DATABASE_URL } from '@angular/fire/database';
import { SETTINGS as FIRESTORE_SETTINGS } from '@angular/fire/firestore';
// import {AngularFireAnalyticsModule, ScreenTrackingService, UserTrackingService} from '@angular/fire/analytics';

@NgModule({
    declarations: [AppComponent],
    entryComponents: [],
    imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule
        , AngularFireModule.initializeApp(environment.firebase)],
    providers: [
        StatusBar,
        SplashScreen,
        AngularFirestore,
        // ScreenTrackingService,
        // UserTrackingService,
        FCM,
        {provide: RouteReuseStrategy, useClass: IonicRouteStrategy,
        },
        // TODO Remove in production
        {
            provide: FIRESTORE_SETTINGS,
            useValue: environment.production ? undefined : {
                host: 'localhost:8080',
                ssl: false
            }
        },
        {
            provide: FUNCTIONS_ORIGIN,
            useValue: environment.production ? undefined : {
                host: 'localhost:5001',
            }
        },
        {
            provide: DATABASE_URL,
            useValue: !environment.production ? `http://localhost:9000?ns=${environment.firebase.projectId}` : undefined
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {
}
