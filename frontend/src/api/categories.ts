import { api } from './axios';
import type { CategoryRequest, CategoryResponse } from '../types/category';

export async function listCategories(): Promise<CategoryResponse[]> {
  const response = await api.get<CategoryResponse[]>('/categories');
  return response.data;
}

export async function createCategory(data: CategoryRequest): Promise<CategoryResponse> {
  const response = await api.post<CategoryResponse>('/categories', data);
  return response.data;
}

export async function updateCategory(id: number, data: CategoryRequest): Promise<CategoryResponse> {
  const response = await api.put<CategoryResponse>(`/categories/${id}`, data);
  return response.data;
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/categories/${id}`);
}
