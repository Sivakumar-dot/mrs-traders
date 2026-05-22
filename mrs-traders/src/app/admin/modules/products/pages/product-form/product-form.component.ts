import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ProductCategoryOption } from '../../models/product-category.model';
import { ProductPayload } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

const IMAGE_MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './product-form.component.html'
})
export class ProductFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productId = this.route.snapshot.paramMap.get('id');

  protected readonly isEditMode = computed(() => !!this.productId);
  protected readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Edit Product' : 'Create Product'
  );
  protected readonly submitLabel = computed(() =>
    this.isEditMode() ? 'Update Product' : 'Save Product'
  );
  protected readonly isLoading = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly imageErrorMessage = signal('');
  protected readonly imagePreviewUrl = signal('');
  protected readonly categoryOptions = signal<ProductCategoryOption[]>([]);
  protected readonly productImagePlaceholder =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 220'%3E%3Crect width='320' height='220' rx='28' fill='%23e2e8f0'/%3E%3Cpath d='M72 154l46-48 32 34 26-22 56 36H72z' fill='%2394a3b8'/%3E%3Ccircle cx='120' cy='82' r='16' fill='%23cbd5e1'/%3E%3C/svg%3E";

  protected readonly productForm = this.fb.nonNullable.group({
    productCode: [''],
    productName: ['', Validators.required],
    categoryId: ['', Validators.required],
    brand: [''],
    description: [''],
    price: ['', [this.optionalPositiveNumberValidator()]],
    quantity: ['', [this.optionalNonNegativeNumberValidator()]],
    uom: [''],
    imageUrl: ['', Validators.required],
    isActive: true
  });

  constructor() {
    this.loadInitialData();
  }

  protected saveProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.isSubmitting.set(true);

    const payload = this.buildPayload();
    const request = this.isEditMode() && this.productId
      ? this.productService.updateProduct(this.productId, payload)
      : this.productService.createProduct(payload);

    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: (response) => {
          this.successMessage.set(
            response.message ??
              (this.isEditMode()
                ? 'Product updated successfully.'
                : 'Product created successfully.')
          );
          void this.router.navigate(['/admin/products']);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'Unable to save product.');
        }
      });
  }

  protected cancel(): void {
    void this.router.navigate(['/admin/products']);
  }

  protected hasError(controlName: keyof ProductPayload): boolean {
    const control = this.productForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (!file) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.imageErrorMessage.set('Only PNG, JPG, and WEBP images are allowed.');
      input.value = '';
      return;
    }

    if (file.size > IMAGE_MAX_FILE_SIZE) {
      this.imageErrorMessage.set('Image size must be 2 MB or smaller.');
      input.value = '';
      return;
    }

    this.imageErrorMessage.set('');
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      this.imagePreviewUrl.set(result);
      this.productForm.controls.imageUrl.setValue(result);
      this.productForm.controls.imageUrl.markAsDirty();
      this.productForm.controls.imageUrl.updateValueAndValidity();
    };
    reader.readAsDataURL(file);
  }

  private loadInitialData(): void {
    this.productService
      .getCategoryOptions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.categoryOptions.set(response.data ?? []);

          if (this.isEditMode() && this.productId) {
            this.loadProductForEdit(this.productId);
          } else {
            this.isLoading.set(false);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.error?.message ?? 'Unable to load product form.');
        }
      });
  }

  private loadProductForEdit(productId: string): void {
    this.isLoading.set(true);

    this.productService
      .getProductById(productId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          this.productForm.patchValue({
            productCode: response.data.productCode,
            productName: response.data.productName,
            categoryId: response.data.categoryId,
            brand: response.data.brand,
            description: response.data.description,
            price: response.data.price ? String(response.data.price) : '',
            quantity: response.data.quantity || response.data.quantity === 0
              ? String(response.data.quantity)
              : '',
            uom: response.data.uom,
            imageUrl: response.data.imageUrl,
            isActive: response.data.isActive
          });
          this.imagePreviewUrl.set(response.data.imageUrl);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'Unable to load product form.');
        }
      });
  }

  private buildPayload(): ProductPayload {
    const formValue = this.productForm.getRawValue();

    return {
      productCode: formValue.productCode.trim(),
      productName: formValue.productName.trim(),
      categoryId: formValue.categoryId,
      brand: formValue.brand.trim(),
      description: formValue.description.trim(),
      price: formValue.price === '' ? 0 : Number(formValue.price),
      quantity: formValue.quantity === '' ? 0 : Number(formValue.quantity),
      uom: formValue.uom.trim(),
      imageUrl: formValue.imageUrl,
      isActive: formValue.isActive
    };
  }

  private optionalPositiveNumberValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === '' || control.value === null) {
        return null;
      }

      const value = Number(control.value);
      return Number.isFinite(value) && value > 0 ? null : { invalidPositiveNumber: true };
    };
  }

  private optionalNonNegativeNumberValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === '' || control.value === null) {
        return null;
      }

      const value = Number(control.value);
      return Number.isFinite(value) && value >= 0 ? null : { invalidNonNegativeNumber: true };
    };
  }
}
