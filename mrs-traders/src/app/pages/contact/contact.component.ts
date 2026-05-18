import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { EnquiryPayload, EnquiryResponse, EnquiryService } from '../../core/services/enquiry.service';
import { businessHours, businessInfo } from '../../data/site-content';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html'
})
export class ContactComponent {
  @ViewChild('enquiryFormElement') private enquiryFormElement?: ElementRef<HTMLFormElement>;

  private readonly fb = inject(FormBuilder);
  private readonly enquiryService = inject(EnquiryService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly submitted = signal(false);

  protected readonly business = businessInfo;
  protected readonly businessHours = businessHours;
  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal('');
  protected readonly submitSuccess = signal('');
  protected readonly serviceOptions = [
    'Electrical Solutions',
    'Plumbing Essentials',
    'Modern Lighting'
  ];
  protected readonly enquiryForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    mobile: [
      '',
      [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]
    ],
    service: ['', [Validators.required]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
  });

  protected hasError(controlName: keyof EnquiryPayload): boolean {
    const control = this.enquiryForm.controls[controlName];
    return control.invalid && (control.touched || this.submitted());
  }

  protected getErrorMessage(controlName: keyof EnquiryPayload): string {
    const control = this.enquiryForm.controls[controlName];

    if (!this.hasError(controlName) || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return this.getRequiredMessage(controlName);
    }

    if (control.errors['minlength']) {
      return this.getMinLengthMessage(controlName);
    }

    if (control.errors['maxlength']) {
      return this.getMaxLengthMessage(controlName);
    }

    if (control.errors['pattern'] && controlName === 'mobile') {
      return 'Enter a valid 10-digit Indian mobile number.';
    }

    return 'Please check this field.';
  }

  protected getFieldClasses(controlName: keyof EnquiryPayload): string {
    return this.hasError(controlName)
      ? 'border-red-400 focus:border-red-400'
      : 'border-white/10 focus:border-[var(--color-accent)]';
  }

  protected sanitizeMobileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const numericValue = input.value.replace(/\D/g, '').slice(0, 10);

    if (numericValue !== input.value) {
      this.enquiryForm.controls.mobile.setValue(numericValue);
    }
  }

  protected submitEnquiry(): void {
    this.submitted.set(true);
    this.submitError.set('');
    this.submitSuccess.set('');

    if (this.enquiryForm.invalid || this.isSubmitting()) {
      this.enquiryForm.markAllAsTouched();
      this.focusFirstInvalidField();
      return;
    }

    this.isSubmitting.set(true);

    const payload: EnquiryPayload = {
      name: this.enquiryForm.controls.name.getRawValue().trim(),
      mobile: this.enquiryForm.controls.mobile.getRawValue().trim(),
      service: this.enquiryForm.controls.service.getRawValue().trim(),
      message: this.enquiryForm.controls.message.getRawValue().trim()
    };

    this.enquiryService
      .submitEnquiry(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: (response) => this.handleSuccess(response),
        error: (error) => {
          console.error('Enquiry submission failed:', error);
          this.submitError.set(
            error?.error?.message ||
              'Something went wrong while sending your enquiry. Please try again.'
          );
        }
      });
  }

  protected get messageLength(): number {
    return this.enquiryForm.controls.message.value.length;
  }

  private handleSuccess(response: EnquiryResponse): void {
    if (!response.success) {
      this.submitError.set(response.message || 'Unable to submit your enquiry right now.');
      return;
    }

    this.submitSuccess.set(response.message || 'Enquiry submitted successfully.');
    this.enquiryForm.reset({
      name: '',
      mobile: '',
      service: '',
      message: ''
    });
    this.enquiryForm.markAsPristine();
    this.enquiryForm.markAsUntouched();
    this.submitted.set(false);

    const whatsappUrl = response.data?.whatsappUrl;
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  }

  private getRequiredMessage(controlName: keyof EnquiryPayload): string {
    switch (controlName) {
      case 'name':
        return 'Name is required.';
      case 'mobile':
        return 'Mobile number is required.';
      case 'service':
        return 'Please select a service type.';
      case 'message':
        return 'Message is required.';
    }
  }

  private getMinLengthMessage(controlName: keyof EnquiryPayload): string {
    switch (controlName) {
      case 'name':
        return 'Name must be at least 3 characters.';
      case 'message':
        return 'Message must be at least 10 characters.';
      default:
        return 'This field is too short.';
    }
  }

  private getMaxLengthMessage(controlName: keyof EnquiryPayload): string {
    switch (controlName) {
      case 'name':
        return 'Name cannot exceed 50 characters.';
      case 'message':
        return 'Message cannot exceed 500 characters.';
      default:
        return 'This field is too long.';
    }
  }

  private focusFirstInvalidField(): void {
    queueMicrotask(() => {
      const invalidElement =
        this.enquiryFormElement?.nativeElement.querySelector<HTMLElement>(
          '[formControlName].ng-invalid'
        );
      invalidElement?.focus();
    });
  }
}
