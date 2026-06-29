export type UserRole = "OWNER" | "SALESMAN" | "ATTENDANT" | "ACCOUNTANT";

export type ProjectPhase = "PIPES" | "WIRING" | "SWITCHES" | "LIGHTS" | "FANS" | "OTHERS";

export interface KPICardData {
  current: number;
  changePercent: number;
  trend: "up" | "down" | "neutral";
}

export interface DashboardSummaryQuery {
  period?: "today" | "this_week" | "this_month" | "this_year" | "custom";
  startDate?: string;
  endDate?: string;
}

export interface DashboardSummaryResponse {
  kpiCards: {
    totalRevenue: KPICardData;
    potentialRevenue: KPICardData;
    totalLeads: KPICardData;
    activeCustomers: KPICardData;
    activeProjects: KPICardData;
    pendingQuotations: KPICardData;
    lowStockProducts: KPICardData;
    pendingReminders: KPICardData;
  };
  salesAnalytics: {
    revenueTrend: Array<{ date: string; revenue: number }>;
    quotationsCreated: number;
    quotationsApproved: number;
    quotationsRejected: number;
    conversionRate: number;
    averageQuotationValue: number;
    revenueByProjectPhase: Array<{ phase: ProjectPhase; revenue: number }>;
    monthlySales: Array<{ month: string; revenue: number }>;
  };
  leadAnalytics: {
    newLeads: number;
    contacted: number;
    notResponding: number;
    quotationSent: number;
    negotiation: number;
    won: number;
    lost: number;
    leadConversionRate: number;
    leadSourceDistribution: Array<{ source: string; count: number }>;
    averageTimeToConvert: number;
  };
  projectAnalytics: {
    activeProjects: number;
    completedProjects: number;
    projectsByPhase: Array<{ phase: ProjectPhase; count: number }>;
    pipelineValueByPhase: Array<{ phase: ProjectPhase; pipelineValue: number }>;
    phaseDistribution: Array<{ phase: ProjectPhase; percentage: number }>;
    averageProjectValue: number;
    currentPhaseWorkload: Array<{ phase: ProjectPhase; count: number }>;
  };
  inventoryAnalytics: {
    totalProducts: number;
    currentInventoryValue: number;
    lowStockProductsCount: number;
    outOfStockProductsCount: number;
    highestSellingProducts: Array<{
      id: string;
      sku: string;
      name: string;
      quantitySold: number;
      revenue: number;
    }>;
    recentlyAddedProducts: Array<{
      id: string;
      sku: string;
      name: string;
      costPrice: number;
      stockQty: number;
      createdAt: string;
    }>;
    stockMovement: {
      added: number;
      removed: number;
      trend: "up" | "down" | "neutral";
      history: Array<{
        date: string;
        type: "ADDED" | "REMOVED";
        qty: number;
        productName: string;
      }>;
    };
  };
  employeePerformance?: {
    salesmanPerformance: Array<{
      id: string;
      name: string;
      email: string;
      assignedLeads: number;
      wonLeads: number;
      lostLeads: number;
      conversionRate: number;
      activeProjects: number;
      revenueGenerated: number;
      pendingFollowUps: number;
      pendingTasks: number;
      rank: number;
    }>;
    rankings: {
      topPerformer: string | null;
      highestRevenue: string | null;
      highestConversion: string | null;
      mostActive: string | null;
    };
    accountantPerformance: Array<{
      id: string;
      name: string;
      email: string;
      quotationsProcessed: number;
      averageProcessingTime: number;
      pendingQuotations: number;
    }>;
    attendantPerformance: Array<{
      id: string;
      name: string;
      email: string;
      assignedTasks: number;
      completedTasks: number;
      pendingTasks: number;
    }>;
  };
  upcomingWork: {
    upcomingReminders: Array<any>;
    upcomingTasks: Array<any>;
    overdueTasks: Array<any>;
    overdueFollowUps: Array<any>;
    todaySchedule: Array<{
      id: string;
      type: "reminder" | "task";
      title: string;
      dueAt: string;
      priority: string;
      status: string;
      link: string;
    }>;
  };
  recentActivityFeed: Array<{
    id: string;
    type: string;
    message: string;
    createdAt: string;
    module: "lead" | "project" | "customer" | "quotation" | "reminder" | "task";
    userId?: string | null;
    userName?: string | null;
  }>;
}
