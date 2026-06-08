import { LifecycleStatus } from "@prisma/client";

import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/app-error";

export class LifecycleService {
  static async getProjectLifecycle(projectId: string) {
    return prisma.projectPhaseTracking.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  static async updatePhase(
    id: string,
    data: {
      status: LifecycleStatus;
      remarks?: string;
    },
  ) {
    const phase = await prisma.projectPhaseTracking.findUnique({
      where: {
        id,
      },
    });

    if (!phase) {
      throw new AppError("Phase not found", 404);
    }

    const projectPhases = await prisma.projectPhaseTracking.findMany({
      where: {
        projectId: phase.projectId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const currentIndex = projectPhases.findIndex((p) => p.id === phase.id);

    if (data.status === LifecycleStatus.COMPLETED) {
      for (let i = 0; i < currentIndex; i++) {
        if (projectPhases[i].status !== LifecycleStatus.COMPLETED) {
          throw new AppError("Previous phases must be completed first", 400);
        }
      }
    }

    const updated = await prisma.projectPhaseTracking.update({
      where: {
        id,
      },
      data: {
        status: data.status,

        remarks: data.remarks,

        startedAt:
          data.status === LifecycleStatus.IN_PROGRESS && !phase.startedAt
            ? new Date()
            : phase.startedAt,

        completedAt:
          data.status === LifecycleStatus.COMPLETED
            ? new Date()
            : phase.completedAt,
      },
    });

    const incomplete = await prisma.projectPhaseTracking.count({
      where: {
        projectId: phase.projectId,

        status: {
          not: LifecycleStatus.COMPLETED,
        },
      },
    });

    await prisma.project.update({
      where: {
        id: phase.projectId,
      },
      data: {
        isCompleted: incomplete === 0,
      },
    });

    return updated;
  }
}
