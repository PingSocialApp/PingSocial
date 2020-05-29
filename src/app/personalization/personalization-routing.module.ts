import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PersonalizationPage } from './personalization.page';

const routes: Routes = [
  {
    path: '',
    component: PersonalizationPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PersonalizationPageRoutingModule {}
