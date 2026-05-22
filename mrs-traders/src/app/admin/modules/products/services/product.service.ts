import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import {
  ProductListResponse,
  ProductPayload,
  ProductResponse
} from '../models/product.model';
import { ProductCategoryOptionsResponse } from '../models/product-category.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getProducts(page: number, limit: number, search: string): Observable<ProductListResponse> {
    let params = new HttpParams().set('page', page).set('limit', limit);

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<ProductListResponse>(`${this.apiUrl}/products`, { params });
  }

  getProductById(productId: string): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.apiUrl}/products/${productId}`);
  }

  createProduct(payload: ProductPayload): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(`${this.apiUrl}/products`, payload);
  }

  updateProduct(productId: string, payload: ProductPayload): Observable<ProductResponse> {
    return this.http.put<ProductResponse>(`${this.apiUrl}/products/${productId}`, payload);
  }

  deleteProduct(productId: string): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(
      `${this.apiUrl}/products/${productId}`
    );
  }

  getCategoryOptions(): Observable<ProductCategoryOptionsResponse> {
    return this.http.get<ProductCategoryOptionsResponse>(
      `${this.apiUrl}/product-categories/options`
    );
  }
}
