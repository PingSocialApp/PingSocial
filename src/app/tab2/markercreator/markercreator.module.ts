import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {MarkercreatorPageRoutingModule} from './markercreator-routing.module';
import {LinkSelectorPage} from './link-selector/link-selector.page';
import {LinkSelectorPageModule} from './link-selector/link-selector.module';
// import {MarkercreatorPage} from './markercreator.page';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        MarkercreatorPageRoutingModule,
        LinkSelectorPageModule
    ],
    entryComponents: [LinkSelectorPage]
    // declarations: [MarkercreatorPage]
})
export class MarkercreatorPageModule {
}
