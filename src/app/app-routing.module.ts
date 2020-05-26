import {NgModule} from '@angular/core';
import {PreloadAllModules, RouterModule, Routes} from '@angular/router';
import {AngularFireAuthGuard, redirectUnauthorizedTo, redirectLoggedInTo} from '@angular/fire/auth-guard';
import {AngularFireAuth} from '@angular/fire/auth';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']);
const redirectLoggedInToMain = () => redirectLoggedInTo(['']);

const routes: Routes = [
    {
        path: '',
        canActivate: [AngularFireAuthGuard], data: {authGuardPipe: redirectUnauthorizedToLogin},
        loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
    },
    {
        path: 'login',
        canActivate: [AngularFireAuthGuard], data: {authGuardPipe: redirectLoggedInToMain},
        loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule)
    },
    {
        path: 'settings',
        canActivate: [AngularFireAuthGuard], data: {authGuardPipe: redirectUnauthorizedToLogin},
        loadChildren: () => import('./settings/settings.module').then(m => m.SettingsPageModule)
    },
    {
        path: 'userprofile/:id',
        canActivate: [AngularFireAuthGuard], data: {authGuardPipe: redirectUnauthorizedToLogin},
        loadChildren: () => import('./userprofile/userprofile.module').then(m => m.UserprofilePageModule)
    },
    {
        path: 'circledash',
        canActivate: [AngularFireAuthGuard], data: {authGuardPipe: redirectUnauthorizedToLogin},
        loadChildren: () => import('./circledash/circledash.module').then(m => m.CircledashPageModule)
    },
    {
        path: 'requests',
        canActivate: [AngularFireAuthGuard], data: {authGuardPipe: redirectUnauthorizedToLogin},
        loadChildren: () => import('./requests/requests.module').then(m => m.RequestsPageModule)
    },
  {
    path: 'eventcreator',
    loadChildren: () => import('./tab2/eventcreator/eventcreator.module').then( m => m.EventcreatorPageModule)
  }
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, {preloadingStrategy: PreloadAllModules})
    ],
    providers: [AngularFireAuthGuard, AngularFireAuth],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
