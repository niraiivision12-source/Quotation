export type EnquiryStatus = "PENDING" | "TRIAGED" | "IGNORED";

export interface Enquiry {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  source: string;
  message?: string | null;
  city?: string | null;
  status: EnquiryStatus;
  category?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnquiryListResponse {
  items: Enquiry[];
  total: number;
  page: number;
  limit: number;
}
