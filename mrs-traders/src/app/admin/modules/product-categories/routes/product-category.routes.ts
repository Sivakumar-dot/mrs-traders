import { Routes } from '@angular/router';

export const productCategoryRoutes: Routes = [
  {
    path: 'product-categories',
    loadComponent: () =>
      import('../pages/category-list/category-list.component').then((m) => m.CategoryListComponent)
  },
  {
    path: 'product-categories/new',
    loadComponent: () =>
      import('../pages/category-form/category-form.component').then((m) => m.CategoryFormComponent)
  },
  {
    path: 'product-categories/:id/edit',
    loadComponent: () =>
      import('../pages/category-form/category-form.component').then((m) => m.CategoryFormComponent)
  }
];
