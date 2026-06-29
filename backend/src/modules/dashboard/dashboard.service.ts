import { prisma } from "@/config/prisma";
import {
  UserRole,
  ProjectPhase,
  ProjectStatus,
  LeadStatus,
  QuotationStatus,
  ReminderStatus,
  TaskStatus,
} from "@prisma/client";
import { DashboardSummaryResponse } from "./dashboard.types";

export class DashboardService {
  static async getSummary(
    userId: string,
    role: UserRole,
    period: string = "this_month",
    startDateStr?: string,
    endDateStr?: string
  ): Promise<DashboardSummaryResponse> {
    const isOwner = role === UserRole.OWNER;
    const now = new Date();

    // 1. Date Range Logic
    const { start, end, prevStart, prevEnd } = this.getDateRange(period, startDateStr, endDateStr);

    // 2. Scoping filters for different roles
    const leadWhere = isOwner ? {} : { assignedToId: userId };
    const customerWhere = isOwner ? {} : { assignedToId: userId };
    const projectWhere = isOwner ? {} : { assignedToId: userId };
    const quotationWhere = isOwner ? {} : { createdById: userId };
    const reminderWhere = isOwner ? { status: ReminderStatus.PENDING } : { userId, status: ReminderStatus.PENDING };
    const taskWhere = isOwner ? {} : { assignedToId: userId };

    // Activity filtering helper
    const leadActivityWhere = isOwner ? {} : { lead: { assignedToId: userId } };
    const projectActivityWhere = isOwner ? {} : { project: { assignedToId: userId } };
    const customerActivityWhere = isOwner ? {} : { customer: { assignedToId: userId } };

    // --- KPI CARDS CALCULATION ---
    const [
      // Total Revenue current & previous
      revenueCurrent,
      revenuePrev,
      // Potential Revenue current & previous
      potentialQuotesCurrent,
      potentialQuotesPrev,
      // Total Leads current & previous
      leadsCurrent,
      leadsPrev,
      // Active Customers current & previous
      customersCurrent,
      customersPrev,
      // Active Projects current & previous
      projectsCurrent,
      projectsPrev,
      // Pending Quotations current & previous
      pendingQuotesCurrent,
      pendingQuotesPrev,
      // Low Stock Products
      lowStockProductsCurrent,
      lowStockProductsPrev,
      // Pending Reminders current & previous
      pendingRemindersCurrent,
      pendingRemindersPrev,
    ] = await Promise.all([
      // Total Revenue (Approved Quotations)
      prisma.quotation.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: QuotationStatus.APPROVED,
          approvedAt: { gte: start, lte: end },
          ...quotationWhere,
        },
      }),
      prisma.quotation.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: QuotationStatus.APPROVED,
          approvedAt: { gte: prevStart, lte: prevEnd },
          ...quotationWhere,
        },
      }),

      // Potential Revenue (Pipeline DRAFT/SENT)
      prisma.quotation.findMany({
        where: {
          status: { in: [QuotationStatus.DRAFT, QuotationStatus.SENT] },
          childVersions: { none: {} },
          createdAt: { lte: end },
          ...quotationWhere,
        },
        select: { totalAmount: true },
      }),
      prisma.quotation.findMany({
        where: {
          status: { in: [QuotationStatus.DRAFT, QuotationStatus.SENT] },
          childVersions: { none: {} },
          createdAt: { lte: prevEnd },
          ...quotationWhere,
        },
        select: { totalAmount: true },
      }),

      // Total Leads (Created in period)
      prisma.lead.count({
        where: {
          createdAt: { gte: start, lte: end },
          ...leadWhere,
        },
      }),
      prisma.lead.count({
        where: {
          createdAt: { gte: prevStart, lte: prevEnd },
          ...leadWhere,
        },
      }),

      // Active Customers (Created in period & active)
      prisma.customer.count({
        where: {
          isActive: true,
          createdAt: { gte: start, lte: end },
          ...customerWhere,
        },
      }),
      prisma.customer.count({
        where: {
          isActive: true,
          createdAt: { gte: prevStart, lte: prevEnd },
          ...customerWhere,
        },
      }),

      // Active Projects (Created up to end, and not completed)
      prisma.project.count({
        where: {
          status: ProjectStatus.ACTIVE,
          createdAt: { lte: end },
          ...projectWhere,
        },
      }),
      prisma.project.count({
        where: {
          status: ProjectStatus.ACTIVE,
          createdAt: { lte: prevEnd },
          ...projectWhere,
        },
      }),

      // Pending Quotations (Created in period, status DRAFT/SENT)
      prisma.quotation.count({
        where: {
          status: { in: [QuotationStatus.DRAFT, QuotationStatus.SENT] },
          createdAt: { gte: start, lte: end },
          ...quotationWhere,
        },
      }),
      prisma.quotation.count({
        where: {
          status: { in: [QuotationStatus.DRAFT, QuotationStatus.SENT] },
          createdAt: { gte: prevStart, lte: prevEnd },
          ...quotationWhere,
        },
      }),

      // Low Stock Products (Current and historical created up to end)
      prisma.product.count({
        where: {
          isActive: true,
          stockQty: { lte: 10 },
          createdAt: { lte: end },
        },
      }),
      prisma.product.count({
        where: {
          isActive: true,
          stockQty: { lte: 10 },
          createdAt: { lte: prevEnd },
        },
      }),

      // Pending Reminders
      prisma.reminder.count({
        where: {
          dueAt: { gte: start, lte: end },
          ...reminderWhere,
        },
      }),
      prisma.reminder.count({
        where: {
          dueAt: { gte: prevStart, lte: prevEnd },
          ...reminderWhere,
        },
      }),
    ]);

    const revCurr = Number(revenueCurrent._sum.totalAmount || 0);
    const revPrev = Number(revenuePrev._sum.totalAmount || 0);

    const potCurr = potentialQuotesCurrent.reduce((sum, q) => sum + Number(q.totalAmount), 0);
    const potPrev = potentialQuotesPrev.reduce((sum, q) => sum + Number(q.totalAmount), 0);

    const kpiCards = {
      totalRevenue: { current: revCurr, ...this.calculateChangePercent(revCurr, revPrev) },
      potentialRevenue: { current: potCurr, ...this.calculateChangePercent(potCurr, potPrev) },
      totalLeads: { current: leadsCurrent, ...this.calculateChangePercent(leadsCurrent, leadsPrev) },
      activeCustomers: { current: customersCurrent, ...this.calculateChangePercent(customersCurrent, customersPrev) },
      activeProjects: { current: projectsCurrent, ...this.calculateChangePercent(projectsCurrent, projectsPrev) },
      pendingQuotations: { current: pendingQuotesCurrent, ...this.calculateChangePercent(pendingQuotesCurrent, pendingQuotesPrev) },
      lowStockProducts: { current: lowStockProductsCurrent, ...this.calculateChangePercent(lowStockProductsCurrent, lowStockProductsPrev) },
      pendingReminders: { current: pendingRemindersCurrent, ...this.calculateChangePercent(pendingRemindersCurrent, pendingRemindersPrev) },
    };

    // --- SALES ANALYTICS ---
    const salesQuotes = await prisma.quotation.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        ...quotationWhere,
      },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        approvedAt: true,
        phase: true,
      },
    });

    const approvedSales = salesQuotes.filter(q => q.status === QuotationStatus.APPROVED);
    const quotationsCreated = salesQuotes.length;
    const quotationsApproved = approvedSales.length;
    const quotationsRejected = salesQuotes.filter(q => q.status === QuotationStatus.REJECTED).length;

    const conversionRate = quotationsCreated === 0 ? 0 : Number(((quotationsApproved / quotationsCreated) * 100).toFixed(1));
    const totalSalesAmount = salesQuotes.reduce((sum, q) => sum + Number(q.totalAmount), 0);
    const averageQuotationValue = quotationsCreated === 0 ? 0 : Number((totalSalesAmount / quotationsCreated).toFixed(2));

    // Revenue Trend (Daily / Monthly)
    const trendMap = new Map<string, number>();
    approvedSales.forEach(q => {
      const dateKey = (q.approvedAt || q.createdAt).toISOString().split("T")[0];
      trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + Number(q.totalAmount));
    });
    const revenueTrend = Array.from(trendMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Revenue by Project Phase
    const phaseRevMap = new Map<ProjectPhase, number>();
    approvedSales.forEach(q => {
      if (q.phase) {
        phaseRevMap.set(q.phase, (phaseRevMap.get(q.phase) || 0) + Number(q.totalAmount));
      }
    });
    const revenueByProjectPhase = Object.values(ProjectPhase).map(phase => ({
      phase,
      revenue: phaseRevMap.get(phase) || 0,
    }));

    // Monthly Sales Chart (Last 12 months)
    const monthlySales: Array<{ month: string; revenue: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toLocaleString("default", { month: "short", year: "2-digit" });
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const mQuotes = await prisma.quotation.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: QuotationStatus.APPROVED,
          approvedAt: { gte: mStart, lte: mEnd },
          ...quotationWhere,
        },
      });
      monthlySales.push({
        month: monthStr,
        revenue: Number(mQuotes._sum.totalAmount || 0),
      });
    }

    const salesAnalytics = {
      revenueTrend,
      quotationsCreated,
      quotationsApproved,
      quotationsRejected,
      conversionRate,
      averageQuotationValue,
      revenueByProjectPhase,
      monthlySales,
    };

    // --- LEAD ANALYTICS ---
    const leads = await prisma.lead.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        ...leadWhere,
      },
    });

    const newLeads = leads.length;
    const contacted = leads.filter(l => l.status === LeadStatus.CONTACTED).length;
    const notResponding = leads.filter(l => l.status === LeadStatus.NOT_RESPONDING).length;
    const quotationSent = leads.filter(l => l.status === LeadStatus.QUOTATION_SENT).length;
    const negotiation = leads.filter(l => l.status === LeadStatus.NEGOTIATION).length;
    const won = leads.filter(l => l.status === LeadStatus.WON).length;
    const lost = leads.filter(l => l.status === LeadStatus.LOST).length;

    const leadConversionRate = newLeads === 0 ? 0 : Number(((won / newLeads) * 100).toFixed(1));

    const sourceMap = new Map<string, number>();
    leads.forEach(l => {
      const src = l.source || "Unknown";
      sourceMap.set(src, (sourceMap.get(src) || 0) + 1);
    });
    const leadSourceDistribution = Array.from(sourceMap.entries()).map(([source, count]) => ({
      source,
      count,
    }));

    const wonLeadsWithConversionTime = leads.filter(l => l.status === LeadStatus.WON && l.convertedAt);
    const averageTimeToConvert =
      wonLeadsWithConversionTime.length === 0
        ? 0
        : Number(
            (
              wonLeadsWithConversionTime.reduce(
                (sum, l) => sum + (l.convertedAt!.getTime() - l.createdAt.getTime()),
                0
              ) /
              wonLeadsWithConversionTime.length /
              (1000 * 60 * 60)
            ).toFixed(1)
          ); // in hours

    const leadAnalytics = {
      newLeads,
      contacted,
      notResponding,
      quotationSent,
      negotiation,
      won,
      lost,
      leadConversionRate,
      leadSourceDistribution,
      averageTimeToConvert,
    };

    // --- PROJECT & PIPELINE ANALYTICS ---
    const activeProjectsList = await prisma.project.findMany({
      where: {
        status: ProjectStatus.ACTIVE,
        createdAt: { lte: end },
        ...projectWhere,
      },
      include: {
        quotations: {
          where: { childVersions: { none: {} } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const completedProjectsCount = await prisma.project.count({
      where: {
        status: ProjectStatus.COMPLETED,
        updatedAt: { gte: start, lte: end },
        ...projectWhere,
      },
    });

    const phaseCountMap = new Map<ProjectPhase, number>();
    activeProjectsList.forEach(p => {
      phaseCountMap.set(p.currentPhase, (phaseCountMap.get(p.currentPhase) || 0) + 1);
    });

    const projectsByPhase = Object.values(ProjectPhase).map(phase => ({
      phase,
      count: phaseCountMap.get(phase) || 0,
    }));

    // Pipeline Value by Phase using latest quotations belonging to that phase
    const phasePipeMap = new Map<ProjectPhase, number>();
    const allLatestQuotesForPipeline = await prisma.quotation.findMany({
      where: {
        status: { in: [QuotationStatus.DRAFT, QuotationStatus.SENT, QuotationStatus.APPROVED] },
        childVersions: { none: {} },
        projectId: { not: null },
        phase: { not: null },
        createdAt: { lte: end },
        ...quotationWhere,
      },
      select: {
        projectId: true,
        phase: true,
        totalAmount: true,
      },
    });

    // Group latest quotation for each unique (projectId, phase) combination
    const uniquePhaseQuotes = new Map<string, number>();
    allLatestQuotesForPipeline.forEach(q => {
      const key = `${q.projectId}_${q.phase}`;
      // Since they are ordered or we just want to ensure we take the latest,
      // but findMany with none childVersions already returns the latest leaf node.
      uniquePhaseQuotes.set(key, Number(q.totalAmount));
    });

    uniquePhaseQuotes.forEach((amount, key) => {
      const phase = key.split("_")[1] as ProjectPhase;
      phasePipeMap.set(phase, (phasePipeMap.get(phase) || 0) + amount);
    });

    const pipelineValueByPhase = Object.values(ProjectPhase).map(phase => ({
      phase,
      pipelineValue: phasePipeMap.get(phase) || 0,
    }));

    const totalActiveProjects = activeProjectsList.length;
    const phaseDistribution = projectsByPhase.map(p => ({
      phase: p.phase,
      percentage: totalActiveProjects === 0 ? 0 : Number(((p.count / totalActiveProjects) * 100).toFixed(1)),
    }));

    const budgets = activeProjectsList.map(p => Number(p.estimatedBudget || 0)).filter(b => b > 0);
    const averageProjectValue = budgets.length === 0 ? 0 : Number((budgets.reduce((sum, b) => sum + b, 0) / budgets.length).toFixed(2));

    const projectAnalytics = {
      activeProjects: totalActiveProjects,
      completedProjects: completedProjectsCount,
      projectsByPhase,
      pipelineValueByPhase,
      phaseDistribution,
      averageProjectValue,
      currentPhaseWorkload: projectsByPhase, // active count by phase represents workload
    };

    // --- INVENTORY ANALYTICS ---
    const totalProducts = await prisma.product.count({ where: { isActive: true } });
    const productsForValuation = await prisma.product.findMany({
      where: { isActive: true },
      select: { stockQty: true, costPrice: true },
    });
    const currentInventoryValue = productsForValuation.reduce((sum, p) => sum + p.stockQty * Number(p.costPrice), 0);

    const lowStockProductsCount = await prisma.product.count({
      where: { isActive: true, stockQty: { lte: 10 } },
    });
    const outOfStockProductsCount = await prisma.product.count({
      where: { isActive: true, stockQty: 0 },
    });

    // Top Selling Products: query approved quotations items
    const topSellingItems = await prisma.quotationItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, totalPrice: true },
      where: {
        quotation: {
          status: QuotationStatus.APPROVED,
          approvedAt: { gte: start, lte: end },
        },
      },
      orderBy: {
        _sum: { quantity: "desc" },
      },
      take: 5,
    });

    const highestSellingProducts = await Promise.all(
      topSellingItems.map(async item => {
        const prod = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, sku: true },
        });
        return {
          id: item.productId,
          sku: prod?.sku || "",
          name: prod?.name || "",
          quantitySold: item._sum.quantity || 0,
          revenue: Number(item._sum.totalPrice || 0),
        };
      })
    );

    const recentlyAddedProducts = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        sku: true,
        name: true,
        costPrice: true,
        stockQty: true,
        createdAt: true,
      },
    });

    const recentlyAddedProductsFormatted = recentlyAddedProducts.map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      costPrice: Number(p.costPrice),
      stockQty: p.stockQty,
      createdAt: p.createdAt,
    }));

    // Mock stock movement for UI preparation (since there's no StockMovement table)
    const stockMovement = {
      added: 124,
      removed: 48,
      trend: "up" as const,
      history: [
        { date: new Date(now.getTime() - 2 * 3600000).toISOString(), type: "ADDED" as const, qty: 50, productName: "Finolex 1.5sqmm Wire" },
        { date: new Date(now.getTime() - 5 * 3600000).toISOString(), type: "REMOVED" as const, qty: 10, productName: "Legrand 16A Switch" },
        { date: new Date(now.getTime() - 24 * 3600000).toISOString(), type: "ADDED" as const, qty: 74, productName: "Schneider Distribution Board" },
        { date: new Date(now.getTime() - 28 * 3600000).toISOString(), type: "REMOVED" as const, qty: 38, productName: "Havells 1200mm Fan" },
      ],
    };

    const inventoryAnalytics = {
      totalProducts,
      currentInventoryValue,
      lowStockProductsCount,
      outOfStockProductsCount,
      highestSellingProducts,
      recentlyAddedProducts: recentlyAddedProductsFormatted,
      stockMovement,
    };

    // --- EMPLOYEE PERFORMANCE (OWNER ONLY) ---
    let employeePerformance;
    if (isOwner) {
      const salesmen = await prisma.user.findMany({ where: { role: UserRole.SALESMAN, isActive: true } });
      const accountants = await prisma.user.findMany({ where: { role: UserRole.ACCOUNTANT, isActive: true } });
      const attendants = await prisma.user.findMany({ where: { role: UserRole.ATTENDANT, isActive: true } });

      const salesmanPerformance = await Promise.all(
        salesmen.map(async (s, index) => {
          const [leadsAssigned, leadsWon, leadsLost, activeProj, approvedQuotes, remindersPending, tasksPending] =
            await Promise.all([
              prisma.lead.count({ where: { assignedToId: s.id } }),
              prisma.lead.count({ where: { assignedToId: s.id, status: LeadStatus.WON } }),
              prisma.lead.count({ where: { assignedToId: s.id, status: LeadStatus.LOST } }),
              prisma.project.count({ where: { assignedToId: s.id, status: ProjectStatus.ACTIVE } }),
              prisma.quotation.aggregate({
                _sum: { totalAmount: true },
                where: { createdById: s.id, status: QuotationStatus.APPROVED },
              }),
              prisma.reminder.count({ where: { userId: s.id, status: ReminderStatus.PENDING } }),
              prisma.task.count({ where: { assignedToId: s.id, status: TaskStatus.PENDING } }),
            ]);

          const convRate = leadsAssigned === 0 ? 0 : Number(((leadsWon / leadsAssigned) * 100).toFixed(1));
          const revGen = Number(approvedQuotes._sum.totalAmount || 0);

          return {
            id: s.id,
            name: s.name,
            email: s.email,
            assignedLeads: leadsAssigned,
            wonLeads: leadsWon,
            lostLeads: leadsLost,
            conversionRate: convRate,
            activeProjects: activeProj,
            revenueGenerated: revGen,
            pendingFollowUps: remindersPending,
            pendingTasks: tasksPending,
            rank: index + 1, // rank computed post-sorting
          };
        })
      );

      // Sort salesmen by won leads & revenue to set ranks
      salesmanPerformance.sort((a, b) => b.revenueGenerated - a.revenueGenerated || b.wonLeads - a.wonLeads);
      salesmanPerformance.forEach((s, idx) => {
        s.rank = idx + 1;
      });

      // Rankings
      const topPerformer = salesmanPerformance.length > 0 ? salesmanPerformance[0].name : null;
      const highestRevenue = salesmanPerformance.length > 0 ? salesmanPerformance[0].name : null;

      const highestConvSalesman = [...salesmanPerformance].sort((a, b) => b.conversionRate - a.conversionRate);
      const highestConversion = highestConvSalesman.length > 0 ? highestConvSalesman[0].name : null;

      const mostActiveSalesman = [...salesmanPerformance].sort((a, b) => b.activeProjects - a.activeProjects || b.assignedLeads - a.assignedLeads);
      const mostActive = mostActiveSalesman.length > 0 ? mostActiveSalesman[0].name : null;

      const accountantPerformance = await Promise.all(
        accountants.map(async a => {
          const [processedCount, approvedQuotes, pendingCount] = await Promise.all([
            prisma.quotation.count({
              where: {
                createdById: a.id,
                status: { in: [QuotationStatus.APPROVED, QuotationStatus.REJECTED, QuotationStatus.SENT] },
              },
            }),
            prisma.quotation.findMany({
              where: {
                createdById: a.id,
                status: QuotationStatus.APPROVED,
                approvedAt: { not: null },
              },
              select: { createdAt: true, approvedAt: true },
            }),
            prisma.quotation.count({
              where: { createdById: a.id, status: QuotationStatus.DRAFT },
            }),
          ]);

          const totalHours = approvedQuotes.reduce((sum, q) => {
            return sum + (q.approvedAt!.getTime() - q.createdAt.getTime()) / (1000 * 60 * 60);
          }, 0);

          const avgTime = approvedQuotes.length === 0 ? 0 : Number((totalHours / approvedQuotes.length).toFixed(1));

          return {
            id: a.id,
            name: a.name,
            email: a.email,
            quotationsProcessed: processedCount,
            averageProcessingTime: avgTime,
            pendingQuotations: pendingCount,
          };
        })
      );

      const attendantPerformance = await Promise.all(
        attendants.map(async att => {
          const [assigned, completed, pending] = await Promise.all([
            prisma.task.count({ where: { assignedToId: att.id } }),
            prisma.task.count({ where: { assignedToId: att.id, status: TaskStatus.COMPLETED } }),
            prisma.task.count({ where: { assignedToId: att.id, status: TaskStatus.PENDING } }),
          ]);
          return {
            id: att.id,
            name: att.name,
            email: att.email,
            assignedTasks: assigned,
            completedTasks: completed,
            pendingTasks: pending,
          };
        })
      );

      employeePerformance = {
        salesmanPerformance,
        rankings: { topPerformer, highestRevenue, highestConversion, mostActive },
        accountantPerformance,
        attendantPerformance,
      };
    }

    // --- UPCOMING WORK ---
    const upcomingReminders = await prisma.reminder.findMany({
      where: { dueAt: { gte: now }, ...reminderWhere },
      orderBy: { dueAt: "asc" },
      take: 5,
    });

    const upcomingTasks = await prisma.task.findMany({
      where: {
        status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
        dueAt: { gte: now },
        ...taskWhere,
      },
      orderBy: { dueAt: "asc" },
      take: 5,
    });

    const overdueTasks = await prisma.task.findMany({
      where: {
        status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
        dueAt: { lt: now },
        ...taskWhere,
      },
      orderBy: { dueAt: "asc" },
      take: 5,
    });

    const overdueFollowUps = await prisma.reminder.findMany({
      where: {
        dueAt: { lt: now },
        ...reminderWhere,
      },
      orderBy: { dueAt: "asc" },
      take: 5,
    });

    // Today's schedule
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [todayReminders, todayTasks] = await Promise.all([
      prisma.reminder.findMany({
        where: { dueAt: { gte: startOfToday, lte: endOfToday }, ...reminderWhere },
        select: { id: true, title: true, dueAt: true, priority: true, status: true, leadId: true, projectId: true },
      }),
      prisma.task.findMany({
        where: { dueAt: { gte: startOfToday, lte: endOfToday }, ...taskWhere },
        select: { id: true, title: true, dueAt: true, priority: true, status: true, leadId: true, projectId: true },
      }),
    ]);

    const todaySchedule = [
      ...todayReminders.map(r => ({
        id: r.id,
        type: "reminder" as const,
        title: r.title,
        dueAt: r.dueAt,
        priority: r.priority,
        status: r.status,
        link: r.projectId ? `/projects/${r.projectId}` : r.leadId ? `/leads/${r.leadId}` : `/reminders`,
      })),
      ...todayTasks.map(t => ({
        id: t.id,
        type: "task" as const,
        title: t.title,
        dueAt: t.dueAt || new Date(),
        priority: t.priority,
        status: t.status,
        link: t.projectId ? `/projects/${t.projectId}` : t.leadId ? `/leads/${t.leadId}` : `/tasks`,
      })),
    ].sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());

    const upcomingWork = {
      upcomingReminders,
      upcomingTasks,
      overdueTasks,
      overdueFollowUps,
      todaySchedule,
    };

    // --- RECENT ACTIVITY FEED ---
    // Fetch Lead, Project, and Customer activities
    const [leadActs, projActs, custActs] = await Promise.all([
      prisma.leadActivity.findMany({
        where: leadActivityWhere,
        orderBy: { createdAt: "desc" },
        take: 15,
        include: { user: { select: { name: true } } },
      }),
      prisma.projectActivity.findMany({
        where: projectActivityWhere,
        orderBy: { createdAt: "desc" },
        take: 15,
        include: { user: { select: { name: true } } },
      }),
      prisma.customerActivity.findMany({
        where: customerActivityWhere,
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
    ]);

    const recentActivityFeed = [
      ...leadActs.map(a => ({
        id: a.id,
        type: a.type,
        message: a.message,
        createdAt: a.createdAt,
        module: "lead" as const,
        userId: a.userId,
        userName: a.user?.name || null,
      })),
      ...projActs.map(a => ({
        id: a.id,
        type: a.type,
        message: a.message,
        createdAt: a.createdAt,
        module: "project" as const,
        userId: a.userId,
        userName: a.user?.name || null,
      })),
      ...custActs.map(a => ({
        id: a.id,
        type: a.type,
        message: a.message,
        createdAt: a.createdAt,
        module: "customer" as const,
        userId: null,
        userName: null,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 15);

    return {
      kpiCards,
      salesAnalytics,
      leadAnalytics,
      projectAnalytics,
      inventoryAnalytics,
      employeePerformance,
      upcomingWork,
      recentActivityFeed,
    };
  }

  private static getDateRange(
    period: string,
    startDateStr?: string,
    endDateStr?: string
  ) {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (period === "today") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (period === "this_week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (period === "this_month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === "this_year") {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (period === "custom" && startDateStr && endDateStr) {
      start = new Date(startDateStr);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDateStr);
      end.setHours(23, 59, 59, 999);
    } else {
      // default: this month
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Previous period
    let prevStart = new Date(start);
    let prevEnd = new Date(end);

    if (period === "today") {
      prevStart.setDate(start.getDate() - 1);
      prevEnd.setDate(end.getDate() - 1);
    } else if (period === "this_week") {
      prevStart.setDate(start.getDate() - 7);
      prevEnd.setDate(end.getDate() - 7);
    } else if (period === "this_month") {
      prevStart = new Date(start.getFullYear(), start.getMonth() - 1, 1, 0, 0, 0, 0);
      prevEnd = new Date(start.getFullYear(), start.getMonth(), 0, 23, 59, 59, 999);
    } else if (period === "this_year") {
      prevStart = new Date(start.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      prevEnd = new Date(start.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    } else {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      prevStart = new Date(start.getTime() - diffTime - 1000);
      prevStart.setHours(0, 0, 0, 0);
      prevEnd = new Date(start.getTime() - 1000);
      prevEnd.setHours(23, 59, 59, 999);
    }

    return { start, end, prevStart, prevEnd };
  }

  private static calculateChangePercent(
    curr: number,
    prev: number
  ): { changePercent: number; trend: "up" | "down" | "neutral" } {
    if (prev === 0) {
      const change = curr > 0 ? 100 : 0;
      return {
        changePercent: change,
        trend: change > 0 ? "up" : "neutral",
      };
    }
    const diff = curr - prev;
    const pct = Number(((diff / prev) * 100).toFixed(1));
    return {
      changePercent: pct,
      trend: pct > 0 ? "up" : pct < 0 ? "down" : "neutral",
    };
  }
}
