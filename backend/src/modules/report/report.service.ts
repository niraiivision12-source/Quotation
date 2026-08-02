import { prisma } from "../../config/prisma";
import { OpportunityStatus, QuotationStatus } from "@prisma/client";

function mapProjectPhaseToProductCategory(phase: string): string {
  switch (phase) {
    case "PIPES":
      return "PIPES";
    case "WIRING":
      return "WIRES";
    case "SWITCHES":
      return "SWITCHES";
    case "LIGHTS":
      return "LIGHTS";
    case "FANS":
      return "FANS";
    case "OTHERS":
    default:
      return "OTHERS";
  }
}

export class ReportService {
  static async getSummary(startDateStr?: string, endDateStr?: string) {
    const start = startDateStr ? new Date(startDateStr) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDateStr ? new Date(endDateStr) : new Date();

    const dateFilter = {
      createdAt: {
        gte: start,
        lte: end,
      },
    };

    const [
      wonOpps,
      lostOpps,
      paymentsAgg,
      oppsByStage,
      oppsByCategory,
      approvedQuotes,
    ] = await Promise.all([
      // Won opportunities
      prisma.opportunity.findMany({
        where: {
          status: OpportunityStatus.WON,
          isActive: true,
          updatedAt: { gte: start, lte: end },
        },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          estimatedValue: true,
          category: true,
          customer: { select: { name: true } },
          assignedTo: { select: { name: true } },
        },
      }),
      // Lost opportunities
      prisma.opportunity.findMany({
        where: {
          status: OpportunityStatus.LOST,
          isActive: true,
          updatedAt: { gte: start, lte: end },
        },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      // Payments info
      prisma.payment.aggregate({
        _sum: {
          totalBillAmount: true,
          amountReceived: true,
          pendingAmount: true,
        },
        where: {
          status: { not: "CANCELLED" },
          billDate: { gte: start, lte: end },
        },
      }),
      // Opportunities grouped by stage
      prisma.opportunity.groupBy({
        by: ["status"],
        _count: { id: true },
        where: { isActive: true, ...dateFilter },
      }),
      // Opportunities grouped by category
      prisma.opportunity.groupBy({
        by: ["category"],
        _count: { id: true },
        _sum: { estimatedValue: true },
        where: { isActive: true, ...dateFilter },
      }),
      // Approved quotations in the range
      prisma.quotation.findMany({
        where: {
          status: QuotationStatus.APPROVED,
          OR: [
            { approvedAt: { gte: start, lte: end } },
            {
              approvedAt: null,
              createdAt: { gte: start, lte: end },
            },
          ],
        },
        include: {
          opportunity: true,
        },
      }),
    ]);

    // Conversion rate
    const totalClosed = wonOpps.length + lostOpps.length;
    const salesConversionRate = totalClosed > 0 ? Number(((wonOpps.length / totalClosed) * 100).toFixed(1)) : 0;

    // Invoice values
    const totalInvoiceValue = Number(paymentsAgg._sum.totalBillAmount || 0);
    const amountCollected = Number(paymentsAgg._sum.amountReceived || 0);
    const outstandingCollection = Number(paymentsAgg._sum.pendingAmount || 0);

    // Average Cycle Time in Days
    let totalCycleTimeMs = 0;
    let cycleCount = 0;
    const combine = [...wonOpps, ...lostOpps];
    for (const opp of combine) {
      const duration = opp.updatedAt.getTime() - opp.createdAt.getTime();
      totalCycleTimeMs += duration;
      cycleCount++;
    }
    const averageCycleTimeDays = cycleCount > 0 ? Number((totalCycleTimeMs / (1000 * 60 * 60 * 24) / cycleCount).toFixed(1)) : 0;

    const opportunitiesByStage = oppsByStage.map((o) => ({
      stage: o.status,
      count: o._count.id,
    }));

    const categories = ["PIPES", "WIRES", "SWITCHES", "LIGHTS", "FANS", "OTHERS"];
    const categoryStatsMap: Record<string, { count: number; value: number }> = {};
    for (const cat of categories) {
      categoryStatsMap[cat] = { count: 0, value: 0 };
    }

    for (const o of oppsByCategory) {
      if (categoryStatsMap[o.category]) {
        categoryStatsMap[o.category].count = o._count.id;
      }
    }

    for (const quote of approvedQuotes) {
      let category = quote.opportunity?.category;
      if (!category && quote.phase) {
        category = mapProjectPhaseToProductCategory(quote.phase);
      }
      if (!category) {
        category = "OTHERS";
      }
      if (categoryStatsMap[category]) {
        categoryStatsMap[category].value += Number(quote.totalAmount || 0);
      }
    }

    const opportunitiesByCategory = Object.entries(categoryStatsMap).map(([category, stats]) => ({
      category,
      count: stats.count,
      value: stats.value,
    }));

    return {
      salesConversionRate,
      totalInvoiceValue,
      amountCollected,
      outstandingCollection,
      averageCycleTimeDays,
      opportunitiesByStage,
      opportunitiesByCategory,
      wonOpportunitiesList: wonOpps.map((o) => ({
        id: o.id,
        customerName: o.customer?.name || "Unknown",
        salespersonName: o.assignedTo?.name || "Unassigned",
        category: o.category,
        value: Number(o.estimatedValue || 0),
        closedDate: o.updatedAt,
      })),
      startDate: start,
      endDate: end,
    };
  }
}
