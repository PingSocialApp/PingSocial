import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {NewPingPage} from './new-ping.page';

const routes: Routes = [
    {
        path: '',
        component: NewPingPage
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class NewPingPageRoutingModule {
}
