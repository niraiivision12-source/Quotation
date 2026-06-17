export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "FOLLOW_UP"
  | "QUOTATION_SENT"
  | "NEGOTIATION"
  | "WON"
  | "LOST";

export interface Lead {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  source?: string;
  notes?: string;
  status: LeadStatus;
  contactOwnerId?: string;
  contactOwner?: { id: string; name: string };
  city?: string;
  referralDate?: string;
  assignedToId?: string;
  nextFollowUpAt?: string | null;
  createdAt: string;
}

export type LeadActivityType =
  | "CREATED"
  | "STATUS_CHANGED"
  | "FOLLOW_UP_SET"
  | "FOLLOW_UP_COMPLETED"
  | "CONVERTED"
  | "REOPENED"
  | "UPDATED"
  | "REMINDER_CREATED";

export interface LeadActivity {
  id: string;
  leadId: string;
  userId: string;
  type: LeadActivityType;
  message: string;
  createdAt: string;
  user: { id: string; name: string };
}

export interface LeadListResponse {
  items: Lead[];
  total: number;
  page: number;
  limit: number;
}

export type PhaseStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
export type ProjectPhase = "PIPES" | "WIRING" | "SWITCHES" | "LIGHTS" | "FANS";

export interface PhaseTracking {
  id: string;
  phase: ProjectPhase;
  status: PhaseStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  remarks?: string | null;
}

export interface LeadLifecycle {
  id: string;
  projectName: string;
  phaseTracking: PhaseTracking[];
}
