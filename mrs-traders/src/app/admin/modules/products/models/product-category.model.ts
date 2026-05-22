export interface ProductCategoryOption {
  _id: string;
  name: string;
}

export interface ProductCategoryOptionsResponse {
  success: boolean;
  message?: string;
  data: ProductCategoryOption[];
}
