export const getLeads = async (page = 1, limit = 20, _search = "") => {
  return { items: [], total: 0, page, limit } as any;
};

export const getLeadById = async (_id: string) => {
  return { id: "", name: "", mobile: "", email: "", city: "", source: "", notes: "" } as any;
};

export const createLead = async (_data: any) => {
  return { data: { id: "", name: "", mobile: "" } } as any;
};

export const updateLead = async (_id: string, _data: any) => {
  return { data: { id: "", name: "", mobile: "" } } as any;
};
