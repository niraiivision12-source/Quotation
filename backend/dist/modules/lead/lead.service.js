"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadService = void 0;
const prisma_1 = require("@/config/prisma");
const app_error_1 = require("@/utils/app-error");
const client_1 = require("@prisma/client");
class LeadService {
    static async create(data) {
        const exists = await prisma_1.prisma.lead.findFirst({
            where: {
                mobile: data.mobile,
            },
        });
        if (exists) {
            throw new app_error_1.AppError("Lead already exists", 409);
        }
        return prisma_1.prisma.lead.create({
            data,
        });
    }
    static async getAll(page, limit, search) {
        const skip = (page - 1) * limit;
        const where = search
            ? {
                OR: [
                    {
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    {
                        mobile: {
                            contains: search,
                        },
                    },
                ],
            }
            : {};
        const [items, total] = await Promise.all([
            prisma_1.prisma.lead.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: "desc",
                },
            }),
            prisma_1.prisma.lead.count({
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
        const lead = await prisma_1.prisma.lead.findUnique({
            where: { id },
        });
        if (!lead) {
            throw new app_error_1.AppError("Lead not found", 404);
        }
        return lead;
    }
    static async convert(leadId, data) {
        const lead = await prisma_1.prisma.lead.findUnique({
            where: {
                id: leadId,
            },
        });
        if (!lead) {
            throw new app_error_1.AppError("Lead not found", 404);
        }
        if (lead.status === client_1.LeadStatus.WON) {
            throw new app_error_1.AppError("Lead already converted", 409);
        }
        const existingCustomer = await prisma_1.prisma.customer.findUnique({
            where: {
                mobile: lead.mobile,
            },
        });
        if (existingCustomer) {
            throw new app_error_1.AppError("Customer already exists with this mobile number", 409);
        }
        return prisma_1.prisma.$transaction(async (tx) => {
            const customer = await tx.customer.create({
                data: {
                    name: lead.name,
                    mobile: lead.mobile,
                    email: lead.email,
                    assignedToId: lead.assignedToId,
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
            await tx.projectPhaseTracking.createMany({
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
            await tx.lead.update({
                where: {
                    id: lead.id,
                },
                data: {
                    status: client_1.LeadStatus.WON,
                    convertedAt: new Date(),
                },
            });
            return {
                customer,
                project,
            };
        });
    }
}
exports.LeadService = LeadService;
//# sourceMappingURL=lead.service.js.map