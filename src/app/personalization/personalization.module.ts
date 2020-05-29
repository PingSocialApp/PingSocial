import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PersonalizationPageRoutingModule } from './personalization-routing.module';

import { PersonalizationPage } from './personalization.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PersonalizationPageRoutingModule
  ],
  declarations: [PersonalizationPage]
})
export class PersonalizationPageModule {}
