import { api } from './axios';
import type { PurchaseRequest, PurchaseResponse } from '../types/purchase';
import type { Page } from '../types/api';

export async function createPurchase(data: PurchaseRequest): Promise<PurchaseResponse> {
  const response = await api.post<PurchaseResponse>('/purchases', data);
  return response.data;
}

export async function getPurchaseById(id: number): Promise<PurchaseResponse> {
  const response = await api.get<PurchaseResponse>(`/purchases/${id}`);
  return response.data;
}

export async function listPurchasesByCustomer(
  customerId: number,
  params?: { page?: number; size?: number }
): Promise<Page<PurchaseResponse>> {
  const response = await api.get<Page<PurchaseResponse>>(`/purchases/customer/${customerId}`, {
    params: {
      page: params?.page ?? 0,
      size: params?.size ?? 20,
    },
  });
  return response.data;
}
