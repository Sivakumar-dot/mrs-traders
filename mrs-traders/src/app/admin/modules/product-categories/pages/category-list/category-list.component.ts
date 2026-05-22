import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';

import { ProductCategory } from '../../models/product-category.model';
import { ProductCategoryService } from '../../services/product-category.service';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './category-list.component.html'
})
export class CategoryListComponent {
  private readonly categoryService = inject(ProductCategoryService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly categories = signal<ProductCategory[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isDeleting = signal<string | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly totalRecords = signal(0);
  protected readonly totalPages = signal(0);

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadCategories();
      });

    this.loadCategories();
  }

  protected loadCategories(): void {
    this.errorMessage.set('');
    this.isLoading.set(true);

    this.categoryService
      .getCategories(this.currentPage(), this.pageSize(), this.searchControl.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          this.categories.set(response.data ?? []);
          this.totalRecords.set(response.pagination?.totalRecords ?? 0);
          this.totalPages.set(response.pagination?.totalPages ?? 0);
          this.currentPage.set(response.pagination?.page ?? 1);
        },
        error: (error: HttpErrorResponse) => {
          this.categories.set([]);
          this.errorMessage.set(error.error?.message ?? 'Unable to load product categories.');
        }
      });
  }

  protected goToCreateCategory(): void {
    void this.router.navigate(['/admin/product-categories/new']);
  }

  protected goToEditCategory(categoryId: string): void {
    void this.router.navigate(['/admin/product-categories', categoryId, 'edit']);
  }

  protected deleteCategory(category: ProductCategory): void {
    const confirmed = window.confirm(`Delete category "${category.categoryName}"?`);

    if (!confirmed) {
      return;
    }

    this.isDeleting.set(category._id);
    this.errorMessage.set('');

    this.categoryService
      .deleteCategory(category._id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isDeleting.set(null))
      )
      .subscribe({
        next: () => {
          const shouldGoBackPage =
            this.categories().length === 1 && this.currentPage() > 1 && this.totalRecords() > 1;

          if (shouldGoBackPage) {
            this.currentPage.update((page) => page - 1);
          }

          this.loadCategories();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'Unable to delete product category.');
        }
      });
  }

  protected changePage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) {
      return;
    }

    this.currentPage.set(page);
    this.loadCategories();
  }

  protected trackByCategoryId(_: number, category: ProductCategory): string {
    return category._id;
  }
}
