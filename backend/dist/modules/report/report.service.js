"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const prisma_1 = require("../../config/prisma");
const client_1 = require("@prisma/client");
class ReportService {
    static async getSummary(startDateStr, endDateStr) {
        const start = startDateStr ? new Date(startDateStr) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = endDateStr ? new Date(endDateStr) : new Date();
        const dateFilter = {
            createdAt: {
                gte: start,
                lte: end,
            },
        };
        const [wonOpps, lostOpps, paymentsAgg, oppsByStage, oppsByCategory,] = await Promise.all([
            // Won opportunities
            prisma_1.prisma.opportunity.findMany({
                where: {
                    status: client_1.OpportunityStatus.WON,
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
            prisma_1.prisma.opportunity.findMany({
                where: {
                    status: client_1.OpportunityStatus.LOST,
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
            prisma_1.prisma.payment.aggregate({
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
            prisma_1.prisma.opportunity.groupBy({
                by: ["status"],
                _count: { id: true },
                where: { isActive: true, ...dateFilter },
            }),
            // Opportunities grouped by category
            prisma_1.prisma.opportunity.groupBy({
                by: ["category"],
                _count: { id: true },
                _sum: { estimatedValue: true },
                where: { isActive: true, ...dateFilter },
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
        const opportunitiesByCategory = oppsByCategory.map((o) => ({
            category: o.category,
            count: o._count.id,
            value: Number(o._sum.estimatedValue || 0),
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
exports.ReportService = ReportService;
//# sourceMappingURL=report.service.js.map