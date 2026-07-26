import { api } from "../../lib/axios";
import type { CreateDealerDTO, Dealer, UpdateDealerDTO } from "./dealer.types";

export const createDealer = async (data: CreateDealerDTO): Promise<Dealer> => {
  const response = await api.post("/dealers", data);
  return response.data.data;
};

export const getDealers = async (search = ""): Promise<{ items: Dealer[]; total: number }> => {
  const response = await api.get("/dealers", {
    params: {
      page: 1,
      limit: 100,
      search,
    },
  });
  return response.data.data;
};

export const getDealer = async (id: string): Promise<Dealer> => {
  const response = await api.get(`/dealers/${id}`);
  return response.data.data;
};

export const updateDealer = async (id: string, data: UpdateDealerDTO): Promise<Dealer> => {
  const response = await api.patch(`/dealers/${id}`, data);
  return response.data.data;
};

export const deactivateDealer = async (id: string): Promise<Dealer> => {
  const response = await api.patch(`/dealers/${id}/deactivate`);
  return response.data.data;
};
