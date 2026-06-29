import { api } from "@/lib/axios";
import type { DashboardSummaryResponse, DashboardSummaryQuery } from "./dashboard.types";

export const getDashboardSummary = async (
  query?: DashboardSummaryQuery
): Promise<DashboardSummaryResponse> => {
  const response = await api.get("/dashboard/summary", {
    params: query,
  });

  return response.data.data;
};
