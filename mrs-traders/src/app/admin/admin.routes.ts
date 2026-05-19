import { Routes } from '@angular/router';

import { adminGuard } from './guards/admin.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.AdminLoginComponent)
  },
  {
    path: 'settings',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/settings/settings.component').then((m) => m.AdminSettingsComponent)
  }
];
