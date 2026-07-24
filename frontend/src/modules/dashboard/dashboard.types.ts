export type UserRole = "OWNER" | "SALESMAN" | "ATTENDANT" | "ACCOUNTANT";

export type ProjectCategory = "PIPES" | "WIRES" | "SWITCHES" | "LIGHTS" | "FANS" | "OTHERS";

export interface DashboardSummaryQuery {
  period?: "today" | "this_week" | "this_month" | "this_year" | "custom";
  startDate?: string;
  endDate?: string;
}

export interface OwnerKpiCards {
  totalEnquiries: number;
  newEnquiriesToday: number;
  pendingEnquiries: number;
  activeOpportunities: number;
  wonOpportunities: number;
  lostOpportunities: number;
  potentialRevenue: number;
  closedRevenue: number;
  todayFollowups: number;
  overdueFollowups: number;
  todayQuotations: number;
  pendingPayments: number;
}

export interface OwnerCharts {
  opportunityConversionRate: number;
  revenueByCategory: Array<{ category: string; revenue: number }>;
  enquirySourceDistribution: Array<{ source: string; count: number }>;
  categoryWiseSales: Array<{ category: string; sales: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  followupPerformance: {
    completed: number;
    missed: number;
    pending: number;
  };
}

export interface SalespersonKpiCards {
  assignedCategories: string[];
  todayFollowups: number;
  yesterdayPendingFollowups: number;
  newOpportunities: number;
  quotationPending: number;
  negotiations: number;
  wonThisMonth: number;
  lostThisMonth: number;
  upcomingReminderSuggestions: Array<{
    id: string;
    title: string;
    description?: string | null;
    dueAt: string;
    priority: string;
    status: string;
    customer?: {
      name: string;
    } | null;
  }>;
}

export interface PipelineOverviewItem {
  category: string;
  active: number;
  won: number;
  lost: number;
  stageCounts: Record<string, number>;
}

export interface DashboardSummaryResponse {
  role: "OWNER" | "SALESMAN";
  kpiCards: OwnerKpiCards & SalespersonKpiCards; // Union/intersection for TS flexibility in queries
  charts?: OwnerCharts;
  myPipelines?: PipelineOverviewItem[];
  otherPipelines?: PipelineOverviewItem[];
}
