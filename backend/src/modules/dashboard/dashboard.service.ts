import { prisma } from "../../config/prisma";
import {
  UserRole,
  ProductCategory,
  OpportunityStatus,
  EnquiryStatus,
  ReminderStatus,
  PaymentStatus,
} from "@prisma/client";

export class DashboardService {
  static async getSummary(
    userId: string,
    role: UserRole,
    period: string = "this_month",
    startDateStr?: string,
    endDateStr?: string
  ) {
    const isOwner = role === UserRole.OWNER;
    const now = new Date();
    
    // Get date range bounds
    const { start, end } = this.getDateRange(period, startDateStr, endDateStr);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (isOwner) {
      // --- OWNER DASHBOARD ---
      const [
        totalEnquiries,
        newEnquiriesToday,
        pendingEnquiries,
        activeOpportunities,
        wonOpportunities,
        lostOpportunities,
        potentialRevenueAgg,
        closedRevenueAgg,
        todayFollowups,
        overdueFollowups,
        todayQuotations,
        pendingPayments,
      ] = await Promise.all([
        // Total Enquiries
        prisma.enquiry.count({
          where: { createdAt: { gte: start, lte: end } },
        }),
        // New Enquiries Today
        prisma.enquiry.count({
          where: { createdAt: { gte: todayStart, lte: todayEnd } },
        }),
        // Pending Enquiries
        prisma.enquiry.count({
          where: { status: EnquiryStatus.PENDING },
        }),
        // Active Opportunities
        prisma.opportunity.count({
          where: {
            status: { in: [OpportunityStatus.NEW, OpportunityStatus.CONTACTED, OpportunityStatus.QUOTATION_SENT, OpportunityStatus.NEGOTIATION] },
            isActive: true,
          },
        }),
        // Won Opportunities
        prisma.opportunity.count({
          where: { status: OpportunityStatus.WON, isActive: true, updatedAt: { gte: start, lte: end } },
        }),
        // Lost Opportunities
        prisma.opportunity.count({
          where: { status: OpportunityStatus.LOST, isActive: true, updatedAt: { gte: start, lte: end } },
        }),
        // Potential Revenue (Active Opportunities)
        prisma.opportunity.aggregate({
          _sum: { estimatedValue: true },
          where: {
            status: { in: [OpportunityStatus.NEW, OpportunityStatus.CONTACTED, OpportunityStatus.QUOTATION_SENT, OpportunityStatus.NEGOTIATION] },
            isActive: true,
          },
        }),
        // Closed Revenue (Won Opportunities)
        prisma.opportunity.aggregate({
          _sum: { estimatedValue: true },
          where: {
            status: OpportunityStatus.WON,
            isActive: true,
            updatedAt: { gte: start, lte: end },
          },
        }),
        // Today's Follow-ups
        prisma.reminder.count({
          where: {
            dueAt: { gte: todayStart, lte: todayEnd },
            status: ReminderStatus.PENDING,
          },
        }),
        // Overdue Follow-ups
        prisma.reminder.count({
          where: {
            dueAt: { lt: todayStart },
            status: ReminderStatus.PENDING,
          },
        }),
        // Today's Quotations
        prisma.quotation.count({
          where: { createdAt: { gte: todayStart, lte: todayEnd } },
        }),
        // Pending Payments
        prisma.payment.count({
          where: {
            status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIALLY_PAID, PaymentStatus.OVERDUE] },
          },
        }),
      ]);

      // Charts data
      // 1. Revenue by Category
      const revenueByCategoryGroup = await prisma.opportunity.groupBy({
        by: ["category"],
        _sum: { estimatedValue: true },
        where: {
          status: OpportunityStatus.WON,
          isActive: true,
          updatedAt: { gte: start, lte: end },
        },
      });
      const revenueByCategory = revenueByCategoryGroup.map((item) => ({
        category: item.category,
        revenue: Number(item._sum.estimatedValue || 0),
      }));

