import { api } from './axios';
import type { StaffRequest, StaffResponse } from '../types/staff';

export async function listStaff(): Promise<StaffResponse[]> {
  const response = await api.get<StaffResponse[]>('/staff');
  return response.data;
}

export async function createStaff(data: StaffRequest): Promise<StaffResponse> {
  const response = await api.post<StaffResponse>('/staff', data);
  return response.data;
}

export async function activateStaff(id: number): Promise<StaffResponse> {
  const response = await api.post<StaffResponse>(`/staff/${id}/activate`);
  return response.data;
}

export async function deactivateStaff(id: number): Promise<StaffResponse> {
  const response = await api.post<StaffResponse>(`/staff/${id}/deactivate`);
  return response.data;
}
