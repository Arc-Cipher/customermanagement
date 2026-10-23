import type { Role } from '../types/auth';

export function hasRole(userRole: Role | undefined | null, required: Role[]): boolean {
  if (!userRole) return false;
  return required.includes(userRole);
}

export function canManage(role: Role | undefined | null): boolean {
  if (!role) return false;
  return role === 'MANAGER' || role === 'ADMIN';
}

export function isAdmin(role: Role | undefined | null): boolean {
  return role === 'ADMIN';
}
