export interface Project {
  id: string;

  projectName: string;

  location?: string;

  customerId: string;

  assignedToId?: string;

  customer: {
    id: string;
    name: string;
    mobile: string;
    email?: string;
  };
}

export interface ProjectListResponse {
  items: Project[];
  total: number;
  page: number;
  limit: number;
}