      // 2. Enquiry Source Distribution
      const enquirySourceGroup = await prisma.enquiry.groupBy({
        by: ["source"],
        _count: { id: true },
        where: { createdAt: { gte: start, lte: end } },
      });
      const enquirySourceDistribution = enquirySourceGroup.map((item) => ({
        source: item.source,
        count: item._count.id,
      }));

      // 3. Category-wise Sales (Count of Won Opportunities)
      const categorySalesGroup = await prisma.opportunity.groupBy({
        by: ["category"],
        _count: { id: true },
        where: {
          status: OpportunityStatus.WON,
          isActive: true,
          updatedAt: { gte: start, lte: end },
        },
      });
      const categoryWiseSales = categorySalesGroup.map((item) => ({
        category: item.category,
        sales: item._count.id,
      }));

      // 4. Monthly Revenue (Won opportunities grouped by month)
      const wonOppsInYear = await prisma.opportunity.findMany({
        where: {
          status: OpportunityStatus.WON,
          isActive: true,
          updatedAt: { gte: new Date(now.getFullYear(), 0, 1) },
        },
        select: {
          updatedAt: true,
          estimatedValue: true,
        },
      });
      const monthlyRevenueMap: Record<string, number> = {};
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      for (const opp of wonOppsInYear) {
        const month = monthNames[opp.updatedAt.getMonth()];
        monthlyRevenueMap[month] = (monthlyRevenueMap[month] || 0) + Number(opp.estimatedValue || 0);
      }
      const monthlyRevenue = monthNames.map((month) => ({
        month,
        revenue: monthlyRevenueMap[month] || 0,
      }));

      // 5. Follow-up Performance
      const [completedFollowups, missedFollowups, pendingFollowups] = await Promise.all([
        prisma.reminder.count({ where: { status: ReminderStatus.COMPLETED, updatedAt: { gte: start, lte: end } } }),
        prisma.reminder.count({ where: { status: ReminderStatus.MISSED } }),
        prisma.reminder.count({ where: { status: ReminderStatus.PENDING } }),
      ]);
      const followupPerformance = {
        completed: completedFollowups,
        missed: missedFollowups,
        pending: pendingFollowups,
      };

      // 6. Opportunity Conversion Rate
      const totalClosed = wonOpportunities + lostOpportunities;
      const opportunityConversionRate = totalClosed > 0 ? Number(((wonOpportunities / totalClosed) * 100).toFixed(1)) : 0;

