import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LinkSelectorPage } from './link-selector.page';

const routes: Routes = [
  {
    path: '',
    component: LinkSelectorPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LinkSelectorPageRoutingModule {}
