import {IonicModule} from '@ionic/angular';
import {RouterModule} from '@angular/router';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Tab2Page} from './tab2.page';
import {MarkercreatorPage} from './markercreator/markercreator.page';
import {QrcodePage} from './qrcode/qrcode.page';
import {PhysicalmapComponent} from './physicalmap/physicalmap.component';
import {EventcreatorComponent} from './markercreator/eventcreator/eventcreator.component';
import {GeoPingComponent} from './markercreator/geo-ping/geo-ping.component';

@NgModule({
    imports: [
        IonicModule,
        CommonModule,
        FormsModule,
        RouterModule.forChild([{path: '', component: Tab2Page}]),
    ],
    declarations: [Tab2Page, MarkercreatorPage, QrcodePage, PhysicalmapComponent, EventcreatorComponent],
    entryComponents: [MarkercreatorPage, QrcodePage],
})
export class Tab2PageModule {
}