      return {
        role: "OWNER",
        kpiCards: {
          totalEnquiries,
          newEnquiriesToday,
          pendingEnquiries,
          activeOpportunities,
          wonOpportunities,
          lostOpportunities,
          potentialRevenue: Number(potentialRevenueAgg._sum.estimatedValue || 0),
          closedRevenue: Number(closedRevenueAgg._sum.estimatedValue || 0),
          todayFollowups,
          overdueFollowups,
          todayQuotations,
          pendingPayments,
        },
        charts: {
          opportunityConversionRate,
          revenueByCategory,
          enquirySourceDistribution,
          categoryWiseSales,
          monthlyRevenue,
          followupPerformance,
        },
      };
    } else {
      // --- SALESPERSON DASHBOARD ---
      // 1. Resolve Assigned Categories
      const settings = await prisma.systemSettings.findUnique({
        where: { id: "default" },
      });
      const mappings = (settings?.categorySalesmanAssignment as Record<string, any>) || {};
      const assignedCategories: ProductCategory[] = [];
      for (const [cat, config] of Object.entries(mappings)) {
        if (typeof config === "string") {
          if (config === userId) {
            assignedCategories.push(cat as ProductCategory);
          }
        } else if (config && typeof config === "object") {
          const isPrimary = config.primarySalespersonId === userId;
          const isBackup = config.backupSalespersonId === userId;
          const isAdditional = Array.isArray(config.additionalEditors) && config.additionalEditors.includes(userId);
          if (isPrimary || isBackup || isAdditional) {
            assignedCategories.push(cat as ProductCategory);
          }
        }
      }

      const oppFilters: any = {
        isActive: true,
        OR: [
          { category: { in: assignedCategories } },
          { assignedToId: userId },
        ],
      };

      const [
        todayFollowups,
        yesterdayPendingFollowups,
        newOpportunities,
        quotationPending,
        negotiations,
        wonThisMonth,
        lostThisMonth,
        upcomingReminders,
      ] = await Promise.all([
        // Today's Follow-ups
        prisma.reminder.count({
          where: {
            userId,
            dueAt: { gte: todayStart, lte: todayEnd },
            status: ReminderStatus.PENDING,
          },
        }),
        // Yesterday's Pending Follow-ups (due < today, pending)
        prisma.reminder.count({
          where: {
            userId,
            dueAt: { lt: todayStart },
            status: ReminderStatus.PENDING,
          },
        }),
        // New Opportunities
        prisma.opportunity.count({
          where: {
            ...oppFilters,
            status: OpportunityStatus.NEW,
          },
        }),
        // Quotation Pending (Contacted status usually)
        prisma.opportunity.count({
          where: {
            ...oppFilters,
            status: OpportunityStatus.CONTACTED,
          },
        }),
        // Negotiations
        prisma.opportunity.count({
          where: {
            ...oppFilters,
            status: OpportunityStatus.NEGOTIATION,
          },
        }),
        // Won This Month
        prisma.opportunity.count({
          where: {
            ...oppFilters,
            status: OpportunityStatus.WON,
            updatedAt: { gte: start, lte: end },
          },
        }),
        // Lost This Month
        prisma.opportunity.count({
          where: {
            ...oppFilters,
            status: OpportunityStatus.LOST,
            updatedAt: { gte: start, lte: end },
          },
        }),
        // Upcoming Reminder Suggestions
        prisma.reminder.findMany({
          where: {
            userId,
            status: ReminderStatus.PENDING,
          },
          orderBy: { dueAt: "asc" },
          take: 5,
          include: {
            customer: {
              select: { name: true }
            }
          }
        }),
      ]);

      // My Pipelines & Other Pipelines overview
      const allOpps = await prisma.opportunity.findMany({
        where: { isActive: true },
        select: {
          category: true,
          status: true,
        },
      });

      const pipelineData: Record<string, { active: number; won: number; lost: number; stageCounts: Record<string, number> }> = {};
      const allCategories = ["PIPES", "WIRES", "SWITCHES", "LIGHTS", "FANS", "OTHERS"];
      for (const cat of allCategories) {
        pipelineData[cat] = {
          active: 0,
          won: 0,
          lost: 0,
          stageCounts: {
            NEW: 0,
            CONTACTED: 0,
            QUOTATION_SENT: 0,
            NEGOTIATION: 0,
            WON: 0,
            LOST: 0,
          },
        };
      }

      for (const opp of allOpps) {
        const catStr = opp.category;
        if (!pipelineData[catStr]) continue;
        pipelineData[catStr].stageCounts[opp.status]++;
        if (opp.status === OpportunityStatus.WON) {
          pipelineData[catStr].won++;
        } else if (opp.status === OpportunityStatus.LOST) {
          pipelineData[catStr].lost++;
        } else {
          pipelineData[catStr].active++;
        }
      }

      const myPipelines = assignedCategories.map((cat) => ({
        category: cat,
        ...pipelineData[cat],
      }));

      const otherPipelines = allCategories
        .filter((cat) => !assignedCategories.includes(cat as ProductCategory))
        .map((cat) => ({
          category: cat,
          ...pipelineData[cat],
        }));

      return {
        role: "SALESMAN",
        kpiCards: {
          assignedCategories,
          todayFollowups,
          yesterdayPendingFollowups,
          newOpportunities,
          quotationPending,
          negotiations,
          wonThisMonth,
          lostThisMonth,
          upcomingReminderSuggestions: upcomingReminders,
        },
        myPipelines,
        otherPipelines,
      };
    }
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
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    return { start, end };
  }
}
