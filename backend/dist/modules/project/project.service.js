"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectService = void 0;
const prisma_1 = require("@/config/prisma");
const app_error_1 = require("@/utils/app-error");
const client_1 = require("@prisma/client");
class ProjectService {
    static async create(data) {
        const customer = await prisma_1.prisma.customer.findUnique({
            where: {
                id: data.customerId,
            },
        });
        if (!customer) {
            throw new app_error_1.AppError("Customer not found", 404);
        }
        const project = await prisma_1.prisma.project.create({
            data: {
                customerId: data.customerId,
                projectName: data.projectName,
                location: data.location,
                assignedToId: data.assignedToId,
                estimatedBudget: data.estimatedBudget,
            },
        });
        await prisma_1.prisma.projectPhaseTracking.createMany({
            data: [
                {
                    projectId: project.id,
                    phase: client_1.ProjectPhase.PIPES,
                    status: client_1.LifecycleStatus.NOT_STARTED,
                },
                {
                    projectId: project.id,
                    phase: client_1.ProjectPhase.WIRING,
                    status: client_1.LifecycleStatus.NOT_STARTED,
                },
                {
                    projectId: project.id,
                    phase: client_1.ProjectPhase.SWITCHES,
                    status: client_1.LifecycleStatus.NOT_STARTED,
                },
                {
                    projectId: project.id,
                    phase: client_1.ProjectPhase.LIGHTS,
                    status: client_1.LifecycleStatus.NOT_STARTED,
                },
                {
                    projectId: project.id,
                    phase: client_1.ProjectPhase.FANS,
                    status: client_1.LifecycleStatus.NOT_STARTED,
                },
            ],
        });
        return project;
    }
    static async getAll(page, limit, search) {
        const skip = (page - 1) * limit;
        const where = search
            ? {
                projectName: {
                    contains: search,
                    mode: "insensitive",
                },
            }
            : {};
        const [items, total] = await Promise.all([
            prisma_1.prisma.project.findMany({
                where,
                skip,
                take: limit,
                include: {
                    customer: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            }),
            prisma_1.prisma.project.count({
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
    static async getById(id) {
        const project = await prisma_1.prisma.project.findUnique({
            where: { id },
            include: {
                customer: true,
                phaseTracking: true,
            },
        });
        if (!project) {
            throw new app_error_1.AppError("Project not found", 404);
        }
        return project;
    }
}
exports.ProjectService = ProjectService;
//# sourceMappingURL=project.service.js.map