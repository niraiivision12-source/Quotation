"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationService = void 0;
const prisma_1 = require("../../config/prisma");
const app_error_1 = require("../../utils/app-error");
const settings_service_1 = require("../settings/settings.service");
const opportunity_service_1 = require("../opportunity/opportunity.service");
const client_1 = require("@prisma/client");
async function updateLeadNextFollowUp(tx, leadId) {
    const nextReminder = await tx.reminder.findFirst({
        where: {
            leadId,
            status: "PENDING",
        },
        orderBy: {
            dueAt: "asc",
        },
    });
    await tx.lead.update({
        where: { id: leadId },
        data: {
            nextFollowUpAt: nextReminder ? nextReminder.dueAt : null,
        },
    });
}
class QuotationService {
    static async create(userId, data) {
        if (data.opportunityId) {
            const opportunity = await prisma_1.prisma.opportunity.findUnique({
                where: { id: data.opportunityId },
            });
            if (!opportunity) {
                throw new app_error_1.AppError("Opportunity not found", 404);
            }
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new app_error_1.AppError("User not found", 404);
            }
            if (user.role !== "OWNER") {
                const settings = await prisma_1.prisma.systemSettings.findUnique({
                    where: { id: "default" },
                });
                const mappings = settings?.categorySalesmanAssignment || {};
                const config = mappings[opportunity.category];
                let authorized = false;
                if (typeof config === "string") {
                    authorized = config === userId;
                }
                else if (config && typeof config === "object") {
                    const isPrimary = config.primarySalespersonId === userId;
                    const isBackup = config.backupSalespersonId === userId;
                    const isAdditional = Array.isArray(config.additionalEditors) && config.additionalEditors.includes(userId);
                    authorized = isPrimary || isBackup || isAdditional;
                }
                if (opportunity.assignedToId === userId) {
                    authorized = true;
                }
                if (!authorized) {
                    throw new app_error_1.AppError("You do not have permission to create quotations for this pipeline category", 403);
                }
            }
            data.customerId = opportunity.customerId;
            data.type = client_1.QuotationType.CUSTOMER;
        }
        const type = data.type ?? (data.opportunityId ? client_1.QuotationType.CUSTOMER : data.leadId ? client_1.QuotationType.LEAD : data.customerId ? client_1.QuotationType.CUSTOMER : client_1.QuotationType.WALK_IN_CUSTOMER);
        if (type === client_1.QuotationType.LEAD && !data.leadId) {
            throw new app_error_1.AppError("Quotation must belong to a lead", 400);
        }
        if (type === client_1.QuotationType.CUSTOMER && !data.customerId) {
            throw new app_error_1.AppError("Quotation must belong to a customer", 400);
        }
        if (type === client_1.QuotationType.WALK_IN_CUSTOMER && (!data.walkInName || !data.walkInMobile)) {
            throw new app_error_1.AppError("Walk-in customer name and mobile are required", 400);
        }
        if (type === client_1.QuotationType.PURCHASE_ORDER && !data.leadId && !data.customerId && (!data.walkInName || !data.walkInMobile)) {
            throw new app_error_1.AppError("Dealer name and mobile are required for Purchase Order", 400);
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new app_error_1.AppError("User not found", 404);
        }
        const settings = await settings_service_1.SettingsService.getSettings();
        let validUntil = data.validUntil;
        if (!validUntil) {
            const validityDays = settings.quoteValidityDays || 30;
            validUntil = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
        }
        if (data.followUp) {
            if (validUntil && new Date(data.followUp.dueAt) >= new Date(validUntil)) {
                throw new app_error_1.AppError("Follow-up reminder due date must be before quotation expiry (validUntil)", 400);
            }
        }
        if (type === client_1.QuotationType.LEAD && data.leadId) {
            const lead = await prisma_1.prisma.lead.findUnique({
                where: {
                    id: data.leadId,
                },
            });
            if (!lead) {
                throw new app_error_1.AppError("Lead not found", 404);
            }
        }
        if (type === client_1.QuotationType.CUSTOMER && data.customerId) {
            const customer = await prisma_1.prisma.customer.findUnique({
                where: {
                    id: data.customerId,
                },
            });
            if (!customer) {
                throw new app_error_1.AppError("Customer not found", 404);
            }
        }
        const lastQuotation = (type === client_1.QuotationType.WALK_IN_CUSTOMER || type === client_1.QuotationType.PURCHASE_ORDER)
            ? null
            : await prisma_1.prisma.quotation.findFirst({
                where: data.opportunityId
                    ? {
                        opportunityId: data.opportunityId,
                    }
                    : data.projectId
                        ? {
                            projectId: data.projectId,
                            phase: data.phase ?? undefined,
                        }
                        : {
                            leadId: data.leadId,
                        },
                orderBy: {
                    version: "desc",
                },
            });
        const version = lastQuotation ? lastQuotation.version + 1 : 1;
        let subtotal = 0;
        const itemData = [];
        if (data.items.length === 0) {
            throw new app_error_1.AppError("Quotation must contain at least one item", 400);
        }
        for (const item of data.items) {
            if (item.quantity <= 0) {
                throw new app_error_1.AppError("Invalid quantity", 400);
            }
            const product = await prisma_1.prisma.product.findUnique({
                where: {
                    id: item.productId,
                },
            });
            if (!product) {
                throw new app_error_1.AppError("Product not found", 404);
            }
            if (!product.isActive) {
                throw new app_error_1.AppError("Product is inactive", 400);
            }
            if (type === client_1.QuotationType.PURCHASE_ORDER) {
                itemData.push({
                    productId: product.id,
                    quantity: item.quantity,
                    costPrice: 0,
                    marginPercent: 0,
                    mrp: 0,
                    discountPercent: 0,
                    gstPercent: 0,
                    sellingPrice: 0,
                    totalPrice: 0,
                });
                continue;
            }
            const productMRP = product.mrp !== null ? Number(product.mrp) : null;
            const productCostPrice = product.costPrice !== null ? Number(product.costPrice) : null;
            let isMRPMethod = false;
            if (productMRP !== null && productCostPrice === null) {
                isMRPMethod = true;
            }
            else if (productCostPrice !== null && productMRP === null) {
                isMRPMethod = false;
            }
            else if (productMRP !== null && productCostPrice !== null) {
                if (item.discountPercent !== null && item.discountPercent !== undefined && item.discountPercent > 0) {
                    isMRPMethod = true;
                }
                else if (item.marginPercent !== null && item.marginPercent !== undefined && item.marginPercent > 0) {
                    isMRPMethod = false;
                }
                else {
                    isMRPMethod = (item.discountPercent !== null && item.discountPercent !== undefined);
                }
            }
            if (isMRPMethod) {
                const mrp = productMRP;
                const discountPercent = item.discountPercent ?? 0;
                const sellingPrice = mrp - (mrp * discountPercent) / 100;
                const totalPrice = sellingPrice * item.quantity;
                subtotal += totalPrice;
                itemData.push({
                    productId: product.id,
                    quantity: item.quantity,
                    mrp,
                    discountPercent,
                    costPrice: null,
                    marginPercent: null,
                    gstPercent: item.gstPercent ?? 18,
                    sellingPrice,
                    totalPrice,
                });
            }
            else {
                const costPrice = productCostPrice;
                let marginPercent = item.marginPercent ?? 0;
                if (marginPercent === 0) {
                    marginPercent = Number(settings.pricingDefaultMargin);
                }
                if (user.role === "SALESMAN") {
                    if (!settings.pricingAllowMarginOverride) {
                        if (marginPercent !== Number(settings.pricingDefaultMargin)) {
                            throw new app_error_1.AppError(`Margin overrides are disabled. You must use the default margin of ${settings.pricingDefaultMargin}%`, 400);
                        }
                    }
                    else {
                        if (marginPercent < Number(settings.pricingMinMargin)) {
                            throw new app_error_1.AppError(`Margin cannot be lower than the minimum allowed margin of ${settings.pricingMinMargin}%`, 400);
                        }
                    }
                }
                const sellingPrice = costPrice / (1 - marginPercent / 100);
                const totalPrice = sellingPrice * item.quantity;
                subtotal += totalPrice;
                itemData.push({
                    productId: product.id,
                    quantity: item.quantity,
                    costPrice,
                    marginPercent,
                    mrp: null,
                    discountPercent: null,
                    gstPercent: item.gstPercent ?? 18,
                    sellingPrice,
                    totalPrice,
                });
            }
        }
        let totalGst = 0;
        if (type !== client_1.QuotationType.PURCHASE_ORDER) {
            for (const idata of itemData) {
                const gstDec = idata.gstPercent ? Number(idata.gstPercent) : 18;
                totalGst += Number(idata.totalPrice) * (gstDec / 100);
            }
        }
        const discountAmount = type === client_1.QuotationType.PURCHASE_ORDER ? 0 : (data.discountAmount || 0);
        if (type !== client_1.QuotationType.PURCHASE_ORDER && user.role === "SALESMAN") {
            const maxDiscountPercent = Number(settings.pricingMaxDiscount);
            const maxDiscountAllowed = (subtotal * maxDiscountPercent) / 100;
            if (discountAmount > maxDiscountAllowed) {
                throw new app_error_1.AppError(`Discount exceeds the maximum allowed discount of ${maxDiscountPercent}% (max allowed: ₹${maxDiscountAllowed.toFixed(2)})`, 400);
            }
        }
        const totalAmount = type === client_1.QuotationType.PURCHASE_ORDER ? 0 : Math.max(subtotal - discountAmount + totalGst, 0);
        return prisma_1.prisma.$transaction(async (tx) => {
            const totalQuotes = await tx.quotation.count();
            const seq = totalQuotes + 1;
            const now = new Date();
            const yyyy = String(now.getFullYear());
            const yy = yyyy.slice(-2);
            const mm = String(now.getMonth() + 1).padStart(2, "0");
            const dd = String(now.getDate()).padStart(2, "0");
            let quotationNumber = settings.quoteNumberFormat
                .replace("{YYYY}", yyyy)
                .replace("{YY}", yy)
                .replace("{MM}", mm)
                .replace("{DD}", dd);
            quotationNumber = quotationNumber.replace("{NNNNN}", String(seq).padStart(5, "0"));
            quotationNumber = quotationNumber.replace("{NNNN}", String(seq).padStart(4, "0"));
            quotationNumber = quotationNumber.replace("{NNN}", String(seq).padStart(3, "0"));
            quotationNumber = quotationNumber.replace("{NN}", String(seq).padStart(2, "0"));
            const existingNo = await tx.quotation.findUnique({
                where: { quotationNumber },
            });
            const finalQuotationNumber = existingNo ? `${quotationNumber}-${Date.now()}` : quotationNumber;
            const quotation = await tx.quotation.create({
                data: {
                    quotationNumber: finalQuotationNumber,
                    type,
                    leadId: data.leadId || null,
                    customerId: data.customerId || null,
                    projectId: data.projectId || null,
                    phase: data.phase || null,
                    opportunityId: data.opportunityId ?? null,
                    walkInName: (type === client_1.QuotationType.WALK_IN_CUSTOMER || type === client_1.QuotationType.PURCHASE_ORDER) ? data.walkInName : null,
                    walkInMobile: (type === client_1.QuotationType.WALK_IN_CUSTOMER || type === client_1.QuotationType.PURCHASE_ORDER) ? data.walkInMobile : null,
                    walkInEmail: (type === client_1.QuotationType.WALK_IN_CUSTOMER || type === client_1.QuotationType.PURCHASE_ORDER) ? data.walkInEmail : null,
                    walkInAddress: (type === client_1.QuotationType.WALK_IN_CUSTOMER || type === client_1.QuotationType.PURCHASE_ORDER) ? data.walkInAddress : null,
                    version,
                    subtotal,
                    discountAmount,
                    totalGst,
                    totalAmount,
                    notes: data.notes,
                    validUntil,
                    createdById: data.createdById ?? userId,
                    parentQuotationId: data.parentQuotationId || lastQuotation?.id,
                    revisionReason: data.revisionReason || undefined,
                    companyNameSnapshot: settings.companyName,
                    companyLogoSnapshot: settings.companyLogo,
                    companyGstSnapshot: settings.companyGst,
                    companyAddressSnapshot: settings.companyAddress,
                    companyPhoneSnapshot: settings.companyPhone,
                    companyEmailSnapshot: settings.companyEmail,
                    companyWebsiteSnapshot: settings.companyWebsite,
                    bankNameSnapshot: settings.bankName,
                    bankAccountNoSnapshot: settings.bankAccountNo,
                    bankIfscSnapshot: settings.bankIfsc,
                    bankBranchSnapshot: settings.bankBranch,
                    upiIdSnapshot: settings.upiId,
                    termsAndConditionsSnapshot: settings.termsAndConditions,
                    authorizedSignatureSnapshot: settings.authorizedSignature,
                    footerTextSnapshot: settings.footerText,
                    items: {
                        create: itemData,
                    },
                },
                include: {
                    items: true,
                },
            });
            if (quotation.leadId) {
                const isRevision = !!data.parentQuotationId;
                await tx.leadActivity.create({
                    data: {
                        leadId: quotation.leadId,
                        userId,
                        type: isRevision ? "UPDATED" : "QUOTATION_CREATED",
                        message: isRevision
                            ? `Quotation ${quotation.quotationNumber} (v${quotation.version}) created as edit of v${lastQuotation?.version || quotation.version - 1}`
                            : `Quotation ${quotation.quotationNumber} created`,
                    },
                });
            }
            if (data.followUp) {
                const reminder = await tx.reminder.create({
                    data: {
                        title: data.followUp.title ?? `Follow up on Quotation ${quotation.quotationNumber}`,
                        description: data.followUp.description,
                        type: quotation.leadId ? "LEAD" : quotation.customerId ? "CUSTOMER" : "QUOTATION",
                        priority: data.followUp.priority ?? "MEDIUM",
                        dueAt: new Date(data.followUp.dueAt),
                        userId,
                        leadId: quotation.leadId,
                        customerId: quotation.customerId,
                        projectId: quotation.projectId,
                    },
                });
                if (quotation.leadId) {
                    await updateLeadNextFollowUp(tx, quotation.leadId);
                    await tx.leadActivity.create({
                        data: {
                            leadId: quotation.leadId,
                            userId,
                            type: "REMINDER_CREATED",
                            message: `Reminder created: ${reminder.title}`,
                        },
                    });
                }
            }
            if (quotation.projectId) {
                await tx.project.update({
                    where: { id: quotation.projectId },
                    data: {
                        estimatedBudget: quotation.totalAmount,
                    },
                });
                const isRevision = !!data.parentQuotationId;
                await tx.projectActivity.create({
                    data: {
                        projectId: quotation.projectId,
                        userId,
                        type: isRevision ? "QUOTATION_EDITED" : "QUOTATION_CREATED",
                        message: isRevision
                            ? `Quotation ${quotation.quotationNumber} edited (v${quotation.version} created from v${lastQuotation?.version || quotation.version - 1})`
                            : `Quotation ${quotation.quotationNumber} (v${quotation.version}) created in ${quotation.phase} Phase`,
                    },
                });
            }
            if (quotation.opportunityId) {
                await tx.opportunity.update({
                    where: { id: quotation.opportunityId },
                    data: {
                        status: client_1.OpportunityStatus.QUOTATION_SENT,
                    },
                });
                await tx.opportunityActivity.create({
                    data: {
                        opportunityId: quotation.opportunityId,
                        userId,
                        type: "STATUS_CHANGED",
                        message: `Opportunity status moved to QUOTATION_SENT automatically upon quotation creation`,
                    },
                });
            }
            return quotation;
        });
    }
    static async getAll(page, limit, leadId, projectId, customerId) {
        const skip = (page - 1) * limit;
        const where = {
            ...(leadId && {
                leadId,
            }),
            ...(projectId && {
                projectId,
            }),
            ...(customerId && {
                customerId,
            }),
        };
        const [items, total] = await Promise.all([
            prisma_1.prisma.quotation.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    quotationNumber: true,
                    type: true,
                    phase: true,
                    version: true,
                    status: true,
                    totalAmount: true,
                    createdAt: true,
                    parentQuotationId: true,
                    revisionReason: true,
                    walkInName: true,
                    walkInMobile: true,
                    walkInEmail: true,
                    walkInAddress: true,
                    lead: {
                        select: {
                            id: true,
                            name: true,
                            mobile: true,
                        },
                    },
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            mobile: true,
                        },
                    },
                    project: {
                        select: {
                            id: true,
                            projectName: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            }),
            prisma_1.prisma.quotation.count({
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
        const quotation = await prisma_1.prisma.quotation.findUnique({
            where: {
                id,
            },
            include: {
                lead: true,
                customer: true,
                project: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                payment: {
                    include: {
                        transactions: {
                            orderBy: { date: "desc" },
                        },
                    },
                },
                items: {
                    include: {
                        product: true,
                    },
                },
                childVersions: true,
                parentQuotation: true,
            },
        });
        if (!quotation) {
            throw new app_error_1.AppError("Quotation not found", 404);
        }
        return quotation;
    }
    /**
     * Returns every version in a quotation's revision chain, oldest first.
     *
     * `getById` only exposes the immediate parent and children, so it cannot
     * answer "show me the history" for a quote sitting in the middle of a
     * v1 -> v2 -> v3 chain. This walks up to the root, then collects the whole
     * tree back down.
     */
    static async getHistory(id) {
        const quotation = await prisma_1.prisma.quotation.findUnique({
            where: { id },
            select: { id: true, parentQuotationId: true },
        });
        if (!quotation) {
            throw new app_error_1.AppError("Quotation not found", 404);
        }
        // Walk up to the root. `seen` guards against a parent cycle turning this
        // into an infinite loop — nothing enforces acyclicity at the DB level.
        const seen = new Set([quotation.id]);
        let root = quotation;
        while (root.parentQuotationId && !seen.has(root.parentQuotationId)) {
            const parent = await prisma_1.prisma.quotation.findUnique({
                where: { id: root.parentQuotationId },
                select: { id: true, parentQuotationId: true },
            });
            if (!parent)
                break;
            seen.add(parent.id);
            root = parent;
        }
        // Collect the chain back down from the root, level by level.
        const chainIds = [root.id];
        let frontier = [root.id];
        while (frontier.length > 0) {
            const children = await prisma_1.prisma.quotation.findMany({
                where: { parentQuotationId: { in: frontier } },
                select: { id: true },
            });
            frontier = children
                .map((child) => child.id)
                .filter((childId) => !chainIds.includes(childId));
            chainIds.push(...frontier);
        }
        return prisma_1.prisma.quotation.findMany({
            where: { id: { in: chainIds } },
            orderBy: { version: "asc" },
            select: {
                id: true,
                quotationNumber: true,
                version: true,
                status: true,
                phase: true,
                subtotal: true,
                discountAmount: true,
                totalAmount: true,
                revisionReason: true,
                parentQuotationId: true,
                notes: true,
                validUntil: true,
                createdAt: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
                _count: {
                    select: { items: true },
                },
            },
        });
    }
    static async getProjectQuotations(projectId) {
        return prisma_1.prisma.quotation.findMany({
            where: {
                projectId,
            },
            include: {
                payment: {
                    select: {
                        id: true,
                        status: true,
                        amountReceived: true,
                        pendingAmount: true,
                    },
                },
                customer: {
                    select: {
                        id: true,
                        name: true,
                        mobile: true,
                        creditAllowed: true,
                        maxCreditAmount: true,
                        defaultCreditDays: true,
                    },
                },
            },
            orderBy: [
                {
                    phase: "asc",
                },
                {
                    version: "desc",
                },
            ],
        });
    }
    static async updateStatus(id, status, userId, followUp) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new app_error_1.AppError("User not found", 404);
        }
        const settings = await settings_service_1.SettingsService.getSettings();
        if (status === client_1.QuotationStatus.APPROVED) {
            if (user.role !== "OWNER") {
                const allowedRoles = settings.rolePermissions?.approveQuotations || [];
                if (!allowedRoles.includes(user.role)) {
                    throw new app_error_1.AppError(`You do not have permission to approve quotations`, 403);
                }
            }
        }
        const quotation = await prisma_1.prisma.quotation.findUnique({
            where: {
                id,
            },
        });
        if (!quotation) {
            throw new app_error_1.AppError("Quotation not found", 404);
        }
        if (followUp) {
            const hasSentAt = quotation.sentAt || status === client_1.QuotationStatus.SENT;
            const hasValidUntil = quotation.validUntil;
            if (!hasSentAt && !hasValidUntil) {
                throw new app_error_1.AppError("Follow-up reminders can only be created if the quotation is sent or has an expiry date", 400);
            }
            if (hasValidUntil && new Date(followUp.dueAt) >= new Date(hasValidUntil)) {
                throw new app_error_1.AppError("Follow-up reminder due date must be before quotation expiry (validUntil)", 400);
            }
        }
        const transitions = {
            DRAFT: [client_1.QuotationStatus.SENT],
            SENT: [
                client_1.QuotationStatus.APPROVED,
                client_1.QuotationStatus.REJECTED,
                client_1.QuotationStatus.EXPIRED,
            ],
            APPROVED: [],
            REJECTED: [],
            EXPIRED: [],
        };
        const allowed = transitions[quotation.status];
        if (!allowed.includes(status)) {
            throw new app_error_1.AppError(`Cannot move quotation from ${quotation.status} to ${status}`, 400);
        }
        return prisma_1.prisma.$transaction(async (tx) => {
            const updatedQuotation = await tx.quotation.update({
                where: {
                    id,
                },
                data: {
                    status,
                    sentAt: status === client_1.QuotationStatus.SENT ? new Date() : quotation.sentAt,
                    approvedAt: status === client_1.QuotationStatus.APPROVED
                        ? new Date()
                        : quotation.approvedAt,
                    rejectedAt: status === client_1.QuotationStatus.REJECTED
                        ? new Date()
                        : quotation.rejectedAt,
                },
            });
            if (quotation.leadId) {
                let activityType = null;
                if (status === client_1.QuotationStatus.SENT)
                    activityType = "QUOTATION_SENT";
                if (status === client_1.QuotationStatus.APPROVED)
                    activityType = "QUOTATION_APPROVED";
                if (quotation.leadId && status === client_1.QuotationStatus.APPROVED) {
                    await tx.lead.update({
                        where: {
                            id: quotation.leadId,
                        },
                        data: {
                            status: "WON",
                        },
                    });
                }
                if (status === client_1.QuotationStatus.REJECTED)
                    activityType = "QUOTATION_REJECTED";
                if (activityType) {
                    await tx.leadActivity.create({
                        data: {
                            leadId: quotation.leadId,
                            type: activityType,
                            message: `Quotation ${updatedQuotation.quotationNumber} ${status.toLowerCase()}`,
                        },
                    });
                }
            }
            if (quotation.opportunityId) {
                let activityType = `QUOTATION_${status}`;
                if (status === client_1.QuotationStatus.APPROVED) {
                    const currentPhase = quotation.phase;
                    let nextPhase = client_1.ProjectPhase.WIRING;
                    if (currentPhase) {
                        switch (currentPhase) {
                            case client_1.ProjectPhase.PIPES:
                                nextPhase = client_1.ProjectPhase.WIRING;
                                break;
                            case client_1.ProjectPhase.WIRING:
                                nextPhase = client_1.ProjectPhase.SWITCHES;
                                break;
                            case client_1.ProjectPhase.SWITCHES:
                                nextPhase = client_1.ProjectPhase.LIGHTS;
                                break;
                            case client_1.ProjectPhase.LIGHTS:
                                nextPhase = client_1.ProjectPhase.FANS;
                                break;
                            case client_1.ProjectPhase.FANS:
                                nextPhase = client_1.ProjectPhase.OTHERS;
                                break;
                            case client_1.ProjectPhase.OTHERS:
                                nextPhase = client_1.ProjectPhase.OTHERS;
                                break;
                        }
                    }
                    await opportunity_service_1.OpportunityService.update(quotation.opportunityId, userId, user.role, {
                        status: client_1.OpportunityStatus.WON,
                        nextPhase: nextPhase,
                        followUp: {
                            title: "Post-Sale Follow-up",
                            description: `Automatically scheduled follow-up after quotation ${quotation.quotationNumber} approval.`,
                            priority: "MEDIUM",
                            dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
                        }
                    });
                }
                await tx.opportunityActivity.create({
                    data: {
                        opportunityId: quotation.opportunityId,
                        userId,
                        type: activityType,
                        message: `Quotation ${updatedQuotation.quotationNumber} status updated to ${status.toLowerCase()}`,
                    },
                });
            }
            if (quotation.projectId) {
                const activityType = `QUOTATION_${status}`;
                await tx.projectActivity.create({
                    data: {
                        projectId: quotation.projectId,
                        userId,
                        type: activityType,
                        message: `Quotation ${updatedQuotation.quotationNumber} status updated to ${status.toLowerCase()}`,
                    },
                });
            }
            if (followUp) {
                const reminder = await tx.reminder.create({
                    data: {
                        title: followUp.title ?? `Follow up on Quotation ${quotation.quotationNumber}`,
                        description: followUp.description,
                        type: quotation.leadId ? "LEAD" : quotation.customerId ? "CUSTOMER" : "QUOTATION",
                        priority: followUp.priority ?? "MEDIUM",
                        dueAt: new Date(followUp.dueAt),
                        userId,
                        leadId: quotation.leadId,
                        customerId: quotation.customerId,
                        projectId: quotation.projectId,
                    },
                });
                if (quotation.leadId) {
                    await updateLeadNextFollowUp(tx, quotation.leadId);
                    await tx.leadActivity.create({
                        data: {
                            leadId: quotation.leadId,
                            userId,
                            type: "REMINDER_CREATED",
                            message: `Reminder created: ${reminder.title}`,
                        },
                    });
                }
            }
            return updatedQuotation;
        });
    }
    static async createRevision(quotationId, userId, revisionReason) {
        const quotation = await prisma_1.prisma.quotation.findUnique({
            where: {
                id: quotationId,
            },
            include: {
                items: true,
            },
        });
        if (!quotation) {
            throw new app_error_1.AppError("Quotation not found", 404);
        }
        const childVersion = await prisma_1.prisma.quotation.findFirst({
            where: {
                parentQuotationId: quotation.id,
            },
        });
        if (childVersion) {
            throw new app_error_1.AppError("Revision already exists. Create revision from latest version.", 400);
        }
        if (quotation.status === "DRAFT") {
            throw new app_error_1.AppError("Draft quotation cannot be revised", 400);
        }
        if (quotation.status === "APPROVED") {
            throw new app_error_1.AppError("Approved quotation cannot be revised", 400);
        }
        const latestVersion = quotation.type === client_1.QuotationType.WALK_IN_CUSTOMER
            ? null
            : await prisma_1.prisma.quotation.findFirst({
                where: {
                    leadId: quotation.leadId,
                    projectId: quotation.projectId,
                    phase: quotation.phase,
                },
                orderBy: {
                    version: "desc",
                },
            });
        const version = latestVersion ? latestVersion.version + 1 : quotation.version + 1;
        const settings = await settings_service_1.SettingsService.getSettings();
        return prisma_1.prisma.$transaction(async (tx) => {
            const totalQuotes = await tx.quotation.count();
            const seq = totalQuotes + 1;
            const now = new Date();
            const yyyy = String(now.getFullYear());
            const yy = yyyy.slice(-2);
            const mm = String(now.getMonth() + 1).padStart(2, "0");
            const dd = String(now.getDate()).padStart(2, "0");
            let quotationNumber = settings.quoteNumberFormat
                .replace("{YYYY}", yyyy)
                .replace("{YY}", yy)
                .replace("{MM}", mm)
                .replace("{DD}", dd);
            quotationNumber = quotationNumber.replace("{NNNNN}", String(seq).padStart(5, "0"));
            quotationNumber = quotationNumber.replace("{NNNN}", String(seq).padStart(4, "0"));
            quotationNumber = quotationNumber.replace("{NNN}", String(seq).padStart(3, "0"));
            quotationNumber = quotationNumber.replace("{NN}", String(seq).padStart(2, "0"));
            const existingNo = await tx.quotation.findUnique({
                where: { quotationNumber },
            });
            const finalQuotationNumber = existingNo ? `${quotationNumber}-${Date.now()}` : quotationNumber;
            const newQuotation = await tx.quotation.create({
                data: {
                    quotationNumber: finalQuotationNumber,
                    type: quotation.type,
                    leadId: quotation.leadId,
                    customerId: quotation.customerId,
                    projectId: quotation.projectId,
                    phase: quotation.phase,
                    walkInName: quotation.walkInName,
                    walkInMobile: quotation.walkInMobile,
                    walkInEmail: quotation.walkInEmail,
                    walkInAddress: quotation.walkInAddress,
                    version,
                    status: "DRAFT",
                    subtotal: quotation.subtotal,
                    discountAmount: quotation.discountAmount,
                    totalGst: quotation.totalGst,
                    totalAmount: quotation.totalAmount,
                    notes: quotation.notes,
                    validUntil: quotation.validUntil,
                    parentQuotationId: quotation.id,
                    revisionReason,
                    createdById: userId,
                    companyNameSnapshot: settings.companyName,
                    companyLogoSnapshot: settings.companyLogo,
                    companyGstSnapshot: settings.companyGst,
                    companyAddressSnapshot: settings.companyAddress,
                    companyPhoneSnapshot: settings.companyPhone,
                    companyEmailSnapshot: settings.companyEmail,
                    companyWebsiteSnapshot: settings.companyWebsite,
                    bankNameSnapshot: settings.bankName,
                    bankAccountNoSnapshot: settings.bankAccountNo,
                    bankIfscSnapshot: settings.bankIfsc,
                    bankBranchSnapshot: settings.bankBranch,
                    upiIdSnapshot: settings.upiId,
                    termsAndConditionsSnapshot: settings.termsAndConditions,
                    authorizedSignatureSnapshot: settings.authorizedSignature,
                    footerTextSnapshot: settings.footerText,
                },
            });
            await tx.quotationItem.createMany({
                data: quotation.items.map((item) => ({
                    quotationId: newQuotation.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    costPrice: item.costPrice,
                    marginPercent: item.marginPercent,
                    mrp: item.mrp,
                    discountPercent: item.discountPercent,
                    gstPercent: item.gstPercent,
                    sellingPrice: item.sellingPrice,
                    totalPrice: item.totalPrice,
                })),
            });
            if (newQuotation.projectId) {
                await tx.project.update({
                    where: { id: newQuotation.projectId },
                    data: {
                        estimatedBudget: newQuotation.totalAmount,
                    },
                });
            }
            return newQuotation;
        });
    }
}
exports.QuotationService = QuotationService;
//# sourceMappingURL=quotation.service.js.map