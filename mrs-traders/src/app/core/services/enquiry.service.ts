import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface EnquiryPayload {
  name: string;
  mobile: string;
  service: string;
  message: string;
}

export interface EnquiryResponse {
  success: boolean;
  message: string;
  data?: {
    whatsappUrl?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class EnquiryService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = 'http://localhost:5000';

  submitEnquiry(payload: EnquiryPayload): Observable<EnquiryResponse> {
    return this.http.post<EnquiryResponse>(`${this.apiBaseUrl}/api/enquiry`, payload);
  }
}
