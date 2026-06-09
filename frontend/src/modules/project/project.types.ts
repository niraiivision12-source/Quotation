export interface Project {
  id: string;
  projectName: string;
  location?: string;

  customer: {
    id: string;
    name: string;
  };
}

export interface ProjectListResponse {
  items: Project[];
  total: number;
  page: number;
  limit: number;
}
