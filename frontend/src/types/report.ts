export interface TopCustomer {
  customerId: number;
  name: string;
  phone: string;
  totalSpent: number;
  purchaseCount: number;
}

export interface TopProduct {
  productId: number;
  name: string;
  totalQuantitySold: number;
}
