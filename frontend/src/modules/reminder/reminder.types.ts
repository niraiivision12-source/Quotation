export type ReminderStatus = "PENDING" | "COMPLETED" | "MISSED" | "CANCELLED";
export type ReminderType =
  | "LEAD"
  | "PROJECT"
  | "CUSTOMER"
  | "QUOTATION"
  | "TASK"
  | "PAYMENT"
  | "OPPORTUNITY";
export type ReminderPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ReminderRepeatType = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";

export interface ReminderLead {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  source?: string | null;
  status: string;
  notes?: string | null;

  assignedToId?: string | null;
  assignedTo?: { id: string; name: string } | null;

  nextFollowUpAt?: string | null;
  lastContactedAt?: string | null;
  convertedAt?: string | null;
  lostReason?: string | null;

  createdAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string | null;
  type: ReminderType;
  priority: ReminderPriority;
  status: ReminderStatus;
  dueAt: string;
  repeatType: ReminderRepeatType;
  completedAt?: string | null;
  notificationSent: boolean;
  userId: string;
  leadId?: string | null;
  customerId?: string | null;
  projectId?: string | null;
  paymentId?: string | null;
  opportunityId?: string | null;
  lead?: ReminderLead | null;
  customer?: { id: string; name: string } | null;
  project?: { id: string; projectName: string } | null;
  payment?: { id: string; billNumber: string; project?: { projectName: string } | null } | null;
  opportunity?: { id: string; category: string } | null;
  user?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderListResponse {
  items: Reminder[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateReminderInput {
  title: string;
  description?: string;
  type: ReminderType;
  priority: ReminderPriority;
  dueAt: string;
  repeatType?: ReminderRepeatType;
  leadId?: string;
  customerId?: string;
  projectId?: string;
  paymentId?: string;
  opportunityId?: string;
}
