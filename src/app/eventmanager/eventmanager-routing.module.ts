import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EventmanagerPage } from './eventmanager.page';

const routes: Routes = [
  {
    path: '',
    component: EventmanagerPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EventmanagerPageRoutingModule {}
