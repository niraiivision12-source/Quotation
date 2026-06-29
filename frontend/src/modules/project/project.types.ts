export interface Project {
  id: string;

  projectName: string;

  location?: string | null;

  customerId: string;

  assignedToId?: string | null;

  estimatedBudget?: number | null;

  currentPhase: string;

  isCompleted: boolean;

  status: string;

  isActive: boolean;

  customer: {
    id: string;
    name: string;
    mobile: string;
    email?: string | null;
  };

  quotations?: { id: string; totalAmount: string; status: string; createdAt: string }[];
  startDate?: string | null;
  expectedCompletion?: string | null;
  phaseTracking?: ProjectPhase[];
  activities?: {
    id: string;
    type: string;
    message: string;
    createdAt: string;
    user?: { id: string; name: string } | null;
  }[];
  reminders?: {
    id: string;
    title: string;
    dueAt: string;
    priority: string;
  }[];
}

export interface ProjectListResponse {
  items: Project[];
  total: number;
  page: number;
  limit: number;
}

export interface ProjectPhase {
  id: string;

  phase: "PIPES" | "WIRING" | "SWITCHES" | "LIGHTS" | "FANS" | "OTHERS";

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

  status: string;

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
