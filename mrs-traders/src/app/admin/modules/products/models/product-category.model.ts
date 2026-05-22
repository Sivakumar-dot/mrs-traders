export interface ProductCategoryOption {
  _id: string;
  name?: string;
  categoryName?: string;
}

export interface ProductCategoryOptionsResponse {
  success: boolean;
  message?: string;
  data: ProductCategoryOption[];
}
