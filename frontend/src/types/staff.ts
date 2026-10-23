import type { Role } from './auth';

export interface StaffResponse {
  id: number;
  name: string;
  username: string;
  role: Role;
  active: boolean;
}

export interface StaffRequest {
  name: string;
  username: string;
  password: string;
  role: Role;
}
