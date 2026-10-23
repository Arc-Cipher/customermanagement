export type CustomerStatus = 'ACTIVE' | 'INACTIVE';

export interface CustomerResponse {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  loyaltyPoints: number;
  status: CustomerStatus;
  marketingConsent: boolean;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRequest {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  marketingConsent?: boolean;
}
