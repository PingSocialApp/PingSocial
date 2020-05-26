import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EventcreatorPage } from './eventcreator.page';

const routes: Routes = [
  {
    path: '',
    component: EventcreatorPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EventcreatorPageRoutingModule {}
