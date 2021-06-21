import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {IonicModule} from '@ionic/angular';

import {NewPingPageRoutingModule} from './new-ping-routing.module';

import {NewPingPage} from './new-ping.page';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        NewPingPageRoutingModule
    ],
    // declarations: [NewPingPage]
})
export class NewPingPageModule {
}
