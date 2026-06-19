export interface CreateLeadDTO {
  name: string;
  mobile: string;
  email?: string;
  city?: string;
  source?: string;
  notes?: string;
  assignedToId?: string;
}
