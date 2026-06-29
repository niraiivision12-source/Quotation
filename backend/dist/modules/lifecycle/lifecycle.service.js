"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifecycleService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("@/config/prisma");
const app_error_1 = require("@/utils/app-error");
class LifecycleService {
    static async getProjectLifecycle(projectId) {
        return prisma_1.prisma.projectPhaseTracking.findMany({
            where: {
                projectId,
            },
            orderBy: {
                createdAt: "asc",
            },
        });
    }
    static async updatePhase(id, data) {
        const phase = await prisma_1.prisma.projectPhaseTracking.findUnique({
            where: {
                id,
            },
        });
        if (!phase) {
            throw new app_error_1.AppError("Phase not found", 404);
        }
        const projectPhases = await prisma_1.prisma.projectPhaseTracking.findMany({
            where: {
                projectId: phase.projectId,
            },
            orderBy: {
                createdAt: "asc",
            },
        });
        const currentIndex = projectPhases.findIndex((p) => p.id === phase.id);
        if (data.status === client_1.LifecycleStatus.COMPLETED) {
            for (let i = 0; i < currentIndex; i++) {
                if (projectPhases[i].status !== client_1.LifecycleStatus.COMPLETED) {
                    throw new app_error_1.AppError("Previous phases must be completed first", 400);
                }
            }
        }
        const updated = await prisma_1.prisma.projectPhaseTracking.update({
            where: {
                id,
            },
            data: {
                status: data.status,
                remarks: data.remarks,
                startedAt: data.status === client_1.LifecycleStatus.IN_PROGRESS && !phase.startedAt
                    ? new Date()
                    : phase.startedAt,
                completedAt: data.status === client_1.LifecycleStatus.COMPLETED
                    ? new Date()
                    : phase.completedAt,
            },
        });
        // Re-fetch all phases after update to determine the new currentPhase
        const allPhases = await prisma_1.prisma.projectPhaseTracking.findMany({
            where: { projectId: phase.projectId },
            orderBy: { createdAt: "asc" },
        });
        const inProgressPhase = allPhases.find((p) => p.status === client_1.LifecycleStatus.IN_PROGRESS);
        const notStartedPhase = allPhases.find((p) => p.status === client_1.LifecycleStatus.NOT_STARTED);
        const allDone = allPhases.every((p) => p.status === client_1.LifecycleStatus.COMPLETED || p.status === client_1.LifecycleStatus.SKIPPED);
        const newCurrentPhase = inProgressPhase?.phase ?? notStartedPhase?.phase ?? allPhases[allPhases.length - 1].phase;
        const projectBefore = await prisma_1.prisma.project.findUnique({
            where: { id: phase.projectId },
        });
        if (projectBefore) {
            const oldPhase = projectBefore.currentPhase;
            const oldStatus = projectBefore.status;
            const newStatus = allDone ? "COMPLETED" : oldStatus;
            await prisma_1.prisma.project.update({
                where: { id: phase.projectId },
                data: {
                    currentPhase: newCurrentPhase,
                    isCompleted: allDone,
                    ...(allDone && { status: "COMPLETED" }),
                },
            });
            if (oldPhase !== newCurrentPhase) {
                await prisma_1.prisma.projectActivity.create({
                    data: {
                        projectId: phase.projectId,
                        type: "PHASE_CHANGED",
                        message: `Project phase changed from ${oldPhase} to ${newCurrentPhase}`,
                    },
                });
                const quotation = await prisma_1.prisma.quotation.findFirst({
                    where: {
                        projectId: phase.projectId,
                        status: { in: ["APPROVED", "SENT", "DRAFT"] },
                    },
                    orderBy: { createdAt: "desc" },
                });
                const val = quotation ? Number(quotation.totalAmount) : 0;
                if (val > 0) {
                    await prisma_1.prisma.projectActivity.create({
                        data: {
                            projectId: phase.projectId,
                            type: "PIPELINE_VALUE_MOVED",
                            message: `Pipeline value of ₹${val.toLocaleString()} moved from ${oldPhase} to ${newCurrentPhase}`,
                        },
                    });
                }
            }
            if (oldStatus !== newStatus) {
                await prisma_1.prisma.projectActivity.create({
                    data: {
                        projectId: phase.projectId,
                        type: "STATUS_CHANGED",
                        message: `Project status changed from ${oldStatus} to ${newStatus}`,
                    },
                });
                await prisma_1.prisma.projectActivity.create({
                    data: {
                        projectId: phase.projectId,
                        type: "CLOSED",
                        message: `Project closed with status ${newStatus}`,
                    },
                });
            }
        }
        return updated;
    }
}
exports.LifecycleService = LifecycleService;
//# sourceMappingURL=lifecycle.service.js.map