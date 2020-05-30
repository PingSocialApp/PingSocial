import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CircledashPage } from './circledash.page';

const routes: Routes = [
  {
    path: '',
    component: CircledashPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CircledashPageRoutingModule {}
