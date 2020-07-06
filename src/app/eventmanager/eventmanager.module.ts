import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EventmanagerPageRoutingModule } from './eventmanager-routing.module';

import { EventmanagerPage } from './eventmanager.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EventmanagerPageRoutingModule
  ],
  declarations: [EventmanagerPage]
})
export class EventmanagerPageModule {}
