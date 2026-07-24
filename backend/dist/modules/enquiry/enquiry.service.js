"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnquiryService = void 0;
const prisma_1 = require("../../config/prisma");
const app_error_1 = require("../../utils/app-error");
const client_1 = require("@prisma/client");
class EnquiryService {
    static async create(data) {
        return prisma_1.prisma.enquiry.create({
            data: {
                name: data.name,
                mobile: data.mobile,
                email: data.email ?? null,
                source: data.source ?? "MANUAL",
                message: data.message ?? null,
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
    static async triage(id, category) {
        const enquiry = await prisma_1.prisma.enquiry.findUnique({
            where: { id },
        });
        if (!enquiry) {
            throw new app_error_1.AppError("Enquiry not found", 404);
        }
        if (enquiry.status !== client_1.EnquiryStatus.PENDING) {
            throw new app_error_1.AppError("Enquiry has already been triaged or ignored", 400);
        }
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
                    },
                });
                await tx.customerActivity.create({
                    data: {
                        customerId: customer.id,
                        type: "CREATED",
                        message: "Customer created automatically from enquiry triage",
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
            // 4. Create Opportunity
            const opportunity = await tx.opportunity.create({
                data: {
                    customerId: customer.id,
                    category,
                    status: client_1.OpportunityStatus.NEW,
                    assignedToId,
                    source: enquiry.source,
                },
            });
            // 5. Create Activity Logs
            await tx.opportunityActivity.create({
                data: {
                    opportunityId: opportunity.id,
                    type: "CREATED",
                    message: `Opportunity created in category ${category} and assigned to salesperson`,
                },
            });
            await tx.customerActivity.create({
                data: {
                    customerId: customer.id,
                    type: "OPPORTUNITY_CREATED",
                    message: `Created opportunity for ${category} linked to enquiry triage`,
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
}
exports.EnquiryService = EnquiryService;
//# sourceMappingURL=enquiry.service.js.map