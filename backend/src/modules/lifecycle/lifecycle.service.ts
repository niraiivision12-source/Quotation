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

    // Re-fetch all phases after update to determine the new currentPhase
    const allPhases = await prisma.projectPhaseTracking.findMany({
      where: { projectId: phase.projectId },
      orderBy: { createdAt: "asc" },
    });

    const inProgressPhase = allPhases.find((p) => p.status === LifecycleStatus.IN_PROGRESS);
    const notStartedPhase = allPhases.find((p) => p.status === LifecycleStatus.NOT_STARTED);
    const allDone = allPhases.every(
      (p) => p.status === LifecycleStatus.COMPLETED || p.status === LifecycleStatus.SKIPPED,
    );

    const newCurrentPhase = inProgressPhase?.phase ?? notStartedPhase?.phase ?? allPhases[allPhases.length - 1].phase;

    await prisma.project.update({
      where: { id: phase.projectId },
      data: {
        currentPhase: newCurrentPhase,
        isCompleted: allDone,
      },
    });

    return updated;
  }
}
