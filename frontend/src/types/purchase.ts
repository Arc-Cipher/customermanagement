export interface PurchaseItem {
  productId: number;
  quantity: number;
}

export interface PurchaseRequest {
  customerId?: number;
  items: PurchaseItem[];
  pointsToRedeem?: number;
}

export interface PurchaseItemResponse {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PurchaseResponse {
  id: number;
  customerId: number | null;
  customerName: string | null;
  cashierName: string;
  items: PurchaseItemResponse[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  pointsEarned: number;
  pointsRedeemed: number;
  createdAt: string;
}
