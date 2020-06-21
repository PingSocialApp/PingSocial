import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {EventcreatorPageRoutingModule} from './eventcreator-routing.module';
import {EventcreatorPage} from './eventcreator.page';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        EventcreatorPageRoutingModule
    ],
    // declarations: [EventcreatorPage]
})
export class EventcreatorPageModule {
}
