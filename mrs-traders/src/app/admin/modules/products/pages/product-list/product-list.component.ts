import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';

import { ProductListItem } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-list.component.html'
})
export class ProductListComponent {
  private readonly productService = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly products = signal<ProductListItem[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isDeleting = signal<string | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly totalRecords = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly productImagePlaceholder =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 120'%3E%3Crect width='160' height='120' rx='18' fill='%23e2e8f0'/%3E%3Cpath d='M40 84l24-26 18 20 14-12 24 18H40z' fill='%2394a3b8'/%3E%3Ccircle cx='60' cy='42' r='10' fill='%23cbd5e1'/%3E%3C/svg%3E";

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadProducts();
      });

    this.loadProducts();
  }

  protected loadProducts(): void {
    this.errorMessage.set('');
    this.isLoading.set(true);

    this.productService
      .getProducts(this.currentPage(), this.pageSize(), this.searchControl.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          this.products.set(response.data ?? []);
          this.totalRecords.set(response.pagination?.totalRecords ?? 0);
          this.totalPages.set(response.pagination?.totalPages ?? 0);
          this.currentPage.set(response.pagination?.page ?? 1);
        },
        error: (error: HttpErrorResponse) => {
          this.products.set([]);
          this.errorMessage.set(error.error?.message ?? 'Unable to load products.');
        }
      });
  }

  protected goToCreateProduct(): void {
    void this.router.navigate(['/admin/products/new']);
  }

  protected goToEditProduct(productId: string): void {
    void this.router.navigate(['/admin/products', productId, 'edit']);
  }

  protected goToViewProduct(productId: string): void {
    void this.router.navigate(['/admin/products', productId]);
  }

  protected deleteProduct(product: ProductListItem): void {
    const confirmed = window.confirm(
      `Delete product "${product.productName}" (${product.productCode})?`
    );

    if (!confirmed) {
      return;
    }

    this.isDeleting.set(product._id);
    this.errorMessage.set('');

    this.productService
      .deleteProduct(product._id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isDeleting.set(null))
      )
      .subscribe({
        next: () => {
          const shouldGoBackPage =
            this.products().length === 1 && this.currentPage() > 1 && this.totalRecords() > 1;

          if (shouldGoBackPage) {
            this.currentPage.update((page) => page - 1);
          }

          this.loadProducts();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'Unable to delete product.');
        }
      });
  }

  protected changePage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) {
      return;
    }

    this.currentPage.set(page);
    this.loadProducts();
  }

  protected trackByProductId(_: number, product: ProductListItem): string {
    return product._id;
  }
}
