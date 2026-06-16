export type UserRole = "OWNER" | "SALESMAN" | "ATTENDANT" | "ACCOUNTANT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  limit: number;
}
