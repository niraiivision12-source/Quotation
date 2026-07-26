export interface CreateDealerDTO {
  name: string;
  contactPerson?: string | null;
  mobile: string;
  email?: string | null;
  address?: string | null;
  gst?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface UpdateDealerDTO {
  name?: string;
  contactPerson?: string | null;
  mobile?: string;
  email?: string | null;
  address?: string | null;
  gst?: string | null;
  city?: string | null;
  state?: string | null;
}
