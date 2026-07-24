export interface Customer {
  id: string;

  name: string;

  mobile: string;

  email?: string | null;

  address?: string | null;

  assignedToId?: string | null;

  isActive: boolean;
  creditAllowed: boolean;
  defaultCreditDays: number;
  maxCreditAmount: number;
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
  creditAllowed: boolean;
  defaultCreditDays: number;
  maxCreditAmount: number;
  assignedToId?: string | null;

  assignedTo?: { id: string; name: string } | null;
  opportunities?: any[];
  quotations?: any[];
  payments?: any[];
  reminders?: any[];
  tasks?: any[];
  activities?: any[];
  outstandingAmount?: number;
  totalRevenue?: number;
  lastPurchase?: string | null;
  lastContact?: string | null;
}
