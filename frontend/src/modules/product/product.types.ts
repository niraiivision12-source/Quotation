export interface Product {
  id: string;

  sku: string;

  name: string;

  costPrice?: number;

  mrp?: number;

  stockQty: number;

  brand?: string;

  category?: string;

  unit?: string;

  isActive?: boolean;

  /** Stock last pulled from Tally; 0 until a sync has run. */
  tallyStockQty?: number;

  tallyUpdatedAt?: string | null;

  createdAt?: string;

  updatedAt?: string;
}

export interface ProductListResponse {
  items: Product[];

  total: number;

  page: number;

  limit: number;
}
