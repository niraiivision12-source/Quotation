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
      // Fetch assignment settings
      let settings = await tx.systemSettings.findUnique({
        where: { id: "default" },
      });

      if (!settings) {
        // Fallback: seed default settings
        settings = await tx.systemSettings.create({
          data: {
            id: "default",
            leadAssignmentMethod: "MANUAL",
            companyName: "NKP Construction",
            companyGst: "",
            companyAddress: "",
            companyPhone: "",
            companyEmail: "",
            companyWebsite: "",
            bankName: "",
            bankAccountNo: "",
            bankIfsc: "",
            bankBranch: "",
            upiId: "",
            termsAndConditions: "",
            footerText: "",
            rolePermissions: {},
          },
        });
      }

      let assignedToId: string | null = data.assignedToId || null;

      if (settings.leadAssignmentMethod !== "MANUAL") {
        // Fetch active salesmen
        const activeSalesmen = await tx.user.findMany({
          where: {
            role: "SALESMAN",
            isActive: true,
          },
          orderBy: { id: "asc" },
        });

        if (activeSalesmen.length === 0) {
          throw new AppError("No active salesmen available for automatic assignment", 400);
        }

        if (settings.leadAssignmentMethod === "PERCENTAGE") {
          const percentages = (settings.leadSalesmanPercentages as Record<string, number>) || {};
          const activePercentages = activeSalesmen
            .map((s) => ({
              id: s.id,
              weight: percentages[s.id] || 0,
            }))
            .filter((p) => p.weight > 0);

          if (activePercentages.length === 0) {
            throw new AppError("No active salesmen have a configured assignment percentage", 400);
          }

          const totalWeight = activePercentages.reduce((sum, item) => sum + item.weight, 0);
          const randomVal = Math.random() * totalWeight;

          let cumulativeWeight = 0;
          let selectedSalesmanId = activePercentages[0].id;
          for (const item of activePercentages) {
            cumulativeWeight += item.weight;
            if (randomVal <= cumulativeWeight) {
              selectedSalesmanId = item.id;
              break;
            }
          }
          assignedToId = selectedSalesmanId;
        } else if (settings.leadAssignmentMethod === "ROUND_ROBIN") {
          const lastAssignedId = settings.lastLeadAssignedUserId;
          let nextIndex = 0;
          if (lastAssignedId) {
            const index = activeSalesmen.findIndex((s) => s.id === lastAssignedId);
            if (index !== -1) {
              nextIndex = (index + 1) % activeSalesmen.length;
            }
          }
          const selectedSalesman = activeSalesmen[nextIndex];
          assignedToId = selectedSalesman.id;

          // Save last assigned user ID
          await tx.systemSettings.update({
            where: { id: "default" },
            data: {
              lastLeadAssignedUserId: assignedToId,
            },
          });
        }
      } else if (assignedToId) {
        // Manual assignment validation
        const salesman = await tx.user.findFirst({
          where: { id: assignedToId, role: "SALESMAN", isActive: true },
        });
        if (!salesman) {
          throw new AppError("The assigned salesman is inactive or does not exist", 400);
        }
      }

      const lead = await tx.lead.create({
        data: {
          name: data.name,
          mobile: data.mobile,
          email: data.email,
          city: data.city,
          source: data.source,
          notes: data.notes,
          assignedToId,
        },
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
      phase?: string;
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
      ...(filters?.phase && {
        quotations: {
          some: { phase: filters.phase as ProjectPhase },
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
          quotations: {
            select: {
              phase: true,
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
        reminders: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            dueAt: "desc",
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

    const existingCustomerForLead = await prisma.customer.findFirst({
      where: { leadId: lead.id },
    });

    if (existingCustomerForLead) {
      throw new AppError("Lead already converted", 409);
    }

    const existingCustomer = await prisma.customer.findUnique({
      where: { mobile: lead.mobile },
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

    const updateData: Prisma.LeadUncheckedUpdateInput = {
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
          const rawDueAt = data.followUpDate || data.followUp?.dueAt;
          if (!rawDueAt) {
            throw new AppError("Follow-up date & time are required when status is CONTACTED", 400);
          }
          const dueAt = new Date(rawDueAt);

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
              type: "UPDATED",
              message: "Note added",
            },
          });

          const reminder = await tx.reminder.create({
            data: {
              title: data.followUp?.title ?? `Follow up with ${lead.name}`,
              description: data.followUp?.description,
              type: "LEAD",
              priority: data.followUp?.priority ?? "MEDIUM",
              dueAt,
              userId,
              leadId: lead.id,
            },
          });

          updateData.nextFollowUpAt = reminder.dueAt;

          await tx.leadActivity.create({
            data: {
              leadId: lead.id,
              userId,
              type: "REMINDER_CREATED",
              message: `Reminder created: ${reminder.title}`,
            },
          });
        }

        else if (targetStatus === "NOT_RESPONDING") {
          const rawDueAt = data.followUpDate || data.followUp?.dueAt;
          if (!rawDueAt) {
            throw new AppError("Follow-up date & time are required when status is NOT_RESPONDING", 400);
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

          updateData.nextFollowUpAt = reminder.dueAt;

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
                type: "UPDATED",
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
              type: "REMINDER_CREATED",
              message: `Reminder created: ${reminder.title}`,
            },
          });
        }

        else if (targetStatus === "QUOTATION_SENT") {
          throw new AppError("Cannot change status to QUOTATION_SENT directly. Please create a quotation instead.", 400);
        }

        else if (targetStatus === "NEGOTIATION") {
          if (!data.notes || data.notes.trim() === "") {
            throw new AppError("Notes are required when status is NEGOTIATION", 400);
          }
          const rawDueAt = data.followUpDate || data.followUp?.dueAt;
          if (!rawDueAt) {
            throw new AppError("Follow-up date & time are required when status is NEGOTIATION", 400);
          }
          const dueAt = new Date(rawDueAt);

          if (!data.reason || data.reason.trim() === "") {
            throw new AppError("Negotiation reason is required when status is NEGOTIATION", 400);
          }

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
              type: "STATUS_CHANGED",
              message: `Status changed from ${lead.status} to NEGOTIATION. Reason: ${data.reason}`,
              metadata: {
                oldStatus: lead.status,
                newStatus: "NEGOTIATION",
                reason: data.reason,
              },
            },
          });

          await tx.leadActivity.create({
            data: {
              leadId: lead.id,
              userId,
              type: "UPDATED",
              message: "Note added",
            },
          });

          const reminder = await tx.reminder.create({
            data: {
              title: data.followUp?.title ?? `Follow up with ${lead.name} (Negotiation)`,
              description: data.followUp?.description,
              type: "LEAD",
              priority: data.followUp?.priority ?? "MEDIUM",
              dueAt,
              userId,
              leadId: lead.id,
            },
          });

          updateData.nextFollowUpAt = reminder.dueAt;

          await tx.leadActivity.create({
            data: {
              leadId: lead.id,
              userId,
              type: "REMINDER_CREATED",
              message: `Reminder created: ${reminder.title}`,
            },
          });
        }

        else if (targetStatus === "LOST") {
          if (!data.notes || data.notes.trim() === "") {
            throw new AppError("Notes are required when status is LOST", 400);
          }
          const rawDueAt = data.followUpDate || data.followUp?.dueAt;
          if (!rawDueAt) {
            throw new AppError("Follow-up date & time are required when status is LOST", 400);
          }
          const dueAt = new Date(rawDueAt);

          const allowedLostReasons = ["price", "competitor", "cancelled", "budget", "no response", "other"];
          if (!data.reason || !allowedLostReasons.includes(data.reason.toLowerCase())) {
            throw new AppError("Invalid lost reason. Allowed values are: Price, Competitor, Cancelled, Budget, No Response, Other", 400);
          }

          updateData.lostReason = data.reason;

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
              type: "STATUS_CHANGED",
              message: `Lead marked as lost. Reason: ${data.reason}`,
              metadata: {
                oldStatus: lead.status,
                newStatus: "LOST",
                reason: data.reason,
              },
            },
          });

          await tx.leadActivity.create({
            data: {
              leadId: lead.id,
              userId,
              type: "UPDATED",
              message: "Note added",
            },
          });

          const reminder = await tx.reminder.create({
            data: {
              title: data.followUp?.title ?? `Follow up with ${lead.name} (Lost)`,
              description: data.followUp?.description,
              type: "LEAD",
              priority: data.followUp?.priority ?? "MEDIUM",
              dueAt,
              userId,
              leadId: lead.id,
            },
          });

          updateData.nextFollowUpAt = reminder.dueAt;

          await tx.leadActivity.create({
            data: {
              leadId: lead.id,
              userId,
              type: "REMINDER_CREATED",
              message: `Reminder created: ${reminder.title}`,
            },
          });
        }

        else if (targetStatus === "WON") {
          if (!data.notes || data.notes.trim() === "") {
            throw new AppError("Notes are required when status is WON", 400);
          }

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
              type: "STATUS_CHANGED",
              message: `Status changed from ${lead.status} to WON`,
              metadata: { oldStatus: lead.status, newStatus: "WON" },
            },
          });

          await tx.leadActivity.create({
            data: {
              leadId: lead.id,
              userId,
              type: "UPDATED",
              message: "Note added",
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
              type: "UPDATED",
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
              type: "REMINDER_CREATED",
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
