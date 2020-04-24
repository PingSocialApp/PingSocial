import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: '',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'settings',
    loadChildren: () => import('./settings/settings.module').then( m => m.SettingsPageModule)
  },
  {
    path: 'userprofile/:id',
    loadChildren: () => import('./userprofile/userprofile.module').then( m => m.UserprofilePageModule)
  },
  {
    path: 'circledash',
    loadChildren: () => import('./circledash/circledash.module').then( m => m.CircledashPageModule)
  },
  {
    path: 'requests',
    loadChildren: () => import('./requests/requests.module').then(m => m.RequestsPageModule)
  }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
