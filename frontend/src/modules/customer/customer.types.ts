export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
}

export interface CustomerListResponse {
  items: Customer[];
  total: number;
  page: number;
  limit: number;
}
