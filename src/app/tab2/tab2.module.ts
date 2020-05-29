import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tab2Page } from './tab2.page';
import {SettingsPage} from '../settings/settings.page';
import {EventcreatorPage} from './eventcreator/eventcreator.page';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild([{path: '', component: Tab2Page}]),
  ],
  declarations: [Tab2Page, EventcreatorPage, SettingsPage],
  entryComponents: [SettingsPage, EventcreatorPage],
})
export class Tab2PageModule {}
