import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "./dashboard.api";
import type { DashboardSummaryQuery } from "./dashboard.types";

export const useDashboardSummary = (query?: DashboardSummaryQuery) => {
  return useQuery({
    queryKey: ["dashboard-summary", query],
    queryFn: () => getDashboardSummary(query),
    // Auto-refresh: Poll dashboard data every 15 seconds to capture updates
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
};
