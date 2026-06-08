"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const prisma_1 = require("@/config/prisma");
const client_1 = require("@prisma/client");
class DashboardService {
    static async getSummary(userId, role) {
        const isOwner = role === client_1.UserRole.OWNER;
        const customerWhere = isOwner
            ? {}
            : {
                assignedToId: userId,
            };
        const projectWhere = isOwner
            ? {}
            : {
                assignedToId: userId,
            };
        const leadWhere = isOwner
            ? {}
            : {
                assignedToId: userId,
            };
        const reminderWhere = isOwner
            ? {
                status: client_1.ReminderStatus.PENDING,
            }
            : {
                userId,
                status: client_1.ReminderStatus.PENDING,
            };
        const [totalCustomers, totalProjects, totalLeads, totalProducts, pendingReminders, approvedQuotations, wonLeads, completedProjects,] = await Promise.all([
            prisma_1.prisma.customer.count({
                where: customerWhere,
            }),
            prisma_1.prisma.project.count({
                where: projectWhere,
            }),
            prisma_1.prisma.lead.count({
                where: leadWhere,
            }),
            prisma_1.prisma.product.count(),
            prisma_1.prisma.reminder.count({
                where: reminderWhere,
            }),
            prisma_1.prisma.quotation.count({
                where: {
                    status: client_1.QuotationStatus.APPROVED,
                },
            }),
            prisma_1.prisma.lead.count({
                where: {
                    ...leadWhere,
                    status: client_1.LeadStatus.WON,
                },
            }),
            prisma_1.prisma.project.count({
                where: {
                    ...projectWhere,
                    isCompleted: true,
                },
            }),
        ]);
        return {
            totalCustomers,
            totalProjects,
            totalLeads,
            totalProducts,
            pendingReminders,
            approvedQuotations,
            wonLeads,
            completedProjects,
        };
    }
}
exports.DashboardService = DashboardService;
//# sourceMappingURL=dashboard.service.js.map