import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LinkSelectorPageRoutingModule } from './link-selector-routing.module';
import { LinkSelectorPage } from './link-selector.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LinkSelectorPageRoutingModule
  ],
  declarations: [LinkSelectorPage]
})
export class LinkSelectorPageModule {}
