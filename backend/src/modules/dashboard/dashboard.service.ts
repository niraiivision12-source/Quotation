import { prisma } from "@/config/prisma";
import { LeadStatus, QuotationStatus, ReminderStatus } from "@prisma/client";

export class DashboardService {
  static async getSummary() {
    const [
      totalCustomers,
      totalProjects,
      totalLeads,
      totalProducts,

      pendingReminders,

      approvedQuotations,

      wonLeads,

      completedProjects,
    ] = await Promise.all([
      prisma.customer.count(),

      prisma.project.count(),

      prisma.lead.count(),

      prisma.product.count(),

      prisma.reminder.count({
        where: {
          status: ReminderStatus.PENDING,
        },
      }),

      prisma.quotation.count({
        where: {
          status: QuotationStatus.APPROVED,
        },
      }),

      prisma.lead.count({
        where: {
          status: LeadStatus.WON,
        },
      }),

      prisma.project.count({
        where: {
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
