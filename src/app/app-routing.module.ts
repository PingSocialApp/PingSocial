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
        path: 'registration',
        canActivate: [AngularFireAuthGuard], data: {authGuardPipe: redirectUnauthorizedToLogin},
        loadChildren: () => import('./login/registration/registration.module').then( m => m.RegistrationPageModule)
    },
    //NEELEY
    {
        path: 'tutorial',
        canActivate: [AngularFireAuthGuard], data: {authGuardPipe: redirectUnauthorizedToLogin},
        loadChildren: () => import('./login/registration/tutorial/tutorial.module').then( m => m.TutorialPageModule)
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
        path: 'markercreator',
        canActivate: [AngularFireAuthGuard], data: {authGuardPipe: redirectUnauthorizedToLogin},
        loadChildren: () => import('./tab2/markercreator/markercreator.module').then(m => m.MarkercreatorPageModule)
    },
    {
        path: 'qrcode',
        canActivate: [AngularFireAuthGuard], data: {authGuardPipe: redirectUnauthorizedToLogin},
        loadChildren: () => import('./tab2/qrcode/qrcode.module').then(m => m.QrcodePageModule)
    },
  {
    path: 'eventmanager/:id',
    canActivate: [AngularFireAuthGuard], data: {authGuardPipe: redirectUnauthorizedToLogin},
    loadChildren: () => import('./eventmanager/eventmanager.module').then( m => m.EventmanagerPageModule)
  },
  {
    path: 'rating',
    canActivate: [AngularFireAuthGuard],
    loadChildren: () => import('./rating/rating.module').then( m => m.RatingPageModule)
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
