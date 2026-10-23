export interface ProductResponse {
  id: number;
  name: string;
  barcode: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  categoryId: number;
  categoryName: string;
  active: boolean;
}

export interface ProductRequest {
  name: string;
  barcode: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  categoryId: number;
}

export interface StockAdjustRequest {
  change: number;
}
