import {IonicModule} from '@ionic/angular';
import {RouterModule} from '@angular/router';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Tab1Page} from './tab1.page';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {AngularFireFunctionsModule} from '@angular/fire/functions';

@NgModule({
    imports: [
        IonicModule,
        CommonModule,
        AngularFireAuthModule,
        AngularFireFunctionsModule,
        FormsModule,
        RouterModule.forChild([{path: '', component: Tab1Page}]),
    ],
    declarations: [Tab1Page]
})

export class Tab1PageModule {

}
