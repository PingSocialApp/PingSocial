import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tab2Page } from './tab2.page';
import {SettingsPage} from '../settings/settings.page';
import {AngularFirestoreModule} from '@angular/fire/firestore';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    AngularFirestoreModule,
    RouterModule.forChild([{path: '', component: Tab2Page}]),
  ],
  declarations: [Tab2Page, SettingsPage],
  entryComponents: [SettingsPage],
})
export class Tab2PageModule {}
