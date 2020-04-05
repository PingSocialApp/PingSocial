import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CircledashPageRoutingModule } from './circledash-routing.module';

import { CircledashPage } from './circledash.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CircledashPageRoutingModule
  ],
  declarations: [CircledashPage]
})
export class CircledashPageModule {}
