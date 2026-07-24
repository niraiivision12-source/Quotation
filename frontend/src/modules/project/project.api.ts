export const getProjects = async (page = 1, limit = 20, _search = "") => {
  return { items: [], total: 0, page, limit } as any;
};

export const getProjectById = async (_id: string) => {
  return { id: "", projectName: "" } as any;
};
