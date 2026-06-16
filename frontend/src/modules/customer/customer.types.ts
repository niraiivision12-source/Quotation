export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  city?: string;
  source?: string;
  notes?: string;
  referralDate?: string;
  contactOwnerId?: string;
  contactOwner?: { id: string; name: string };
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

export interface CustomerProject {
  id: string;
  projectName: string;
  location?: string;
}

export interface CustomerDetails {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;

  projects: CustomerProject[];
}
