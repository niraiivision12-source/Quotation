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

export interface ProjectPhase {
  id: string;

  phase: string;

  status: string;

  remarks?: string;
}

export interface ProjectDetails {
  id: string;

  projectName: string;

  location?: string;

  customer: {
    id: string;
    name: string;
  };

  phaseTracking: ProjectPhase[];
}
