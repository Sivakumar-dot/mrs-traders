import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';

import { ProductCategory } from '../../models/product-category.model';
import { ProductCategoryService } from '../../services/product-category.service';
import { ConfirmDialogComponent } from '../../../../components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfirmDialogComponent],
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
  protected readonly categoryPendingDelete = signal<ProductCategory | null>(null);

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
          const totalRecords = response.totalRecords ?? response.pagination?.totalRecords ?? 0;
          const currentPage = response.currentPage ?? response.pagination?.page ?? 1;
          const pageSize = response.pageSize ?? response.pagination?.limit ?? this.pageSize();
          const totalPages =
            response.pagination?.totalPages ??
            (pageSize > 0 ? Math.ceil(totalRecords / pageSize) : 0);

          this.categories.set(response.data ?? []);
          this.totalRecords.set(totalRecords);
          this.totalPages.set(totalPages);
          this.currentPage.set(currentPage);
          this.pageSize.set(pageSize);
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
    this.categoryPendingDelete.set(category);
  }

  protected closeDeleteDialog(): void {
    if (!this.isDeleting()) {
      this.categoryPendingDelete.set(null);
    }
  }

  protected confirmDeleteCategory(): void {
    const category = this.categoryPendingDelete();

    if (!category) {
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
          this.categoryPendingDelete.set(null);
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

  protected getDeleteCategoryMessage(category: ProductCategory): string {
    return `Are you sure you want to delete "${category.categoryName}"? This action cannot be undone.`;
  }

  protected trackByCategoryId(_: number, category: ProductCategory): string {
    return category._id;
  }
}
