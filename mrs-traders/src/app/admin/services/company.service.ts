import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { CompanySettings, CompanySettingsResponse } from '../models/company-settings.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getCompanySettings(): Observable<CompanySettings> {
    return this.http.get<CompanySettingsResponse | CompanySettings>(`${this.apiUrl}/company`).pipe(
      map((response) => {
        if (this.isWrappedResponse(response)) {
          return response.data ?? this.createEmptySettings();
        }

        return response;
      })
    );
  }

  updateCompanySettings(payload: CompanySettings): Observable<CompanySettingsResponse> {
    return this.http.put<CompanySettingsResponse>(`${this.apiUrl}/company`, payload);
  }

  private createEmptySettings(): CompanySettings {
    return {
      companyName: '',
      companyService: '',
      ownerName: '',
      address: '',
      mobileNumber: '',
      whatsappNumber: '',
      email: '',
      googleMapUrl: '',
      businessHours: ''
    };
  }

  private isWrappedResponse(
    response: CompanySettingsResponse | CompanySettings
  ): response is CompanySettingsResponse {
    return 'data' in response || 'success' in response || 'message' in response;
  }
}
