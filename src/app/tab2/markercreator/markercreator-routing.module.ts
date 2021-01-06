import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {MarkercreatorPage} from './markercreator.page';

const routes: Routes = [
    {
        path: '',
        component: MarkercreatorPage
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class MarkercreatorPageRoutingModule {
}
