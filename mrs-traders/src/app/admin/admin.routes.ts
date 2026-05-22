import { Routes } from '@angular/router';

import { adminGuard } from './guards/admin.guard';
import { productCategoryRoutes } from './modules/product-categories/routes/product-category.routes';

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
      ...productCategoryRoutes,
      {
        path: 'products',
        loadComponent: () =>
          import('./modules/products/pages/product-list/product-list.component').then(
            (m) => m.ProductListComponent
          )
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('./modules/products/pages/product-form/product-form.component').then(
            (m) => m.ProductFormComponent
          )
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./modules/products/pages/product-view/product-view.component').then(
            (m) => m.ProductViewComponent
          )
      },
      {
        path: 'products/:id/edit',
        loadComponent: () =>
          import('./modules/products/pages/product-form/product-form.component').then(
            (m) => m.ProductFormComponent
          )
      }
    ]
  }
];
