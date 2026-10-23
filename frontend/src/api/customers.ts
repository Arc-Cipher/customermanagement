import { api } from './axios';
import type { CustomerRequest, CustomerResponse, CustomerStatus } from '../types/customer';
import type { Page } from '../types/api';

export interface CustomerListParams {
  q?: string;
  status?: CustomerStatus;
  page?: number;
  size?: number;
}

export async function listCustomers(params?: CustomerListParams): Promise<Page<CustomerResponse>> {
  const response = await api.get<Page<CustomerResponse>>('/customers', {
    params: {
      q: params?.q || undefined,
      status: params?.status ?? 'ACTIVE',
      page: params?.page ?? 0,
      size: params?.size ?? 20,
    },
  });
  return response.data;
}

export async function getCustomerById(id: number): Promise<CustomerResponse> {
  const response = await api.get<CustomerResponse>(`/customers/${id}`);
  return response.data;
}

export async function getCustomerByPhone(phone: string): Promise<CustomerResponse> {
  const response = await api.get<CustomerResponse>(`/customers/phone/${encodeURIComponent(phone)}`);
  return response.data;
}

export async function createCustomer(data: CustomerRequest): Promise<CustomerResponse> {
  const response = await api.post<CustomerResponse>('/customers', data);
  return response.data;
}

export async function updateCustomer(id: number, data: CustomerRequest): Promise<CustomerResponse> {
  const response = await api.put<CustomerResponse>(`/customers/${id}`, data);
  return response.data;
}

export async function deactivateCustomer(id: number): Promise<void> {
  await api.delete(`/customers/${id}`);
}

export async function reactivateCustomer(id: number): Promise<CustomerResponse> {
  const response = await api.post<CustomerResponse>(`/customers/${id}/reactivate`);
  return response.data;
}
