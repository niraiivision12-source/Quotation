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

export interface CustomerOption {
  id: string;
  name: string;
}
