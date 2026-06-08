export type UserRole = "OWNER" | "SALESMAN" | "ATTENDANT" | "ACCOUNTANT";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
