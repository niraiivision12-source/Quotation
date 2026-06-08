export interface CreateProjectDTO {
  customerId: string;
  projectName: string;
  location?: string;
  assignedToId?: string;
  estimatedBudget?: number;
}
