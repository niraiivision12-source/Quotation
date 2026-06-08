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
        const incomplete = await prisma_1.prisma.projectPhaseTracking.count({
            where: {
                projectId: phase.projectId,
                status: {
                    not: client_1.LifecycleStatus.COMPLETED,
                },
            },
        });
        await prisma_1.prisma.project.update({
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
exports.LifecycleService = LifecycleService;
//# sourceMappingURL=lifecycle.service.js.map