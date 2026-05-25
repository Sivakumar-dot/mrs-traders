export interface Product {
  _id: string;
  productCode: string;
  productName: string;
  categoryId: string;
  categoryName?: string;
  brand: string;
  description: string;
  price: number;
  quantity: number;
  uom: string;
  imageUrl: string;
  isActive: boolean;
  isDeleted?: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListItem extends Product {}

export interface ProductListResponse {
  success: boolean;
  message?: string;
  data: ProductListItem[];
  totalRecords?: number;
  currentPage?: number;
  pageSize?: number;
  pagination?: {
    page?: number;
    limit?: number;
    totalRecords?: number;
    totalPages?: number;
  };
}

export interface ProductResponse {
  success: boolean;
  message?: string;
  data: Product;
}

export interface ProductPayload {
  productCode: string;
  productName: string;
  categoryId: string;
  brand: string;
  description: string;
  price: number;
  quantity: number;
  uom: string;
  imageUrl: string;
  isActive: boolean;
}
