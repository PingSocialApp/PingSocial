import {IonicModule} from '@ionic/angular';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TabsPageRoutingModule} from './tabs-routing.module';
import {TabsPage} from './tabs.page';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {RouterModule} from '@angular/router';
import {RatingPage} from '../rating/rating.page';
import { AngularFireDatabase, AngularFireDatabaseModule } from '@angular/fire/database';

@NgModule({
    imports: [
        IonicModule,
        CommonModule,
        FormsModule,
        TabsPageRoutingModule,
        RouterModule,
        AngularFireAuthModule,
        AngularFireDatabaseModule
    ],
    declarations: [TabsPage, RatingPage],
})
export class TabsPageModule {
}
