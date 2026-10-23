export type Role = 'CASHIER' | 'MANAGER' | 'ADMIN';

export interface UserInfo {
  id: number;
  name: string;
  username: string;
  role: Role;
  active: boolean;
}
