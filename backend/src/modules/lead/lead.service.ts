import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/app-error";
import { LeadStatus, LifecycleStatus, ProjectPhase, Prisma, ReminderPriority } from "@prisma/client";

async function updateLeadNextFollowUp(tx: Prisma.TransactionClient, leadId: string) {
  const nextReminder = await tx.reminder.findFirst({
    where: {
      leadId,
      status: "PENDING",
    },
    orderBy: {
      dueAt: "asc",
    },
  });

  await tx.lead.update({
    where: { id: leadId },
    data: {
      nextFollowUpAt: nextReminder ? nextReminder.dueAt : null,
    },
  });
}

export class LeadService {
  static async create(data: {
    name: string;
    mobile: string;
    email?: string;
    city?: string;
    source?: string;
    notes?: string;
    assignedToId?: string;
  }) {
    const exists = await prisma.lead.findFirst({
      where: {
        mobile: data.mobile,
      },
    });

    if (exists) {
      throw new AppError("Lead already exists", 409);
    }

    return prisma.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data,
      });

      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          type: "CREATED",
          message: "Lead created",
        },
      });

      return lead;
    });
  }

  static async getAll(
    page: number,
    limit: number,
    search?: string,
    filters?: {
      source?: string;
      status?: string;
      assignedToId?: string;
      city?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const skip = (page - 1) * limit;

    const where = {
      isActive: true,
      ...(filters?.source && { source: filters.source }),
      ...(filters?.status && { status: filters.status as LeadStatus }),
      ...(filters?.assignedToId && { assignedToId: filters.assignedToId }),
      ...(filters?.city && {
        city: { contains: filters.city, mode: "insensitive" as const },
      }),
      ...((filters?.dateFrom || filters?.dateTo) && {
        createdAt: {
          ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
          ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
        },
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { mobile: { contains: search } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.lead.count({
        where,
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  static async getById(id: string) {
    const lead = await prisma.lead.findUnique({
      where: {
        id,
        isActive: true,
      },
      include: {
        customer: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
        activities: {
          orderBy: {
            createdAt: "desc",
          },
        },

        notesHistory: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },

        quotations: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!lead) {
      throw new AppError("Lead not found", 404);
    }

    return lead;
  }

  static async convert(
    leadId: string,
    data: {
      projectName: string;
      location?: string;
      estimatedBudget?: number;
    },
  ) {
    const lead = await prisma.lead.findUnique({
      where: {
        id: leadId,
      },
    });

    if (!lead) {
      throw new AppError("Lead not found", 404);
    }

    if (lead.status === LeadStatus.WON) {
      throw new AppError("Lead already converted", 409);
    }

    const existingCustomer = await prisma.customer.findUnique({
      where: {
        mobile: lead.mobile,
      },
    });

    if (existingCustomer) {
      throw new AppError(
        "Customer already exists with this mobile number",
        409,
      );
    }

    return prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          name: lead.name,
          mobile: lead.mobile,
          email: lead.email,
          assignedToId: lead.assignedToId,
          leadId: lead.id,
        },
      });

      await tx.customerActivity.create({
        data: {
          customerId: customer.id,
          type: "CREATED",
          message: "Customer created from lead conversion",
        },
      });

      const project = await tx.project.create({
        data: {
          customerId: customer.id,
          projectName: data.projectName,
          location: data.location,
          estimatedBudget: data.estimatedBudget,
          assignedToId: lead.assignedToId,
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId: project.id,
          type: "CREATED",
          message: "Project created from lead conversion",
        },
      });

      await tx.projectPhaseTracking.createMany({
        data: Object.values(ProjectPhase).map((phase) => ({
          projectId: project.id,
          phase,
          status: LifecycleStatus.NOT_STARTED,
        })),
      });

      await tx.lead.update({
        where: {
          id: lead.id,
        },
        data: {
          status: LeadStatus.WON,
          convertedAt: new Date(),
        },
      });

      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          type: "CONVERTED",
          message: "Lead converted to customer",
          metadata: {
            customerId: customer.id,
            projectId: project.id,
          },
        },
      });

      return {
        customer,
        project,
      };
    });
  }

  static async update(
    id: string,
    userId: string,
    data: {
      name?: string;
      mobile?: string;
      email?: string | null;
      city?: string | null;
      source?: string | null;
      notes?: string | null;
      assignedToId?: string | null;
      status?: LeadStatus;
      nextFollowUpAt?: string | null;
      reason?: string;
      followUp?: {
        title?: string;
        description?: string;
        priority?: ReminderPriority;
        dueAt: Date | string;
      };
      followUpDate?: Date | string;
    },
  ) {
    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      throw new AppError("Lead not found", 404);
    }

    if (data.mobile && data.mobile !== lead.mobile) {
      const exists = await prisma.lead.findFirst({
        where: {
          mobile: data.mobile,
          NOT: {
            id,
          },
        },
      });

      if (exists) {
        throw new AppError("Mobile already exists", 409);
      }
    }

    const updateData: any = {
      name: data.name,
      mobile: data.mobile,
      email: data.email,
      city: data.city,
      source: data.source,
      assignedToId: data.assignedToId,
    };

    const isStatusChanged = data.status && data.status !== lead.status;
    const targetStatus = data.status;

    return prisma.$transaction(async (tx) => {
      if (isStatusChanged) {
        updateData.status = targetStatus;

        if (targetStatus === "CONTACTED") {
          if (!data.notes || data.notes.trim() === "") {
            throw new AppError("Notes are required when status is CONTACTED", 400);
          }

          await tx.leadNote.create({
            data: {
              leadId: lead.id,
              userId,
              note: data.notes,
            },
          });

          updateData.lastContactedAt = new Date();

          await tx.leadActivity.create({
            data: {
              leadId: lead.id,
              userId,
              type: "STATUS_CHANGED",
              message: `Status changed from ${lead.status} to CONTACTED`,
              metadata: { oldStatus: lead.status, newStatus: "CONTACTED" },
            },
          });

          await tx.leadActivity.create({
            data: {
              leadId: lead.id,
              userId,
              type: "NOTE_ADDED",
              message: "Note added",
            },
          });

          if (data.followUp) {
            const reminder = await tx.reminder.create({
              data: {
                title: data.followUp.title ?? `Follow up with ${lead.name}`,
                description: data.followUp.description,
                type: "LEAD",
                priority: data.followUp.priority ?? "MEDIUM",
                dueAt: new Date(data.followUp.dueAt),
                userId,
                leadId: lead.id,
              },
            });
            await updateLeadNextFollowUp(tx, lead.id);

            await tx.leadActivity.create({
              data: {
                leadId: lead.id,
                userId,
                type: "FOLLOW_UP_SET",
                message: `Reminder created: ${reminder.title}`,
              },
            });
          }
        }

        else if (targetStatus === "NOT_RESPONDING") {
          const rawDueAt = data.followUpDate || data.followUp?.dueAt;
          if (!rawDueAt) {
            throw new AppError("Follow-up date is required when status is NOT_RESPONDING", 400);
          }
          const dueAt = new Date(rawDueAt);

          const reminder = await tx.reminder.create({
            data: {
              title: data.followUp?.title ?? `Follow up with ${lead.name} (Not Responding)`,
              description: data.followUp?.description,
              type: "LEAD",
              priority: data.followUp?.priority ?? "MEDIUM",
              dueAt,
              userId,
              leadId: lead.id,
            },
          });
          await updateLeadNextFollowUp(tx, lead.id);

          if (data.notes && data.notes.trim() !== "") {
            await tx.leadNote.create({
              data: {
                leadId: lead.id,
                userId,
                note: data.notes,
              },
            });

            await tx.leadActivity.create({
              data: {
                leadId: lead.id,
                userId,
                type: "NOTE_ADDED",
                message: "Note added",
              },
            });
          }

          await tx.leadActivity.create({
            data: {
              leadId: lead.id,
              userId,
              type: "STATUS_CHANGED",
              message: `Status changed from ${lead.status} to NOT_RESPONDING`,
              metadata: { oldStatus: lead.status, newStatus: "NOT_RESPONDING" },
            },
          });

          await tx.leadActivity.create({
            data: {
              leadId: lead.id,
              userId,
              type: "FOLLOW_UP_SET",
              message: `Reminder created: ${reminder.title}`,
            },
          });
        }

        else if (targetStatus === "QUOTATION_SENT") {
          throw new AppError("Cannot change status to QUOTATION_SENT directly. Please create a quotation instead.", 400);
        }

        else if (targetStatus === "NEGOTIATION") {
          if (!data.reason || data.reason.trim() === "") {
            throw new AppError("Reason is required when status is NEGOTIATION", 400);
          }

          await tx.leadActivity.create({
            data: {
              leadId: lead.id,
              userId,
              type: "STATUS_CHANGED",
              message: `Status changed from ${lead.status} to NEGOTIATION. Reason: ${data.reason}`,
              metadata: {
                oldStatus: lead.status,
                newStatus: "NEGOTIATION",
                reason: data.reason,
              },
            },
          });

          if (data.notes && data.notes.trim() !== "") {
            await tx.leadNote.create({
              data: {
                leadId: lead.id,
                userId,
                note: data.notes,
              },
            });

            await tx.leadActivity.create({
              data: {
                leadId: lead.id,
                userId,
                type: "NOTE_ADDED",
                message: "Note added",
              },
            });
          }

          if (data.followUp) {
            const reminder = await tx.reminder.create({
              data: {
                title: data.followUp.title ?? `Follow up with ${lead.name}`,
                description: data.followUp.description,
                type: "LEAD",
                priority: data.followUp.priority ?? "MEDIUM",
                dueAt: new Date(data.followUp.dueAt),
                userId,
                leadId: lead.id,
              },
            });
            await updateLeadNextFollowUp(tx, lead.id);

            await tx.leadActivity.create({
              data: {
                leadId: lead.id,
                userId,
                type: "FOLLOW_UP_SET",
                message: `Reminder created: ${reminder.title}`,
              },
            });
          }
        }

        else if (targetStatus === "LOST") {
          if (!data.reason || data.reason.trim() === "") {
            throw new AppError("Reason is required when status is LOST", 400);
          }

          updateData.lostReason = data.reason;

          await tx.leadActivity.create({
            data: {
              leadId: lead.id,
              userId,
              type: "LOST",
              message: `Lead marked as lost. Reason: ${data.reason}`,
              metadata: {
                oldStatus: lead.status,
                newStatus: "LOST",
                reason: data.reason,
              },
            },
          });

          if (data.notes && data.notes.trim() !== "") {
            await tx.leadNote.create({
              data: {
                leadId: lead.id,
                userId,
                note: data.notes,
              },
            });

            await tx.leadActivity.create({
              data: {
                leadId: lead.id,
                userId,
                type: "NOTE_ADDED",
                message: "Note added",
              },
            });
          }
        }

        else if (targetStatus === "WON") {
          await tx.leadActivity.create({
            data: {
              leadId: lead.id,
              userId,
              type: "STATUS_CHANGED",
              message: `Status changed from ${lead.status} to WON`,
              metadata: { oldStatus: lead.status, newStatus: "WON" },
            },
          });
        }
      }

      else {
        if (data.notes && data.notes.trim() !== "") {
          await tx.leadNote.create({
            data: {
              leadId: lead.id,
              userId,
              note: data.notes,
            },
          });

          await tx.leadActivity.create({
            data: {
              leadId: lead.id,
              userId,
              type: "NOTE_ADDED",
              message: "Note added",
            },
          });
        }

        if (data.followUp) {
          const reminder = await tx.reminder.create({
            data: {
              title: data.followUp.title ?? `Follow up with ${lead.name}`,
              description: data.followUp.description,
              type: "LEAD",
              priority: data.followUp.priority ?? "MEDIUM",
              dueAt: new Date(data.followUp.dueAt),
              userId,
              leadId: lead.id,
            },
          });
          await updateLeadNextFollowUp(tx, lead.id);

          await tx.leadActivity.create({
            data: {
              leadId: lead.id,
              userId,
              type: "FOLLOW_UP_SET",
              message: `Reminder created: ${reminder.title}`,
            },
          });
        }
      }

      const updatedLead = await tx.lead.update({
        where: { id },
        data: updateData,
      });

      return updatedLead;
    });
  }

  static async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [total, notResponding, won, lost, todayFollowUp] = await Promise.all([
      prisma.lead.count({ where: { isActive: true } }),
      prisma.lead.count({ where: { isActive: true, status: "NOT_RESPONDING" } }),
      prisma.lead.count({ where: { isActive: true, status: "WON" } }),
      prisma.lead.count({ where: { isActive: true, status: "LOST" } }),
      prisma.lead.count({
        where: {
          isActive: true,
          nextFollowUpAt: { gte: today, lt: tomorrow },
        },
      }),
    ]);

    return {
      total,
      followUp: notResponding,
      notResponding,
      won,
      lost,
      todayFollowUp,
    };
  }

  static async deactivate(id: string) {
    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      throw new AppError("Lead not found", 404);
    }

    return prisma.lead.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }
}
