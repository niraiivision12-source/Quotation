export interface Product {
  id: string;

  sku: string;

  name: string;

  costPrice: number;

  stockQty: number;

  brand?: string;

  category?: string;

  unit?: string;
}

export interface ProductListResponse {
  items: Product[];

  total: number;

  page: number;

  limit: number;
}
