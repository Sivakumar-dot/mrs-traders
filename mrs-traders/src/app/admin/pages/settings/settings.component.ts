import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { CompanySettings } from '../../models/company-settings.model';
import { AuthService } from '../../services/auth.service';
import { CompanyService } from '../../services/company.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html'
})
export class AdminSettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly companyService = inject(CompanyService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly settingsForm = this.fb.nonNullable.group({
    companyName: ['', Validators.required],
    ownerName: ['', Validators.required],
    address: ['', Validators.required],
    mobileNumber: ['', Validators.required],
    whatsappNumber: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    googleMapUrl: ['', Validators.required],
    businessHours: ['', Validators.required]
  });

  constructor() {
    this.loadSettings();
  }

  protected saveSettings(): void {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.isSaving.set(true);

    this.companyService
      .updateCompanySettings(this.settingsForm.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe({
        next: (response) => {
          this.successMessage.set(response.message ?? 'Company settings updated successfully.');
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'Unable to update company settings.');
        }
      });
  }

  protected logout(): void {
    this.authService.logout();
    void this.router.navigate(['/admin/login']);
  }

  protected hasError(controlName: keyof CompanySettings): boolean {
    const control = this.settingsForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  private loadSettings(): void {
    this.companyService
      .getCompanySettings()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (settings) => {
          this.settingsForm.patchValue(settings);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'Unable to load company settings.');
        }
      });
  }
}
