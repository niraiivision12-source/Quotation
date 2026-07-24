import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "../../lib/query-client";
import {
  createEnquiry,
  getEnquiries,
  ignoreEnquiry,
  triageEnquiry,
} from "./enquiry.api";

export const useEnquiries = (
  page: number,
  search: string,
  status?: string,
  limit = 20
) => {
  return useQuery({
    queryKey: ["enquiries", page, search, status, limit],
    queryFn: () => getEnquiries(page, limit, search, status),
  });
};

export const useCreateEnquiry = () => {
  return useMutation({
    mutationFn: createEnquiry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
    },
  });
};

export const useTriageEnquiry = () => {
  return useMutation({
    mutationFn: ({ id, category }: { id: string; category: string }) =>
      triageEnquiry(id, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};

export const useIgnoreEnquiry = () => {
  return useMutation({
    mutationFn: ignoreEnquiry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
    },
  });
};
