import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tab2Page } from './tab2.page';
import {EventcreatorPage} from './eventcreator/eventcreator.page';
import {QrcodePage} from './qrcode/qrcode.page';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild([{path: '', component: Tab2Page}]),
  ],
  declarations: [Tab2Page, EventcreatorPage, QrcodePage],
  entryComponents: [EventcreatorPage, QrcodePage],
})
export class Tab2PageModule {}
