import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RequestsPageRoutingModule } from './requests-routing.module';

import { RequestsPage } from './requests.page';
import {AngularFirestoreModule} from '@angular/fire/firestore';
import {AngularFireStorageModule} from '@angular/fire/storage';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    AngularFirestoreModule,
    IonicModule,
      AngularFireStorageModule,
    RequestsPageRoutingModule
  ],
  declarations: [RequestsPage]
})
export class RequestsPageModule {}
