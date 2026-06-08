export interface CreateLeadDTO {
  name: string;
  mobile: string;
  email?: string;
  source?: string;
  notes?: string;
  assignedToId?: string;
}
