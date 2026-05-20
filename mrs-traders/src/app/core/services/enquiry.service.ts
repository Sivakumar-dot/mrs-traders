import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  private readonly apiUrl = environment.apiUrl;

  submitEnquiry(payload: EnquiryPayload): Observable<EnquiryResponse> {
    return this.http.post<EnquiryResponse>(`${this.apiUrl}/enquiry`, payload);
  }
}
