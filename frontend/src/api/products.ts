import { api } from './axios';
import type { ProductRequest, ProductResponse, StockAdjustRequest } from '../types/product';
import type { Page } from '../types/api';

export interface ProductListParams {
  q?: string;
  categoryId?: number;
  page?: number;
  size?: number;
}

export async function listProducts(params?: ProductListParams): Promise<Page<ProductResponse>> {
  const response = await api.get<Page<ProductResponse>>('/products', {
    params: {
      q: params?.q || undefined,
      categoryId: params?.categoryId || undefined,
      page: params?.page ?? 0,
      size: params?.size ?? 20,
    },
  });
  return response.data;
}

export async function getProductById(id: number): Promise<ProductResponse> {
  const response = await api.get<ProductResponse>(`/products/${id}`);
  return response.data;
}

export async function getProductByBarcode(barcode: string): Promise<ProductResponse> {
  const response = await api.get<ProductResponse>(`/products/barcode/${encodeURIComponent(barcode)}`);
  return response.data;
}

export async function createProduct(data: ProductRequest): Promise<ProductResponse> {
  const response = await api.post<ProductResponse>('/products', data);
  return response.data;
}

export async function updateProduct(id: number, data: ProductRequest): Promise<ProductResponse> {
  const response = await api.put<ProductResponse>(`/products/${id}`, data);
  return response.data;
}

export async function adjustStock(id: number, data: StockAdjustRequest): Promise<ProductResponse> {
  const response = await api.patch<ProductResponse>(`/products/${id}/stock`, data);
  return response.data;
}

export async function deactivateProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`);
}
