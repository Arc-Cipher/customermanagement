import { api } from './axios';
import type { TopCustomer, TopProduct } from '../types/report';
import type { ProductResponse } from '../types/product';

export async function getTopCustomers(limit = 10): Promise<TopCustomer[]> {
  const response = await api.get<TopCustomer[]>('/reports/top-customers', {
    params: { limit },
  });
  return response.data;
}

export async function getTopProducts(limit = 10): Promise<TopProduct[]> {
  const response = await api.get<TopProduct[]>('/reports/top-products', {
    params: { limit },
  });
  return response.data;
}

export async function getLowStockProducts(): Promise<ProductResponse[]> {
  const response = await api.get<ProductResponse[]>('/reports/low-stock');
  return response.data;
}
