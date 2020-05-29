import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CircledashPageRoutingModule } from './circledash-routing.module';
import {AngularFirestoreModule} from '@angular/fire/firestore';
import {NewPingPage} from '../circledash/new-ping/new-ping.page';
import { CircledashPage } from './circledash.page';
import {ReplypopoverComponent} from './replypopover/replypopover.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CircledashPageRoutingModule,
    AngularFirestoreModule
  ],
  declarations: [CircledashPage, NewPingPage, ReplypopoverComponent],
  entryComponents: [NewPingPage, ReplypopoverComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CircledashPageModule {}
