import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TabsPageRoutingModule } from './tabs-routing.module';

import { TabsPage } from './tabs.page';
import {AngularFireModule} from '@angular/fire';
import {environment} from '../../environments/environment';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {AngularFirestoreModule} from '@angular/fire/firestore';
import {IonicStorageModule} from '@ionic/storage';
import {RouterModule} from '@angular/router';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TabsPageRoutingModule,
      RouterModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
      IonicStorageModule.forRoot(),
      AngularFirestoreModule
  ],
  declarations: [TabsPage],
})
export class TabsPageModule {}
