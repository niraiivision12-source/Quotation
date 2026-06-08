import { prisma } from "@/config/prisma";
import {
  LeadStatus,
  QuotationStatus,
  ReminderStatus,
  UserRole,
} from "@prisma/client";

export class DashboardService {
  static async getSummary(userId: string, role: UserRole) {
    const isOwner = role === UserRole.OWNER;

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
          status: ReminderStatus.PENDING,
        }
      : {
          userId,
          status: ReminderStatus.PENDING,
        };

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
      prisma.customer.count({
        where: customerWhere,
      }),

      prisma.project.count({
        where: projectWhere,
      }),

      prisma.lead.count({
        where: leadWhere,
      }),

      prisma.product.count(),

      prisma.reminder.count({
        where: reminderWhere,
      }),

      prisma.quotation.count({
        where: {
          status: QuotationStatus.APPROVED,
        },
      }),

      prisma.lead.count({
        where: {
          ...leadWhere,
          status: LeadStatus.WON,
        },
      }),

      prisma.project.count({
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
