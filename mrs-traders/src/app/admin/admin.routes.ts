import { Routes } from '@angular/router';

import { adminGuard } from './guards/admin.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'company-basic-details'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.AdminLoginComponent)
  },
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'company-basic-details'
      },
      {
        path: 'settings',
        pathMatch: 'full',
        redirectTo: 'company-basic-details'
      },
      {
        path: 'company-basic-details',
        loadComponent: () =>
          import('./pages/company-basic-details/company-basic-details.component').then(
            (m) => m.CompanyBasicDetailsComponent
          )
      },
      {
        path: 'gallery',
        loadComponent: () =>
          import('./pages/gallery/gallery.component').then((m) => m.AdminGalleryComponent)
      },
      {
        path: 'product-categories',
        loadComponent: () =>
          import('./pages/product-categories/product-categories.component').then(
            (m) => m.AdminProductCategoriesComponent
          )
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/products/admin-products.component').then((m) => m.AdminProductsComponent)
      }
    ]
  }
];
