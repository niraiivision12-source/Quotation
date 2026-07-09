export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  assignedTo: { id: string; name: string };
  createdBy: { id: string; name: string };
  lead?: { id: string; name: string; mobile: string } | null;
  customer?: { id: string; name: string } | null;
  project?: { id: string; projectName: string } | null;
  payment?: { id: string; billNumber: string; project?: { projectName: string } | null } | null;
}

export interface TaskListResponse {
  items: Task[];
  total: number;
  page: number;
  limit: number;
}
