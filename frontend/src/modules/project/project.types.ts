export interface Project {
  id: string;

  projectName: string;

  location?: string | null;

  customerId: string;

  assignedToId?: string | null;

  estimatedBudget?: number | null;

  currentPhase: string;

  isCompleted: boolean;

  isActive: boolean;

  customer: {
    id: string;
    name: string;
    mobile: string;
    email?: string | null;
  };

  quotations?: { totalAmount: string }[];
}

export interface ProjectListResponse {
  items: Project[];
  total: number;
  page: number;
  limit: number;
}

export interface ProjectPhase {
  id: string;

  phase: "PIPES" | "WIRING" | "SWITCHES" | "LIGHTS" | "FANS";

  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";

  remarks?: string | null;

  startedAt?: string | null;

  completedAt?: string | null;
}

export interface ProjectDetails {
  id: string;

  projectName: string;

  location?: string;

  currentPhase: string;

  isCompleted: boolean;

  customer: {
    id: string;
    name: string;
    mobile: string;
  };

  phaseTracking: ProjectPhase[];

  quotations: {
    id: string;
    quotationNumber: string;
    status: string;
    totalAmount: string;
    createdAt: string;
  }[];

  reminders: {
    id: string;
    title: string;
    dueAt: string;
    priority: string;
  }[];

  activities: {
    id: string;
    type: string;
    message: string;
    createdAt: string;
  }[];
}
