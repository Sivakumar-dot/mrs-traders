export interface ProductCategory {
  _id: string;
  categoryName: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductCategoryListResponse {
  success: boolean;
  message?: string;
  data: ProductCategory[];
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
}

export interface ProductCategoryResponse {
  success: boolean;
  message?: string;
  data: ProductCategory;
}

export interface ProductCategoryPayload {
  categoryName: string;
  description: string;
  isActive: boolean;
}
