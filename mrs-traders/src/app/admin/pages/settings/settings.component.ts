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

interface CoordinatePoint {
  lat: number;
  lng: number;
}

interface MapTile {
  url: string;
  x: number;
  y: number;
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

const MAP_TILE_SIZE = 256;
const MAP_VIEWBOX_WIDTH = MAP_TILE_SIZE * 3;
const MAP_VIEWBOX_HEIGHT = 320;
const DEFAULT_MAP_ZOOM_LEVEL = 14;
const MIN_MAP_ZOOM_LEVEL = 3;
const MAX_MAP_ZOOM_LEVEL = 19;
const DRAG_THRESHOLD_PX = 6;
const DEFAULT_MAP_COORDINATES: CoordinatePoint = {
  lat: 20.5937,
  lng: 78.9629
};

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
  protected readonly mapTiles = signal<MapTile[]>([]);
  protected readonly selectedCoordinates = signal<CoordinatePoint | null>(null);
  protected readonly mapCenterCoordinates = signal<CoordinatePoint>(DEFAULT_MAP_COORDINATES);
  protected readonly mapMarkerPosition = signal<{ x: number; y: number } | null>(null);
  protected readonly mapZoomLevel = signal(DEFAULT_MAP_ZOOM_LEVEL);
  protected readonly mapViewBox = `0 0 ${MAP_VIEWBOX_WIDTH} ${MAP_VIEWBOX_HEIGHT}`;
  protected readonly settingsForm = this.fb.nonNullable.group({
    companyName: ['', Validators.required],
    companyService: [''],
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
  private isDraggingMap = false;
  private didDragMap = false;
  private dragStartPoint: { x: number; y: number } | null = null;
  private dragStartCenterPixel: { x: number; y: number } | null = null;

  constructor() {
    this.syncBusinessHoursText();
    this.refreshMap(DEFAULT_MAP_COORDINATES);
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
          this.syncMapFromStoredValue(settings.googleMapUrl);
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

  protected onMapPointerDown(event: PointerEvent): void {
    const mapElement = event.currentTarget as HTMLElement | null;

    if (!mapElement) {
      return;
    }

    this.isDraggingMap = true;
    this.didDragMap = false;
    this.dragStartPoint = { x: event.clientX, y: event.clientY };
    this.dragStartCenterPixel = this.projectCoordinates(
      this.mapCenterCoordinates(),
      this.mapZoomLevel()
    );
    mapElement.setPointerCapture(event.pointerId);
  }

  protected onMapPointerMove(event: PointerEvent): void {
    if (!this.isDraggingMap || !this.dragStartPoint || !this.dragStartCenterPixel) {
      return;
    }

    const deltaX = event.clientX - this.dragStartPoint.x;
    const deltaY = event.clientY - this.dragStartPoint.y;

    if (!this.didDragMap && Math.hypot(deltaX, deltaY) >= DRAG_THRESHOLD_PX) {
      this.didDragMap = true;
    }

    if (!this.didDragMap) {
      return;
    }

    const zoomLevel = this.mapZoomLevel();
    const centerPixel = {
      x: this.dragStartCenterPixel.x - deltaX,
      y: this.dragStartCenterPixel.y - deltaY
    };

    this.refreshMap(this.unprojectCoordinates(centerPixel.x, centerPixel.y, zoomLevel), false);
  }

  protected onMapPointerUp(event: PointerEvent): void {
    const mapElement = event.currentTarget as HTMLElement | null;

    if (mapElement?.hasPointerCapture(event.pointerId)) {
      mapElement.releasePointerCapture(event.pointerId);
    }

    this.isDraggingMap = false;
    this.dragStartPoint = null;
    this.dragStartCenterPixel = null;
  }

  protected placeMarkerFromMapClick(event: MouseEvent): void {
    if (this.didDragMap) {
      this.didDragMap = false;
      return;
    }

    const mapElement = event.currentTarget as HTMLElement | null;

    if (!mapElement) {
      return;
    }

    const rect = mapElement.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * MAP_VIEWBOX_WIDTH;
    const relativeY = ((event.clientY - rect.top) / rect.height) * MAP_VIEWBOX_HEIGHT;
    const centerPixel = this.projectCoordinates(this.mapCenterCoordinates(), this.mapZoomLevel());
    const globalPixelX = centerPixel.x - MAP_VIEWBOX_WIDTH / 2 + relativeX;
    const globalPixelY = centerPixel.y - MAP_VIEWBOX_HEIGHT / 2 + relativeY;

    this.setSelectedCoordinates(
      this.unprojectCoordinates(globalPixelX, globalPixelY, this.mapZoomLevel()),
      true,
      false
    );
  }

  protected zoomInMap(): void {
    this.updateMapZoom(this.mapZoomLevel() + 1);
  }

  protected zoomOutMap(): void {
    this.updateMapZoom(this.mapZoomLevel() - 1);
  }

  protected onMapWheel(event: WheelEvent): void {
    event.preventDefault();
    this.updateMapZoom(this.mapZoomLevel() + (event.deltaY < 0 ? 1 : -1));
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

  private syncMapFromStoredValue(value: string | null | undefined): void {
    const parsedCoordinates = this.parseCoordinates(value);

    if (parsedCoordinates) {
      this.setSelectedCoordinates(parsedCoordinates, false);
      return;
    }

    this.selectedCoordinates.set(null);
    this.refreshMap(DEFAULT_MAP_COORDINATES);
  }

  private setSelectedCoordinates(
    coordinates: CoordinatePoint,
    updateControl = true,
    centerMap = true
  ): void {
    const normalizedCoordinates = {
      lat: this.clampLatitude(coordinates.lat),
      lng: this.normalizeLongitude(coordinates.lng)
    };

    this.selectedCoordinates.set(normalizedCoordinates);
    this.refreshMap(centerMap ? normalizedCoordinates : this.mapCenterCoordinates());

    if (updateControl) {
      this.settingsForm.controls.googleMapUrl.setValue(
        this.formatCoordinates(normalizedCoordinates),
        { emitEvent: false }
      );
      this.settingsForm.controls.googleMapUrl.markAsDirty();
      this.settingsForm.controls.googleMapUrl.updateValueAndValidity({ emitEvent: false });
    }
  }

  private updateMapZoom(nextZoomLevel: number): void {
    const normalizedZoomLevel = Math.max(MIN_MAP_ZOOM_LEVEL, Math.min(MAX_MAP_ZOOM_LEVEL, nextZoomLevel));

    if (normalizedZoomLevel === this.mapZoomLevel()) {
      return;
    }

    this.mapZoomLevel.set(normalizedZoomLevel);
    this.refreshMap(this.mapCenterCoordinates());
  }

  private refreshMap(center: CoordinatePoint, updateCenterSignal = true): void {
    if (updateCenterSignal) {
      this.mapCenterCoordinates.set(center);
    }

    const zoomLevel = this.mapZoomLevel();
    const centerPixel = this.projectCoordinates(center, zoomLevel);
    const startTileX = Math.floor((centerPixel.x - MAP_VIEWBOX_WIDTH / 2) / MAP_TILE_SIZE);
    const endTileX = Math.floor((centerPixel.x + MAP_VIEWBOX_WIDTH / 2) / MAP_TILE_SIZE);
    const startTileY = Math.floor((centerPixel.y - MAP_VIEWBOX_HEIGHT / 2) / MAP_TILE_SIZE);
    const endTileY = Math.floor((centerPixel.y + MAP_VIEWBOX_HEIGHT / 2) / MAP_TILE_SIZE);
    const tileLimit = 2 ** zoomLevel;
    const tiles: MapTile[] = [];

    for (let tileX = startTileX; tileX <= endTileX; tileX += 1) {
      for (let tileY = startTileY; tileY <= endTileY; tileY += 1) {
        if (tileY < 0 || tileY >= tileLimit) {
          continue;
        }

        const normalizedTileX = ((tileX % tileLimit) + tileLimit) % tileLimit;
        tiles.push({
          url: `https://tile.openstreetmap.org/${zoomLevel}/${normalizedTileX}/${tileY}.png`,
          x: tileX * MAP_TILE_SIZE - (centerPixel.x - MAP_VIEWBOX_WIDTH / 2),
          y: tileY * MAP_TILE_SIZE - (centerPixel.y - MAP_VIEWBOX_HEIGHT / 2)
        });
      }
    }

    this.mapTiles.set(tiles);
    this.mapMarkerPosition.set(this.getMarkerPosition(centerPixel, zoomLevel));
  }

  private getMarkerPosition(
    centerPixel: { x: number; y: number },
    zoomLevel: number
  ): { x: number; y: number } | null {
    const coordinates = this.selectedCoordinates();

    if (!coordinates) {
      return null;
    }

    const markerPixel = this.projectCoordinates(coordinates, zoomLevel);

    return {
      x: markerPixel.x - centerPixel.x + MAP_VIEWBOX_WIDTH / 2,
      y: markerPixel.y - centerPixel.y + MAP_VIEWBOX_HEIGHT / 2
    };
  }

  private parseCoordinates(value: string | null | undefined): CoordinatePoint | null {
    const normalizedValue = value?.trim();

    if (!normalizedValue) {
      return null;
    }

    const directCoordinatesMatch = normalizedValue.match(
      /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/
    );

    if (directCoordinatesMatch) {
      return this.toCoordinatePoint(directCoordinatesMatch[1], directCoordinatesMatch[2]);
    }

    const embeddedCoordinatesMatch = normalizedValue.match(
      /[@=](-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/
    );

    if (embeddedCoordinatesMatch) {
      return this.toCoordinatePoint(embeddedCoordinatesMatch[1], embeddedCoordinatesMatch[2]);
    }

    return null;
  }

  private toCoordinatePoint(latValue: string, lngValue: string): CoordinatePoint | null {
    const lat = Number(latValue);
    const lng = Number(lngValue);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }

    return {
      lat: this.clampLatitude(lat),
      lng: this.normalizeLongitude(lng)
    };
  }

  private formatCoordinates(coordinates: CoordinatePoint): string {
    return `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
  }

  private projectCoordinates(coordinates: CoordinatePoint, zoom: number): { x: number; y: number } {
    const scale = MAP_TILE_SIZE * 2 ** zoom;
    const latitude = this.clampLatitude(coordinates.lat);
    const longitude = this.normalizeLongitude(coordinates.lng);
    const latitudeRadians = (latitude * Math.PI) / 180;

    return {
      x: ((longitude + 180) / 360) * scale,
      y:
        (0.5 -
          Math.log((1 + Math.sin(latitudeRadians)) / (1 - Math.sin(latitudeRadians))) /
            (4 * Math.PI)) *
        scale
    };
  }

  private unprojectCoordinates(x: number, y: number, zoom: number): CoordinatePoint {
    const scale = MAP_TILE_SIZE * 2 ** zoom;
    const longitude = (x / scale) * 360 - 180;
    const latitudeRadians = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / scale)));
    const latitude = (latitudeRadians * 180) / Math.PI;

    return {
      lat: this.clampLatitude(latitude),
      lng: this.normalizeLongitude(longitude)
    };
  }

  private clampLatitude(latitude: number): number {
    return Math.max(-85.05112878, Math.min(85.05112878, latitude));
  }

  private normalizeLongitude(longitude: number): number {
    return ((longitude + 180) % 360 + 360) % 360 - 180;
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
