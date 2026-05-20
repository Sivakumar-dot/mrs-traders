import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { CompanySettings } from '../../models/company-settings.model';
import { AuthService } from '../../services/auth.service';
import { CompanyService } from '../../services/company.service';

interface BusinessHoursDayConfig {
  label: string;
  aliases: string[];
}

type BusinessHoursRowForm = ReturnType<AdminSettingsComponent['createBusinessHoursRow']>;

const BUSINESS_HOURS_DAYS: BusinessHoursDayConfig[] = [
  { label: 'Monday', aliases: ['mon', 'monday'] },
  { label: 'Tuesday', aliases: ['tue', 'tues', 'tuesday'] },
  { label: 'Wednesday', aliases: ['wed', 'weds', 'wednesday'] },
  { label: 'Thursday', aliases: ['thu', 'thur', 'thurs', 'thursday'] },
  { label: 'Friday', aliases: ['fri', 'friday'] },
  { label: 'Saturday', aliases: ['sat', 'saturday'] },
  { label: 'Sunday', aliases: ['sun', 'sunday'] }
];

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
  private legacyBusinessHoursFallback: string | null = null;

  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly businessHoursDays = BUSINESS_HOURS_DAYS;
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
  protected readonly businessHoursForm = this.fb.array(
    BUSINESS_HOURS_DAYS.map(() => this.createBusinessHoursRow()),
    {
      validators: [this.requireAtLeastOneBusinessHoursDayEnabled()]
    }
  );

  constructor() {
    this.syncBusinessHoursText();
    this.loadSettings();
  }

  protected saveSettings(): void {
    const payload = this.buildSettingsPayload();

    if (!payload || this.settingsForm.invalid || this.businessHoursForm.invalid) {
      this.settingsForm.markAllAsTouched();
      this.businessHoursForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.isSaving.set(true);

    this.companyService
      .updateCompanySettings(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe({
        next: (response) => {
          this.parseExistingBusinessHours(payload.businessHours);
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

  protected businessHoursRows(): BusinessHoursRowForm[] {
    return this.businessHoursForm.controls;
  }

  protected hasBusinessHoursRowError(index: number): boolean {
    const row = this.businessHoursForm.at(index);
    return row.invalid && (row.touched || row.dirty);
  }

  protected getBusinessHoursRowMessage(index: number): string {
    const row = this.businessHoursForm.at(index);

    if (row.hasError('timeRangeRequired')) {
      return 'Select both open and close times for enabled days.';
    }

    if (row.hasError('invalidTimeRange')) {
      return 'Close time must be later than open time.';
    }

    return '';
  }

  protected onBusinessDayToggle(index: number): void {
    const row = this.businessHoursForm.at(index);
    const isEnabled = row.controls.enabled.value;

    if (isEnabled) {
      if (!row.controls.openTime.value) {
        row.controls.openTime.setValue('09:00');
      }

      if (!row.controls.closeTime.value) {
        row.controls.closeTime.setValue('20:00');
      }
    }

    row.updateValueAndValidity();
    this.updateBusinessHoursText();
  }

  protected generateBusinessHoursText(): string {
    return this.businessHoursForm.controls
      .map((row, index) => {
        const dayLabel = this.businessHoursDays[index].label;

        if (!row.controls.enabled.value) {
          return `${dayLabel}: Closed`;
        }

        return `${dayLabel}: ${row.controls.openTime.value} - ${row.controls.closeTime.value}`;
      })
      .join('\n');
  }

  protected parseExistingBusinessHours(businessHoursText: string | null | undefined): void {
    const normalizedText = businessHoursText?.trim() ?? '';

    this.businessHoursForm.clear({ emitEvent: false });
    BUSINESS_HOURS_DAYS.forEach(() =>
      this.businessHoursForm.push(this.createBusinessHoursRow(), { emitEvent: false })
    );

    if (!normalizedText) {
      this.legacyBusinessHoursFallback = null;
      this.updateBusinessHoursText();
      return;
    }

    const lines = normalizedText
      .split(/\r?\n|;/)
      .map((line) => line.trim())
      .filter((line) => !!line);
    let parsedLinesCount = 0;

    for (const line of lines) {
      if (this.applyBusinessHoursLine(line)) {
        parsedLinesCount += 1;
      }
    }

    this.legacyBusinessHoursFallback = parsedLinesCount === lines.length ? null : normalizedText;
    this.updateBusinessHoursText();
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
          this.parseExistingBusinessHours(settings.businessHours);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'Unable to load company settings.');
        }
      });
  }

  private createBusinessHoursRow() {
    return this.fb.nonNullable.group(
      {
        enabled: false,
        openTime: '',
        closeTime: ''
      },
      {
        validators: [this.businessHoursTimeRangeValidator()]
      }
    );
  }

  private syncBusinessHoursText(): void {
    this.businessHoursForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.legacyBusinessHoursFallback = null;
        this.updateBusinessHoursText();
      });
  }

  private buildSettingsPayload(): CompanySettings | null {
    this.updateBusinessHoursText();

    if (this.settingsForm.invalid || this.businessHoursForm.invalid) {
      return null;
    }

    return {
      ...this.settingsForm.getRawValue(),
      businessHours: this.settingsForm.controls.businessHours.getRawValue()
    };
  }

  private updateBusinessHoursText(): void {
    this.settingsForm.controls.businessHours.setValue(
      this.legacyBusinessHoursFallback ?? this.generateBusinessHoursText(),
      {
        emitEvent: false
      }
    );
    this.settingsForm.controls.businessHours.updateValueAndValidity({ emitEvent: false });
  }

  private businessHoursTimeRangeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const enabled = control.get('enabled')?.value as boolean | undefined;
      const openTime = control.get('openTime')?.value as string | undefined;
      const closeTime = control.get('closeTime')?.value as string | undefined;

      if (!enabled) {
        return null;
      }

      if (!openTime || !closeTime) {
        return { timeRangeRequired: true };
      }

      if (openTime >= closeTime) {
        return { invalidTimeRange: true };
      }

      return null;
    };
  }

  private requireAtLeastOneBusinessHoursDayEnabled(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const formArray = control as FormArray<BusinessHoursRowForm>;
      const hasEnabledDay = formArray.controls.some((row) => row.controls.enabled.value);
      return hasEnabledDay ? null : { noBusinessHoursDayEnabled: true };
    };
  }

  private applyBusinessHoursLine(line: string): boolean {
    const match = line.match(/^([A-Za-z]+(?:\s*-\s*[A-Za-z]+)?)(?:\s*:\s*|\s+)(.+)$/);

    if (!match) {
      return false;
    }

    const [, dayExpression, valueExpression] = match;
    const dayIndexes = this.resolveDayIndexes(dayExpression);

    if (!dayIndexes.length) {
      return false;
    }

    if (/^closed$/i.test(valueExpression.trim())) {
      dayIndexes.forEach((index) => this.patchBusinessHoursRow(index, false, '', ''));
      return true;
    }

    const timeMatch = valueExpression.match(/^(.+?)\s*-\s*(.+)$/);

    if (!timeMatch) {
      return false;
    }

    const openTime = this.normalizeTimeValue(timeMatch[1]);
    const closeTime = this.normalizeTimeValue(timeMatch[2]);

    if (!openTime || !closeTime) {
      return false;
    }

    dayIndexes.forEach((index) => this.patchBusinessHoursRow(index, true, openTime, closeTime));
    return true;
  }

  private patchBusinessHoursRow(
    index: number,
    enabled: boolean,
    openTime: string,
    closeTime: string
  ): void {
    this.businessHoursForm.at(index).patchValue(
      {
        enabled,
        openTime,
        closeTime
      },
      { emitEvent: false }
    );
  }

  private resolveDayIndexes(dayExpression: string): number[] {
    const normalizedExpression = dayExpression.trim().toLowerCase();

    if (normalizedExpression.includes('-')) {
      const [startDay, endDay] = normalizedExpression.split('-').map((part) => part.trim());
      const startIndex = this.findDayIndex(startDay);
      const endIndex = this.findDayIndex(endDay);

      if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
        return [];
      }

      return Array.from({ length: endIndex - startIndex + 1 }, (_, offset) => startIndex + offset);
    }

    const dayIndex = this.findDayIndex(normalizedExpression);
    return dayIndex === -1 ? [] : [dayIndex];
  }

  private findDayIndex(dayText: string): number {
    return this.businessHoursDays.findIndex((day) => day.aliases.includes(dayText.toLowerCase()));
  }

  private normalizeTimeValue(value: string): string | null {
    const trimmedValue = value.trim().toUpperCase();
    const twelveHourMatch = trimmedValue.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);

    if (twelveHourMatch) {
      const [, hoursText, minutesText = '00', meridiem] = twelveHourMatch;
      let hours = Number(hoursText);
      const minutes = Number(minutesText);

      if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes > 59 || hours < 1 || hours > 12) {
        return null;
      }

      if (meridiem === 'AM') {
        hours = hours === 12 ? 0 : hours;
      } else {
        hours = hours === 12 ? 12 : hours + 12;
      }

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    const twentyFourHourMatch = trimmedValue.match(/^(\d{2}):(\d{2})$/);

    if (!twentyFourHourMatch) {
      return null;
    }

    const hours = Number(twentyFourHourMatch[1]);
    const minutes = Number(twentyFourHourMatch[2]);

    if (Number.isNaN(hours) || Number.isNaN(minutes) || hours > 23 || minutes > 59) {
      return null;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}
