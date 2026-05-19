export interface CompanySettings {
  companyName: string;
  ownerName: string;
  address: string;
  mobileNumber: string;
  whatsappNumber: string;
  email: string;
  googleMapUrl: string;
  businessHours: string;
}

export interface CompanySettingsResponse {
  success?: boolean;
  message?: string;
  data?: CompanySettings;
}
