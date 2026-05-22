import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ProductCategoryPayload } from '../../models/product-category.model';
import { ProductCategoryService } from '../../services/product-category.service';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './category-form.component.html'
})
export class CategoryFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly categoryService = inject(ProductCategoryService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly categoryId = this.route.snapshot.paramMap.get('id');

  protected readonly isEditMode = computed(() => !!this.categoryId);
  protected readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Edit Product Category' : 'Create Product Category'
  );
  protected readonly submitLabel = computed(() =>
    this.isEditMode() ? 'Update Category' : 'Save Category'
  );
  protected readonly isLoading = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  protected readonly categoryForm = this.fb.nonNullable.group({
    categoryName: ['', Validators.required],
    description: [''],
    isActive: true
  });

  constructor() {
    if (this.isEditMode() && this.categoryId) {
      this.loadCategory(this.categoryId);
    } else {
      this.isLoading.set(false);
    }
  }

  protected saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.isSubmitting.set(true);

    const payload = this.buildPayload();
    const request =
      this.isEditMode() && this.categoryId
        ? this.categoryService.updateCategory(this.categoryId, payload)
        : this.categoryService.createCategory(payload);

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
                ? 'Product category updated successfully.'
                : 'Product category created successfully.')
          );
          void this.router.navigate(['/admin/product-categories']);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'Unable to save product category.');
        }
      });
  }

  protected cancel(): void {
    void this.router.navigate(['/admin/product-categories']);
  }

  protected hasError(controlName: keyof ProductCategoryPayload): boolean {
    const control = this.categoryForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  private loadCategory(categoryId: string): void {
    this.categoryService
      .getCategoryById(categoryId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          this.categoryForm.patchValue({
            categoryName: response.data.categoryName,
            description: response.data.description,
            isActive: response.data.isActive
          });
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'Unable to load product category.');
        }
      });
  }

  private buildPayload(): ProductCategoryPayload {
    const formValue = this.categoryForm.getRawValue();

    return {
      categoryName: formValue.categoryName.trim(),
      description: formValue.description.trim(),
      isActive: formValue.isActive
    };
  }
}
