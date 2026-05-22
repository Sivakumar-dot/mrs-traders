import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import {
  ProductCategoryListResponse,
  ProductCategoryPayload,
  ProductCategoryResponse
} from '../models/product-category.model';

@Injectable({
  providedIn: 'root'
})
export class ProductCategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getCategories(page: number, limit: number, search: string): Observable<ProductCategoryListResponse> {
    let params = new HttpParams().set('page', page).set('limit', limit);

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<ProductCategoryListResponse>(`${this.apiUrl}/product-categories`, {
      params
    });
  }

  getCategoryById(categoryId: string): Observable<ProductCategoryResponse> {
    return this.http.get<ProductCategoryResponse>(`${this.apiUrl}/product-categories/${categoryId}`);
  }

  createCategory(payload: ProductCategoryPayload): Observable<ProductCategoryResponse> {
    return this.http.post<ProductCategoryResponse>(`${this.apiUrl}/product-categories`, payload);
  }

  updateCategory(
    categoryId: string,
    payload: ProductCategoryPayload
  ): Observable<ProductCategoryResponse> {
    return this.http.put<ProductCategoryResponse>(
      `${this.apiUrl}/product-categories/${categoryId}`,
      payload
    );
  }

  deleteCategory(categoryId: string): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(
      `${this.apiUrl}/product-categories/${categoryId}`
    );
  }
}
