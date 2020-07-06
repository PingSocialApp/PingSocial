import {IonicModule} from '@ionic/angular';
import {RouterModule} from '@angular/router';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Tab3Page} from './tab3.page';
import {SettingsPage} from '../settings/settings.page';
import {RequestsPage} from '../requests/requests.page';

@NgModule({
    imports: [
        IonicModule,
        CommonModule,
        FormsModule,
        RouterModule.forChild([{path: '', component: Tab3Page}])
    ],
    declarations: [Tab3Page, SettingsPage, RequestsPage],
    entryComponents: [SettingsPage, RequestsPage]
})
export class Tab3PageModule {
}
