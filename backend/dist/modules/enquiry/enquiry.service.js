"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnquiryService = void 0;
const prisma_1 = require("../../config/prisma");
const app_error_1 = require("../../utils/app-error");
const client_1 = require("@prisma/client");
class EnquiryService {
    static async checkMobileExists(mobile) {
        const existingPending = await prisma_1.prisma.enquiry.findFirst({
            where: { mobile, status: client_1.EnquiryStatus.PENDING },
            select: { id: true, name: true, mobile: true, status: true },
        });
        if (existingPending) {
            return {
                exists: true,
                existingId: existingPending.id,
                existingName: existingPending.name,
                existingStatus: existingPending.status,
                message: "An enquiry with this mobile number is already pending in the inbox",
            };
        }
        // Also check for triaged enquiries (already converted to opportunity)
        const existingTriaged = await prisma_1.prisma.enquiry.findFirst({
            where: { mobile, status: client_1.EnquiryStatus.TRIAGED },
            select: { id: true, name: true, mobile: true, status: true },
        });
        if (existingTriaged) {
            return {
                exists: true,
                existingId: existingTriaged.id,
                existingName: existingTriaged.name,
                existingStatus: existingTriaged.status,
                message: "An enquiry with this mobile number already exists and has been processed",
            };
        }
        return { exists: false };
    }
    static async create(data) {
        const existingPending = await prisma_1.prisma.enquiry.findFirst({
            where: { mobile: data.mobile, status: client_1.EnquiryStatus.PENDING },
        });
        if (existingPending) {
            throw new app_error_1.AppError("An enquiry from this mobile number is already pending in the inbox", 409);
        }
        return prisma_1.prisma.enquiry.create({
            data: {
                name: data.name,
                mobile: data.mobile,
                email: data.email ?? null,
                source: data.source ?? "MANUAL",
                message: data.message ?? null,
                city: data.city ?? null,
                status: client_1.EnquiryStatus.PENDING,
            },
        });
    }
    static async getAll(page, limit, search, status) {
        const skip = (page - 1) * limit;
        const where = {};
        if (status) {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { mobile: { contains: search } },
            ];
        }
        const [items, total] = await Promise.all([
            prisma_1.prisma.enquiry.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma_1.prisma.enquiry.count({ where }),
        ]);
        return { items, total, page, limit };
    }
    static async triage(id, category, notes, projectName) {
        const enquiry = await prisma_1.prisma.enquiry.findUnique({
            where: { id },
        });
        if (!enquiry) {
            throw new app_error_1.AppError("Enquiry not found", 404);
        }
        if (enquiry.status !== client_1.EnquiryStatus.PENDING) {
            throw new app_error_1.AppError("Enquiry has already been assigned or ignored", 400);
        }
        const mapCategoryToPhase = (cat) => {
            switch (cat) {
                case client_1.ProductCategory.PIPES:
                    return client_1.ProjectPhase.PIPES;
                case client_1.ProductCategory.WIRES:
                    return client_1.ProjectPhase.WIRING;
                case client_1.ProductCategory.SWITCHES:
                    return client_1.ProjectPhase.SWITCHES;
                case client_1.ProductCategory.LIGHTS:
                    return client_1.ProjectPhase.LIGHTS;
                case client_1.ProductCategory.FANS:
                    return client_1.ProjectPhase.FANS;
                case client_1.ProductCategory.OTHERS:
                default:
                    return client_1.ProjectPhase.OTHERS;
            }
        };
        return prisma_1.prisma.$transaction(async (tx) => {
            // 1. Update Enquiry status and category
            const updatedEnquiry = await tx.enquiry.update({
                where: { id },
                data: {
                    status: client_1.EnquiryStatus.TRIAGED,
                    category,
                },
            });
            // 2. Find or Create Customer
            let customer = await tx.customer.findUnique({
                where: { mobile: enquiry.mobile },
            });
            if (!customer) {
                customer = await tx.customer.create({
                    data: {
                        name: enquiry.name,
                        mobile: enquiry.mobile,
                        email: enquiry.email,
                        source: enquiry.source,
                        city: enquiry.city,
                    },
                });
                await tx.customerActivity.create({
                    data: {
                        customerId: customer.id,
                        type: "CREATED",
                        message: "Customer created automatically from enquiry assignment",
                    },
                });
            }
            // 3. Resolve Salesperson from Settings Mappings
            const settings = await tx.systemSettings.findUnique({
                where: { id: "default" },
            });
            const mappings = settings?.categorySalesmanAssignment || {};
            const catConfig = mappings[category];
            let assignedToId = null;
            if (typeof catConfig === "string") {
                assignedToId = catConfig;
            }
            else if (catConfig && typeof catConfig === "object") {
                assignedToId = catConfig.primarySalespersonId || null;
            }
            if (assignedToId) {
                // Validate that user exists and is a salesman and is active
                const salesperson = await tx.user.findFirst({
                    where: { id: assignedToId, role: "SALESMAN", isActive: true },
                });
                if (!salesperson) {
                    assignedToId = null;
                }
            }
            // Fallback: assign to the first active Owner
            if (!assignedToId) {
                const owner = await tx.user.findFirst({
                    where: { role: "OWNER", isActive: true },
                });
                assignedToId = owner?.id || null;
            }
            // Create or Update Project
            const resolvedProjectName = projectName?.trim() || enquiry.name;
            let project = await tx.project.findFirst({
                where: { customerId: customer.id, projectName: resolvedProjectName, isActive: true },
            });
            if (!project) {
                project = await tx.project.create({
                    data: {
                        customerId: customer.id,
                        projectName: resolvedProjectName,
                        currentPhase: mapCategoryToPhase(category),
                        assignedToId,
                    },
                });
                // Initialize project phase tracking
                const phases = [
                    client_1.ProjectPhase.PIPES,
                    client_1.ProjectPhase.WIRING,
                    client_1.ProjectPhase.SWITCHES,
                    client_1.ProjectPhase.LIGHTS,
                    client_1.ProjectPhase.FANS,
                    client_1.ProjectPhase.OTHERS,
                ];
                const selectedPhase = mapCategoryToPhase(category);
                const selectedIndex = phases.indexOf(selectedPhase);
                const phaseTrackings = [];
                for (let i = 0; i < phases.length; i++) {
                    const phase = phases[i];
                    let phaseAssignedToId = null;
                    if (settings?.projectAssignmentMethod === "PHASE_BASED") {
                        const phaseAssignment = settings.projectPhaseAssignment || {};
                        const salesmanId = phaseAssignment[phase];
                        if (salesmanId) {
                            phaseAssignedToId = salesmanId;
                        }
                    }
                    let status = client_1.LifecycleStatus.NOT_STARTED;
                    let startedAt = null;
                    let completedAt = null;
                    if (i < selectedIndex) {
                        status = client_1.LifecycleStatus.COMPLETED;
                        startedAt = new Date();
                        completedAt = new Date();
                    }
                    else if (i === selectedIndex) {
                        status = client_1.LifecycleStatus.IN_PROGRESS;
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
                await tx.projectActivity.create({
                    data: {
                        projectId: project.id,
                        type: "CREATED",
                        message: "Project created automatically from enquiry assignment",
                    },
                });
            }
            else {
                project = await tx.project.update({
                    where: { id: project.id },
                    data: {
                        currentPhase: mapCategoryToPhase(category),
                        assignedToId,
                    },
                });
            }
            // 4. Create Opportunity
            const opportunity = await tx.opportunity.create({
                data: {
                    customerId: customer.id,
                    projectId: project.id,
                    category,
                    status: client_1.OpportunityStatus.NEW,
                    assignedToId,
                    source: enquiry.source,
                },
            });
            // 5. Create Activity Logs
            const trimmedNotes = notes?.trim() || null;
            await tx.opportunityActivity.create({
                data: {
                    opportunityId: opportunity.id,
                    type: "CREATED",
                    message: trimmedNotes
                        ? `Opportunity created in category ${category} and assigned to salesperson. Notes: ${trimmedNotes}`
                        : `Opportunity created in category ${category} and assigned to salesperson`,
                },
            });
            await tx.customerActivity.create({
                data: {
                    customerId: customer.id,
                    type: "OPPORTUNITY_CREATED",
                    message: trimmedNotes
                        ? `Created opportunity for ${category} linked to enquiry assignment. Notes: ${trimmedNotes}`
                        : `Created opportunity for ${category} linked to enquiry assignment`,
                    metadata: { opportunityId: opportunity.id },
                },
            });
            return {
                enquiry: updatedEnquiry,
                customer,
                opportunity,
            };
        });
    }
    static async ignore(id) {
        const enquiry = await prisma_1.prisma.enquiry.findUnique({
            where: { id },
        });
        if (!enquiry) {
            throw new app_error_1.AppError("Enquiry not found", 404);
        }
        if (enquiry.status !== client_1.EnquiryStatus.PENDING) {
            throw new app_error_1.AppError("Enquiry has already been processed", 400);
        }
        return prisma_1.prisma.enquiry.update({
            where: { id },
            data: {
                status: client_1.EnquiryStatus.IGNORED,
            },
        });
    }
    // ─── New: Delete (permanent hard delete) ───────────────────────────────────
    static async delete(id) {
        const enquiry = await prisma_1.prisma.enquiry.findUnique({
            where: { id },
        });
        if (!enquiry) {
            throw new app_error_1.AppError("Enquiry not found", 404);
        }
        return prisma_1.prisma.enquiry.delete({
            where: { id },
        });
    }
    // ─── New: Update (PENDING only — triaged/ignored are immutable) ────────────
    static async update(id, data) {
        const enquiry = await prisma_1.prisma.enquiry.findUnique({
            where: { id },
        });
        if (!enquiry) {
            throw new app_error_1.AppError("Enquiry not found", 404);
        }
        if (enquiry.status !== client_1.EnquiryStatus.PENDING) {
            throw new app_error_1.AppError("Only PENDING enquiries can be edited. Assigned and ignored enquiries are immutable.", 400);
        }
        return prisma_1.prisma.enquiry.update({
            where: { id },
            data: {
                name: data.name ?? enquiry.name,
                email: data.email !== undefined ? data.email : enquiry.email,
                city: data.city !== undefined ? data.city : enquiry.city,
                message: data.message !== undefined ? data.message : enquiry.message,
                source: data.source ?? enquiry.source,
            },
        });
    }
    // ─── New: Restore IGNORED → PENDING ────────────────────────────────────────
    static async restore(id) {
        const enquiry = await prisma_1.prisma.enquiry.findUnique({
            where: { id },
        });
        if (!enquiry) {
            throw new app_error_1.AppError("Enquiry not found", 404);
        }
        if (enquiry.status !== client_1.EnquiryStatus.IGNORED) {
            throw new app_error_1.AppError("Only IGNORED enquiries can be restored to PENDING", 400);
        }
        return prisma_1.prisma.enquiry.update({
            where: { id },
            data: {
                status: client_1.EnquiryStatus.PENDING,
            },
        });
    }
    // ─── New: Bulk Delete ───────────────────────────────────────────────────────
    static async bulkDelete(ids) {
        const count = await prisma_1.prisma.enquiry.deleteMany({
            where: { id: { in: ids } },
        });
        return { deleted: count.count };
    }
    // ─── New: Bulk Ignore (PENDING only) ───────────────────────────────────────
    static async bulkIgnore(ids) {
        const count = await prisma_1.prisma.enquiry.updateMany({
            where: { id: { in: ids }, status: client_1.EnquiryStatus.PENDING },
            data: { status: client_1.EnquiryStatus.IGNORED },
        });
        return { ignored: count.count };
    }
    // ─── New: Export (returns all matching records for CSV download) ────────────
    static async exportAll(search, status) {
        const where = {};
        if (status) {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { mobile: { contains: search } },
            ];
        }
        return prisma_1.prisma.enquiry.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });
    }
}
exports.EnquiryService = EnquiryService;
//# sourceMappingURL=enquiry.service.js.map