import { prisma } from "@/config/prisma";
import {
  UserRole,
  ProjectPhase,
  ProjectStatus,
  LeadStatus,
  QuotationStatus,
  ReminderStatus,
  TaskStatus,
  PaymentStatus,
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
        project: {
          status: ProjectStatus.ACTIVE,
          createdAt: { lte: end },
          ...projectWhere,
        },
      },
      select: {
        projectId: true,
        phase: true,
        totalAmount: true,
        project: {
          select: {
            currentPhase: true,
          },
        },
      },
    });

    // Group latest quotation for each unique (projectId, phase) combination
    const uniquePhaseQuotes = new Map<string, number>();
    allLatestQuotesForPipeline.forEach(q => {
      const key = `${q.projectId}_${q.phase}`;
      // Only include quotation if its phase matches the project's current phase
      if (q.project && q.phase === q.project.currentPhase) {
        uniquePhaseQuotes.set(key, Number(q.totalAmount));
      }
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
              prisma.lead.count({
                where: {
                  assignedToId: s.id,
                  createdAt: { gte: start, lte: end },
                },
              }),
              prisma.lead.count({
                where: {
                  assignedToId: s.id,
                  status: LeadStatus.WON,
                  createdAt: { gte: start, lte: end },
                },
              }),
              prisma.lead.count({
                where: {
                  assignedToId: s.id,
                  status: LeadStatus.LOST,
                  createdAt: { gte: start, lte: end },
                },
              }),
              prisma.project.count({
                where: {
                  assignedToId: s.id,
                  status: ProjectStatus.ACTIVE,
                  createdAt: { gte: start, lte: end },
                },
              }),
              prisma.quotation.aggregate({
                _sum: { totalAmount: true },
                where: {
                  createdById: s.id,
                  status: QuotationStatus.APPROVED,
                  approvedAt: { gte: start, lte: end },
                },
              }),
              prisma.reminder.count({
                where: {
                  userId: s.id,
                  status: ReminderStatus.PENDING,
                  createdAt: { gte: start, lte: end },
                },
              }),
              prisma.task.count({
                where: {
                  assignedToId: s.id,
                  status: TaskStatus.PENDING,
                  createdAt: { gte: start, lte: end },
                },
              }),
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
                 createdAt: { gte: start, lte: end },
               },
             }),
             prisma.quotation.findMany({
               where: {
                 createdById: a.id,
                 status: QuotationStatus.APPROVED,
                 approvedAt: { gte: start, lte: end },
               },
               select: { createdAt: true, approvedAt: true },
             }),
             prisma.quotation.count({
               where: {
                 createdById: a.id,
                 status: QuotationStatus.DRAFT,
                 createdAt: { gte: start, lte: end },
               },
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
             prisma.task.count({
               where: {
                 assignedToId: att.id,
                 createdAt: { gte: start, lte: end },
               },
             }),
             prisma.task.count({
               where: {
                 assignedToId: att.id,
                 status: TaskStatus.COMPLETED,
                 createdAt: { gte: start, lte: end },
               },
             }),
             prisma.task.count({
               where: {
                 assignedToId: att.id,
                 status: TaskStatus.PENDING,
                 createdAt: { gte: start, lte: end },
               },
             }),
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

    // --- PAYMENT ANALYTICS ---
    let paymentAnalytics: Record<string, unknown> = {};

    if (role === UserRole.OWNER) {
      const paymentsAll = await prisma.payment.findMany({
        where: { status: { not: PaymentStatus.CANCELLED } },
        include: {
          customer: { select: { id: true, name: true } },
          collector: { select: { id: true, name: true } },
        },
      });

      const totalRevenueCollected = paymentsAll.reduce((sum, p) => sum + Number(p.amountReceived), 0);
      const outstandingAmount = paymentsAll.reduce((sum, p) => sum + Number(p.pendingAmount), 0);
      const overdueAmount = paymentsAll
        .filter((p) => p.status === PaymentStatus.OVERDUE)
        .reduce((sum, p) => sum + Number(p.pendingAmount), 0);
      const totalBillAmount = paymentsAll.reduce((sum, p) => sum + Number(p.totalBillAmount), 0);
      const collectionRate = totalBillAmount > 0 ? (totalRevenueCollected / totalBillAmount) * 100 : 0;
      const totalBills = paymentsAll.length;
      const pendingCollections = paymentsAll.filter(
        (p) => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.PARTIALLY_PAID
      ).length;

      // Monthly Collections (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const recentTransactions = await prisma.paymentTransaction.findMany({
        where: { date: { gte: sixMonthsAgo }, payment: { status: { not: PaymentStatus.CANCELLED } } },
      });

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthlyCollectionsMap = new Map<string, number>();
      for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        monthlyCollectionsMap.set(key, 0);
      }

      for (const tx of recentTransactions) {
        const m = tx.date.getMonth();
        const y = tx.date.getFullYear();
        const key = `${monthNames[m]} ${y}`;
        if (monthlyCollectionsMap.has(key)) {
          monthlyCollectionsMap.set(key, monthlyCollectionsMap.get(key)! + Number(tx.amount));
        }
      }

      const monthlyCollections = Array.from(monthlyCollectionsMap.entries())
        .map(([month, amount]) => ({ month, amount }))
        .reverse();

      // Top Outstanding Customers
      const customerOutstandingMap = new Map<string, { name: string; outstanding: number }>();
      for (const p of paymentsAll) {
        if (Number(p.pendingAmount) > 0) {
          const prev = customerOutstandingMap.get(p.customerId) || { name: p.customer.name, outstanding: 0 };
          customerOutstandingMap.set(p.customerId, {
            name: p.customer.name,
            outstanding: prev.outstanding + Number(p.pendingAmount),
          });
        }
      }
      const topOutstandingCustomers = Array.from(customerOutstandingMap.entries())
        .map(([customerId, data]) => ({ customerId, name: data.name, outstanding: data.outstanding }))
        .sort((a, b) => b.outstanding - a.outstanding)
        .slice(0, 5);

      // Collector Performance
      const collectorPerformanceMap = new Map<string, { name: string; collected: number; outstanding: number }>();
      for (const p of paymentsAll) {
        const prev = collectorPerformanceMap.get(p.collectorId) || { name: p.collector.name, collected: 0, outstanding: 0 };
        collectorPerformanceMap.set(p.collectorId, {
          name: p.collector.name,
          collected: prev.collected + Number(p.amountReceived),
          outstanding: prev.outstanding + Number(p.pendingAmount),
        });
      }
      const collectorPerformance = Array.from(collectorPerformanceMap.entries()).map(([collectorId, data]) => ({
        collectorId,
        name: data.name,
        collected: data.collected,
        outstanding: data.outstanding,
      }));

      paymentAnalytics = {
        totalRevenueCollected,
        outstandingAmount,
        overdueAmount,
        collectionRate,
        totalBills,
        pendingCollections,
        monthlyCollections,
        topOutstandingCustomers,
        collectorPerformance,
      };
    } else if (role === UserRole.SALESMAN) {
      const myPayments = await prisma.payment.findMany({
        where: { collectorId: userId, status: { not: PaymentStatus.CANCELLED } },
        include: { customer: { select: { id: true, name: true } } },
      });

      const myPendingCollections = myPayments
        .filter(
          (p) =>
            p.status === PaymentStatus.PENDING ||
            p.status === PaymentStatus.PARTIALLY_PAID ||
            p.status === PaymentStatus.OVERDUE
        )
        .reduce((sum, p) => sum + Number(p.pendingAmount), 0);

      const myCollectedAmount = myPayments.reduce((sum, p) => sum + Number(p.amountReceived), 0);

      const myOutstandingCustomersMap = new Map<string, { name: string; outstanding: number }>();
      for (const p of myPayments) {
        if (Number(p.pendingAmount) > 0) {
          const prev = myOutstandingCustomersMap.get(p.customerId) || { name: p.customer.name, outstanding: 0 };
          myOutstandingCustomersMap.set(p.customerId, {
            name: p.customer.name,
            outstanding: prev.outstanding + Number(p.pendingAmount),
          });
        }
      }
      const myOutstandingCustomers = Array.from(myOutstandingCustomersMap.entries())
        .map(([customerId, data]) => ({ customerId, name: data.name, outstanding: data.outstanding }))
        .sort((a, b) => b.outstanding - a.outstanding)
        .slice(0, 5);

      paymentAnalytics = {
        myPendingCollections,
        myCollectedAmount,
        myOutstandingCustomers,
      };
    } else if (role === UserRole.ACCOUNTANT) {
      const paymentsAll = await prisma.payment.findMany({
        where: { status: { not: PaymentStatus.CANCELLED } },
      });

      const billsCreated = paymentsAll.length;
      const pendingCollectionsCount = paymentsAll.filter(
        (p) => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.PARTIALLY_PAID
      ).length;
      const overdueCollectionsCount = paymentsAll.filter((p) => p.status === PaymentStatus.OVERDUE).length;

      const totalTransactionsCount = await prisma.paymentTransaction.count({
        where: { payment: { status: { not: PaymentStatus.CANCELLED } } },
      });

      paymentAnalytics = {
        billsCreated,
        paymentsRecorded: totalTransactionsCount,
        pendingCollections: pendingCollectionsCount,
        overdueCollections: overdueCollectionsCount,
      };
    }

    // --- SALES BY LOCATION ---
    const approvedQuotesForLocation = await prisma.quotation.findMany({
      where: {
        status: QuotationStatus.APPROVED,
        approvedAt: { gte: start, lte: end },
        ...quotationWhere,
      },
      select: {
        id: true,
        totalAmount: true,
        projectId: true,
        customer: { select: { city: true } },
        project: { select: { location: true } },
        lead: { select: { city: true } }
      }
    });

    const locationMap = new Map<string, { totalRevenue: number; totalSales: number; projectIds: Set<string> }>();
    let totalRevenueSum = 0;

    approvedQuotesForLocation.forEach(q => {
      let loc = q.customer?.city || q.project?.location || q.lead?.city || "Unknown";
      loc = loc.trim();
      if (loc) {
        loc = loc.charAt(0).toUpperCase() + loc.slice(1).toLowerCase();
      } else {
        loc = "Unknown";
      }

      const revenue = Number(q.totalAmount);
      totalRevenueSum += revenue;

      const prev = locationMap.get(loc) || { totalRevenue: 0, totalSales: 0, projectIds: new Set<string>() };
      prev.totalRevenue += revenue;
      prev.totalSales += 1;
      if (q.projectId) {
        prev.projectIds.add(q.projectId);
      }
      locationMap.set(loc, prev);
    });

    const salesByLocation = Array.from(locationMap.entries()).map(([location, stats]) => {
      const revenuePercentage = totalRevenueSum === 0 ? 0 : Number(((stats.totalRevenue / totalRevenueSum) * 100).toFixed(1));
      return {
        location,
        totalRevenue: stats.totalRevenue,
        totalSales: stats.totalSales,
        totalProjects: stats.projectIds.size,
        revenuePercentage,
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    // --- BRAND & CATEGORY PRODUCT ANALYTICS ---
    const approvedQuoteItems = await prisma.quotationItem.findMany({
      where: {
        quotation: {
          status: QuotationStatus.APPROVED,
          approvedAt: { gte: start, lte: end },
          ...quotationWhere,
        }
      },
      include: {
        product: {
          select: {
            brand: true,
            category: true,
          }
        }
      }
    });

    const brandMap = new Map<string, { revenue: number; quantity: number; profit: number }>();
    const categoryMap = new Map<string, { revenue: number; quantity: number; profit: number }>();

    approvedQuoteItems.forEach(item => {
      const brand = item.product?.brand || "Unknown";
      const category = item.product?.category || "Unknown";

      const revenue = Number(item.totalPrice);
      const quantity = item.quantity;
      const profit = revenue - (Number(item.costPrice) * quantity);

      // Brand aggregation
      const prevBrand = brandMap.get(brand) || { revenue: 0, quantity: 0, profit: 0 };
      prevBrand.revenue += revenue;
      prevBrand.quantity += quantity;
      prevBrand.profit += profit;
      brandMap.set(brand, prevBrand);

      // Category aggregation
      const prevCategory = categoryMap.get(category) || { revenue: 0, quantity: 0, profit: 0 };
      prevCategory.revenue += revenue;
      prevCategory.quantity += quantity;
      prevCategory.profit += profit;
      categoryMap.set(category, prevCategory);
    });

    const brandList = Array.from(brandMap.entries()).map(([brand, stats]) => ({
      brand,
      revenue: stats.revenue,
      quantity: stats.quantity,
      profit: stats.profit,
    })).sort((a, b) => b.revenue - a.revenue);

    let mostProfitableBrand = null;
    let topSellingBrand = null;
    if (brandList.length > 0) {
      mostProfitableBrand = [...brandList].sort((a, b) => b.profit - a.profit)[0].brand;
      topSellingBrand = [...brandList].sort((a, b) => b.quantity - a.quantity)[0].brand;
    }

    const brandAnalytics = {
      brands: brandList,
      mostProfitableBrand,
      topSellingBrand,
    };

    const categoryList = Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      revenue: stats.revenue,
      quantity: stats.quantity,
      profit: stats.profit,
    })).sort((a, b) => b.revenue - a.revenue);

    let mostProfitableCategory = null;
    let topSellingCategory = null;
    if (categoryList.length > 0) {
      mostProfitableCategory = [...categoryList].sort((a, b) => b.profit - a.profit)[0].category;
      topSellingCategory = [...categoryList].sort((a, b) => b.quantity - a.quantity)[0].category;
    }

    const categoryAnalytics = {
      categories: categoryList,
      mostProfitableCategory,
      topSellingCategory,
    };

    return {
      kpiCards,
      salesAnalytics,
      leadAnalytics,
      projectAnalytics,
      inventoryAnalytics,
      employeePerformance,
      upcomingWork,
      recentActivityFeed,
      paymentAnalytics,
      salesByLocation,
      brandAnalytics,
      categoryAnalytics,
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
