export interface CreateCustomerDTO {
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  assignedToId?: string;
}
