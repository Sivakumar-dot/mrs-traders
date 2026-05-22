import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-view',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './product-view.component.html'
})
export class ProductViewComponent {
  private readonly productService = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly productId = this.route.snapshot.paramMap.get('id');

  protected readonly product = signal<Product | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');

  constructor() {
    if (!this.productId) {
      this.errorMessage.set('Invalid product id.');
      this.isLoading.set(false);
      return;
    }

    this.productService
      .getProductById(this.productId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => this.product.set(response.data),
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'Unable to load product details.');
        }
      });
  }
}
