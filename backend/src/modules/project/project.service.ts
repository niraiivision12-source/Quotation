import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/app-error";

import { LifecycleStatus, ProjectPhase, ProjectStatus } from "@prisma/client";

export class ProjectService {
  static async create(data: {
    customerId: string;
    projectName: string;
    location?: string;
    assignedToId?: string;
    estimatedBudget?: number;
    currentPhase?: ProjectPhase;
  }) {
    const customer = await prisma.customer.findUnique({
      where: {
        id: data.customerId,
      },
    });

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    return prisma.$transaction(async (tx) => {
      // Fetch project assignment settings
      let settings = await tx.systemSettings.findUnique({
        where: { id: "default" },
      });

      if (!settings) {
        settings = await tx.systemSettings.create({
          data: {
            id: "default",
            projectAssignmentMethod: "MANUAL",
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

      if (settings.projectAssignmentMethod === "PERCENTAGE") {
        const activeSalesmen = await tx.user.findMany({
          where: { role: "SALESMAN", isActive: true },
          orderBy: { id: "asc" },
        });

        if (activeSalesmen.length === 0) {
          throw new AppError("No active salesmen available for automatic project assignment", 400);
        }

        const percentages = (settings.projectSalesmanPercentages as Record<string, number>) || {};
        const activePercentages = activeSalesmen
          .map((s) => ({
            id: s.id,
            weight: percentages[s.id] || 0,
          }))
          .filter((p) => p.weight > 0);

        if (activePercentages.length === 0) {
          throw new AppError("No active salesmen have a configured assignment percentage for projects", 400);
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
      } else if (assignedToId) {
        // Manual assignment validation
        const salesman = await tx.user.findFirst({
          where: { id: assignedToId, role: "SALESMAN", isActive: true },
        });
        if (!salesman) {
          throw new AppError("The assigned project salesman is inactive or does not exist", 400);
        }
      }

      const project = await tx.project.create({
        data: {
          customerId: data.customerId,
          projectName: data.projectName,
          location: data.location,
          assignedToId,
          estimatedBudget: data.estimatedBudget,
          currentPhase: data.currentPhase || undefined,
        },
      });

      const phases = [
        ProjectPhase.PIPES,
        ProjectPhase.WIRING,
        ProjectPhase.SWITCHES,
        ProjectPhase.LIGHTS,
        ProjectPhase.FANS,
        ProjectPhase.OTHERS,
      ];

      const selectedPhase = data.currentPhase || ProjectPhase.PIPES;
      const selectedIndex = phases.indexOf(selectedPhase);

      const phaseTrackings = [];

      for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        let phaseAssignedToId: string | null = null;

        if (settings.projectAssignmentMethod === "PHASE_BASED") {
          const phaseAssignment = (settings.projectPhaseAssignment as Record<string, string>) || {};
          const salesmanId = phaseAssignment[phase];

          if (!salesmanId) {
            throw new AppError(`No salesman is configured for the project phase: ${phase}`, 400);
          }

          const salesman = await tx.user.findFirst({
            where: { id: salesmanId, role: "SALESMAN", isActive: true },
          });

          if (!salesman) {
            throw new AppError(`The salesman configured for phase ${phase} is inactive or does not exist`, 400);
          }

          phaseAssignedToId = salesmanId;
        }

        let status: LifecycleStatus = LifecycleStatus.NOT_STARTED;
        let startedAt: Date | null = null;
        let completedAt: Date | null = null;

        if (i < selectedIndex) {
          status = LifecycleStatus.COMPLETED;
          startedAt = new Date();
          completedAt = new Date();
        } else if (i === selectedIndex) {
          status = LifecycleStatus.IN_PROGRESS;
          startedAt = new Date();
        }

        phaseTrackings.push({
          projectId: project.id,
          phase,
          status,
          startedAt,
          completedAt,
          assignedToId: phaseAssignedToId,
        });
      }

      await tx.projectPhaseTracking.createMany({
        data: phaseTrackings,
      });

      return project;
    });
  }

  static async getAll(
    page: number,
    limit: number,
    search?: string,
    customerId?: string,
  ) {
    const skip = (page - 1) * limit;

    const where = {
      isActive: true,

      ...(search && {
        projectName: {
          contains: search,
          mode: "insensitive" as const,
        },
      }),

      ...(customerId && {
        customerId,
      }),
    };

    const [items, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
          quotations: {
            select: { id: true, totalAmount: true, status: true, createdAt: true, phase: true },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.project.count({
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
    const project = await prisma.project.findUnique({
      where: {
        id,
        isActive: true,
      },
      include: {
        customer: true,
        phaseTracking: {
          orderBy: { createdAt: "asc" },
        },
        quotations: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            quotationNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            phase: true,
          },
        },
        reminders: {
          where: { status: "PENDING" },
          orderBy: { dueAt: "asc" },
          take: 1,
          select: {
            id: true,
            title: true,
            dueAt: true,
            priority: true,
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            type: true,
            message: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    return project;
  }

  static async update(
    id: string,
    data: {
      projectName?: string;
      location?: string | null;
      assignedToId?: string | null;
      estimatedBudget?: number;
      isCompleted?: boolean;
      status?: ProjectStatus;
      startDate?: Date | null;
      expectedCompletion?: Date | null;
    },
  ) {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const isStatusChanging = data.status && data.status !== project.status;
    const oldStatus = project.status;
    const newStatus = data.status;

    if (data.status) {
      const closedStatuses: ProjectStatus[] = ["COMPLETED", "CLOSED_WITH_SALE", "CLOSED_WITHOUT_SALE", "CANCELLED"];
      data.isCompleted = closedStatuses.includes(data.status);
    }

    const updated = await prisma.project.update({
      where: { id },
      data,
    });

    if (isStatusChanging) {
      await prisma.projectActivity.create({
        data: {
          projectId: id,
          type: "STATUS_CHANGED",
          message: `Project status changed from ${oldStatus} to ${newStatus}`,
        },
      });

      const closedStatuses: ProjectStatus[] = ["COMPLETED", "CLOSED_WITH_SALE", "CLOSED_WITHOUT_SALE", "CANCELLED"];
      const wasActive = ["ACTIVE", "ON_HOLD"].includes(oldStatus);
      const isClosedNow = closedStatuses.includes(newStatus!);

      if (wasActive && isClosedNow) {
        await prisma.projectActivity.create({
          data: {
            projectId: id,
            type: "CLOSED",
            message: `Project closed with status ${newStatus}`,
          },
        });
      }
    }

    return updated;
  }

  static async deactivate(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    return prisma.project.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  static async updatePhase(
    projectId: string,
    newPhase: ProjectPhase,
  ) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        phaseTracking: true,
      },
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    if (project.currentPhase === newPhase) {
      return project;
    }

    const phases = [
      ProjectPhase.PIPES,
      ProjectPhase.WIRING,
      ProjectPhase.SWITCHES,
      ProjectPhase.LIGHTS,
      ProjectPhase.FANS,
      ProjectPhase.OTHERS,
    ];

    const oldPhase = project.currentPhase;
    const newIndex = phases.indexOf(newPhase);

    return prisma.$transaction(async (tx) => {
      // 1. Update Project currentPhase
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: {
          currentPhase: newPhase,
        },
      });

      // 2. Update phase tracking records
      for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        const tracking = project.phaseTracking.find((t) => t.phase === phase);

        if (tracking) {
          let status = tracking.status;
          let startedAt = tracking.startedAt;
          let completedAt = tracking.completedAt;

          if (i < newIndex) {
            // Mark previous phases as COMPLETED
            if (status !== LifecycleStatus.COMPLETED && status !== LifecycleStatus.SKIPPED) {
              status = LifecycleStatus.COMPLETED;
              if (!startedAt) startedAt = new Date();
              completedAt = new Date();
            }
          } else if (i === newIndex) {
            // Mark the new phase as IN_PROGRESS
            status = LifecycleStatus.IN_PROGRESS;
            if (!startedAt) startedAt = new Date();
            completedAt = null;
          } else {
            // Future phases: if they were IN_PROGRESS or COMPLETED, reset them to NOT_STARTED
            if (status === LifecycleStatus.IN_PROGRESS || status === LifecycleStatus.COMPLETED) {
              status = LifecycleStatus.NOT_STARTED;
              startedAt = null;
              completedAt = null;
            }
          }

          await tx.projectPhaseTracking.update({
            where: { id: tracking.id },
            data: {
              status,
              startedAt,
              completedAt,
            },
          });
        }
      }

      // 3. Create ProjectActivity for phase transition
      await tx.projectActivity.create({
        data: {
          projectId,
          type: "PHASE_CHANGED",
          message: `Project phase transitioned from ${oldPhase} to ${newPhase}`,
        },
      });

      // 4. Quotations are bound to their phase permanently, so no pipeline value is moved.

      return updatedProject;
    });
  }

  static async addNote(projectId: string, userId: string, note: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    return prisma.projectActivity.create({
      data: {
        projectId,
        userId,
        type: "NOTE_ADDED",
        message: note,
      },
    });
  }
}
