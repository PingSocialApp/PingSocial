import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {CircledashPageRoutingModule} from './circledash-routing.module';
import {CircledashPage} from './circledash.page';
import {ReplypopoverComponent} from './replypopover/replypopover.component';
import {NewPingPage} from './new-ping/new-ping.page';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        CircledashPageRoutingModule,
    ],
    declarations: [CircledashPage, ReplypopoverComponent, NewPingPage],
    entryComponents: [ReplypopoverComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CircledashPageModule {
}
