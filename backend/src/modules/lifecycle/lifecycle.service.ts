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

    return prisma.projectPhaseTracking.update({
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
          data.status === LifecycleStatus.COMPLETED ? new Date() : null,
      },
    });
  }
}
