import { api } from './axios';
import type { UserInfo } from '../types/auth';

export async function getMe(): Promise<UserInfo> {
  const response = await api.get<UserInfo>('/auth/me');
  return response.data;
}
