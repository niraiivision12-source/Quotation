export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role: "OWNER" | "SALESMAN" | "ATTENDANT" | "ACCOUNTANT";
}
