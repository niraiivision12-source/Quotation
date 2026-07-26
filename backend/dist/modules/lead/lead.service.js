"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadService = void 0;
const prisma_1 = require("../../config/prisma");
const app_error_1 = require("../../utils/app-error");
const client_1 = require("@prisma/client");
async function updateLeadNextFollowUp(tx, leadId) {
    const nextReminder = await tx.reminder.findFirst({
        where: {
            leadId,
            status: client_1.ReminderStatus.PENDING,
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
async function createNewReminder(tx, leadId, userId, data) {
    const currentPending = await tx.reminder.findFirst({
        where: { leadId, status: client_1.ReminderStatus.PENDING },
    });
    if (currentPending) {
        await tx.reminder.update({
            where: { id: currentPending.id },
            data: { status: client_1.ReminderStatus.CANCELLED },
        });
        await tx.leadActivity.create({
            data: {
                leadId,
                userId,
                type: "UPDATED",
                message: `Cancelled previous pending reminder: ${currentPending.title}`,
            },
        });
    }
    const reminder = await tx.reminder.create({
        data: {
            title: data.title,
            description: data.description,
            type: "LEAD",
            priority: data.priority,
            dueAt: data.dueAt,
            userId,
            leadId,
        },
    });
    await tx.leadActivity.create({
        data: {
            leadId,
            userId,
            type: "REMINDER_CREATED",
            message: `Reminder created: ${reminder.title}`,
        },
    });
    return reminder;
}
class LeadService {
    static async checkMobileExists(mobile) {
        const [existingLead, existingCustomer] = await Promise.all([
            prisma_1.prisma.lead.findFirst({ where: { mobile }, select: { id: true } }),
            prisma_1.prisma.customer.findUnique({ where: { mobile }, select: { id: true } }),
        ]);
        if (existingLead) {
            return { exists: true, message: "This person is already registered as a lead" };
        }
        if (existingCustomer) {
            return { exists: true, message: "This person already exists as a customer" };
        }
        return { exists: false };
    }
    static async create(data) {
        const exists = await prisma_1.prisma.lead.findFirst({
            where: {
                mobile: data.mobile,
            },
        });
        if (exists) {
            throw new app_error_1.AppError("Lead already exists", 409);
        }
        return prisma_1.prisma.$transaction(async (tx) => {
            // Fetch assignment settings
            let settings = await tx.systemSettings.findUnique({
                where: { id: "default" },
            });
            if (!settings) {
                // Fallback: seed default settings
                settings = await tx.systemSettings.create({
                    data: {
                        id: "default",
                        leadAssignmentMethod: "MANUAL",
                        companyName: "NKP Construction",
                        companyGst: "",
                        companyAddress: "",
                        companyPhone: "",
                        companyEmail: "",
                        companyWebsite: "",
                        bankName: "",
                        bankAccountNo: "",
                        bankIfsc: "",
                        bankBranch: "",
                        upiId: "",
                        termsAndConditions: "",
                        footerText: "",
                        rolePermissions: {},
                    },
                });
            }
            let assignedToId = data.assignedToId || null;
            if (settings.leadAssignmentMethod !== "MANUAL") {
                // Fetch active salesmen
                const activeSalesmen = await tx.user.findMany({
                    where: {
                        role: "SALESMAN",
                        isActive: true,
                    },
                    orderBy: { id: "asc" },
                });
                if (activeSalesmen.length === 0) {
                    throw new app_error_1.AppError("No active salesmen available for automatic assignment", 400);
                }
                if (settings.leadAssignmentMethod === "PERCENTAGE") {
                    const percentages = settings.leadSalesmanPercentages || {};
                    const activePercentages = activeSalesmen
                        .map((s) => ({
                        id: s.id,
                        weight: percentages[s.id] || 0,
                    }))
                        .filter((p) => p.weight > 0);
                    if (activePercentages.length === 0) {
                        throw new app_error_1.AppError("No active salesmen have a configured assignment percentage", 400);
                    }
                    const totalWeight = activePercentages.reduce((sum, item) => sum + item.weight, 0);
                    const randomVal = Math.random() * totalWeight;
                    let cumulativeWeight = 0;
                    let selectedSalesmanId = activePercentages[0].id;
                    for (const item of activePercentages) {
                        cumulativeWeight += item.weight;
                        if (randomVal <= cumulativeWeight) {
                            selectedSalesmanId = item.id;
                            break;
                        }
                    }
                    assignedToId = selectedSalesmanId;
                }
                else if (settings.leadAssignmentMethod === "ROUND_ROBIN") {
                    const lastAssignedId = settings.lastLeadAssignedUserId;
                    let nextIndex = 0;
                    if (lastAssignedId) {
                        const index = activeSalesmen.findIndex((s) => s.id === lastAssignedId);
                        if (index !== -1) {
                            nextIndex = (index + 1) % activeSalesmen.length;
                        }
                    }
                    const selectedSalesman = activeSalesmen[nextIndex];
                    assignedToId = selectedSalesman.id;
                    // Save last assigned user ID
                    await tx.systemSettings.update({
                        where: { id: "default" },
                        data: {
                            lastLeadAssignedUserId: assignedToId,
                        },
                    });
                }
            }
            else if (assignedToId) {
                // Manual assignment validation
                const salesman = await tx.user.findFirst({
                    where: { id: assignedToId, role: "SALESMAN", isActive: true },
                });
                if (!salesman) {
                    throw new app_error_1.AppError("The assigned salesman is inactive or does not exist", 400);
                }
            }
            const lead = await tx.lead.create({
                data: {
                    name: data.name,
                    mobile: data.mobile,
                    email: data.email,
                    city: data.city,
                    source: data.source,
                    notes: data.notes,
                    assignedToId,
                },
            });
            await tx.leadActivity.create({
                data: {
                    leadId: lead.id,
                    type: "CREATED",
                    message: "Lead created",
                },
            });
            return lead;
        });
    }
    static async getAll(page, limit, search, filters) {
        const skip = (page - 1) * limit;
        const where = {
            isActive: true,
            ...(filters?.source && { source: filters.source }),
            ...(filters?.status && { status: filters.status }),
            ...(filters?.assignedToId && { assignedToId: filters.assignedToId }),
            ...(filters?.city && {
                city: { contains: filters.city, mode: "insensitive" },
            }),
            ...((filters?.dateFrom || filters?.dateTo) && {
                createdAt: {
                    ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
                    ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
                },
            }),
            ...(filters?.phase && {
                quotations: {
                    some: { phase: filters.phase },
                },
            }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { mobile: { contains: search } },
                ],
            }),
        };
        const [items, total] = await Promise.all([
            prisma_1.prisma.lead.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: "desc",
                },
                include: {
                    assignedTo: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    quotations: {
                        select: {
                            phase: true,
                        },
                    },
                    notesHistory: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                        orderBy: {
                            createdAt: "desc",
                        },
                    },
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
            where: {
                id,
                isActive: true,
            },
            include: {
                customer: true,
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                activities: {
                    orderBy: {
                        createdAt: "desc",
                    },
                },
                notesHistory: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },
                quotations: {
                    include: {
                        items: {
                            include: {
                                product: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },
                reminders: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: {
                        dueAt: "desc",
                    },
                },
            },
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
        return prisma_1.prisma.$transaction(async (tx) => {
            // Find latest active quotation for this lead
            const latestQuotation = await tx.quotation.findFirst({
                where: { leadId, status: { in: ["APPROVED", "SENT", "DRAFT"] } },
                orderBy: { createdAt: "desc" },
            });
            const estimatedBudget = latestQuotation
                ? latestQuotation.totalAmount
                : null;
            let customer = await tx.customer.findUnique({
                where: {
                    mobile: lead.mobile,
                },
            });
            if (!customer) {
                customer = await tx.customer.create({
                    data: {
                        name: lead.name,
                        mobile: lead.mobile,
                        email: lead.email,
                        assignedToId: lead.assignedToId,
                        leadId: lead.id,
                    },
                });
                await tx.customerActivity.create({
                    data: {
                        customerId: customer.id,
                        type: "CREATED",
                        message: "Customer created from lead conversion",
                    },
                });
            }
            else if (!customer.leadId) {
                customer = await tx.customer.update({
                    where: { id: customer.id },
                    data: { leadId: lead.id },
                });
            }
            // Find or create project
            let project = await tx.project.findFirst({
                where: {
                    customerId: customer.id,
                },
            });
            const phases = [
                client_1.ProjectPhase.PIPES,
                client_1.ProjectPhase.WIRING,
                client_1.ProjectPhase.SWITCHES,
                client_1.ProjectPhase.LIGHTS,
                client_1.ProjectPhase.FANS,
                client_1.ProjectPhase.OTHERS,
            ];
            const selectedPhase = data.currentPhase;
            const selectedIndex = phases.indexOf(selectedPhase);
            if (project) {
                // Update existing project details
                const updatedProject = await tx.project.update({
                    where: { id: project.id },
                    data: {
                        projectName: data.projectName,
                        location: data.location ?? project.location,
                        estimatedBudget: estimatedBudget ?? project.estimatedBudget,
                        currentPhase: selectedPhase,
                    },
                });
                project = updatedProject;
                const projId = updatedProject.id;
                await tx.projectActivity.create({
                    data: {
                        projectId: projId,
                        type: "UPDATED",
                        message: "Project details updated from lead conversion",
                    },
                });
                // Delete existing phase tracking and recreate to sync with currentPhase
                await tx.projectPhaseTracking.deleteMany({
                    where: { projectId: projId },
                });
                const phaseTrackings = phases.map((phase, i) => {
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
                    return {
                        projectId: projId,
                        phase,
                        status,
                        startedAt,
                        completedAt,
                    };
                });
                await tx.projectPhaseTracking.createMany({
                    data: phaseTrackings,
                });
                await tx.projectActivity.create({
                    data: {
                        projectId: projId,
                        type: "PHASE_CHANGED",
                        message: `Project phase initialized to ${selectedPhase}`,
                    },
                });
            }
            else {
                const newProject = await tx.project.create({
                    data: {
                        customerId: customer.id,
                        projectName: data.projectName,
                        location: data.location,
                        estimatedBudget,
                        assignedToId: lead.assignedToId,
                        currentPhase: selectedPhase,
                    },
                });
                project = newProject;
                const projId = newProject.id;
                await tx.projectActivity.create({
                    data: {
                        projectId: projId,
                        type: "CREATED",
                        message: "Project created from lead conversion",
                    },
                });
                const phaseTrackings = phases.map((phase, i) => {
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
                    return {
                        projectId: projId,
                        phase,
                        status,
                        startedAt,
                        completedAt,
                    };
                });
                await tx.projectPhaseTracking.createMany({
                    data: phaseTrackings,
                });
                await tx.projectActivity.create({
                    data: {
                        projectId: projId,
                        type: "PHASE_CHANGED",
                        message: `Project phase initialized to ${selectedPhase}`,
                    },
                });
            }
            // Link existing lead quotations to the project
            await tx.quotation.updateMany({
                where: { leadId },
                data: { projectId: project.id },
            });
            // Update lead status to WON if it's not already
            if (lead.status !== client_1.LeadStatus.WON) {
                await tx.lead.update({
                    where: {
                        id: lead.id,
                    },
                    data: {
                        status: client_1.LeadStatus.WON,
                        convertedAt: new Date(),
                    },
                });
                await tx.leadActivity.create({
                    data: {
                        leadId: lead.id,
                        type: "CONVERTED",
                        message: "Lead converted to customer",
                        metadata: {
                            customerId: customer.id,
                            projectId: project?.id,
                        },
                    },
                });
            }
            return {
                customer,
                project,
            };
        });
    }
    static async update(id, userId, data) {
        const lead = await prisma_1.prisma.lead.findUnique({
            where: { id },
        });
        if (!lead) {
            throw new app_error_1.AppError("Lead not found", 404);
        }
        if (data.mobile && data.mobile !== lead.mobile) {
            const exists = await prisma_1.prisma.lead.findFirst({
                where: {
                    mobile: data.mobile,
                    NOT: {
                        id,
                    },
                },
            });
            if (exists) {
                throw new app_error_1.AppError("Mobile already exists", 409);
            }
        }
        const updateData = {
            name: data.name,
            mobile: data.mobile,
            email: data.email,
            city: data.city,
            source: data.source,
            assignedToId: data.assignedToId,
        };
        const isStatusChanged = data.status && data.status !== lead.status;
        const targetStatus = data.status;
        return prisma_1.prisma.$transaction(async (tx) => {
            if (isStatusChanged) {
                const allowedTransitions = {
                    NEW: ["CONTACTED", "NOT_RESPONDING"],
                    CONTACTED: ["NOT_RESPONDING", "QUOTATION_SENT"],
                    NOT_RESPONDING: ["CONTACTED", "QUOTATION_SENT", "LOST"],
                    QUOTATION_SENT: ["NEGOTIATION", "WON", "LOST"],
                    NEGOTIATION: ["WON", "LOST"],
                    WON: [],
                    LOST: ["NOT_RESPONDING"],
                };
                if (!allowedTransitions[lead.status].includes(targetStatus)) {
                    throw new app_error_1.AppError(`Cannot change lead status from ${lead.status} to ${targetStatus}`, 400);
                }
                updateData.status = targetStatus;
                if (targetStatus === "CONTACTED") {
                    if (!data.notes || data.notes.trim() === "") {
                        throw new app_error_1.AppError("Notes are required when status is CONTACTED", 400);
                    }
                    const rawDueAt = data.followUpDate || data.followUp?.dueAt;
                    if (!rawDueAt) {
                        throw new app_error_1.AppError("Follow-up date & time are required when status is CONTACTED", 400);
                    }
                    const dueAt = new Date(rawDueAt);
                    await tx.leadNote.create({
                        data: {
                            leadId: lead.id,
                            userId,
                            note: data.notes,
                        },
                    });
                    updateData.lastContactedAt = new Date();
                    await tx.leadActivity.create({
                        data: {
                            leadId: lead.id,
                            userId,
                            type: "STATUS_CHANGED",
                            message: `Status changed from ${lead.status} to CONTACTED`,
                            metadata: { oldStatus: lead.status, newStatus: "CONTACTED" },
                        },
                    });
                    await tx.leadActivity.create({
                        data: {
                            leadId: lead.id,
                            userId,
                            type: "UPDATED",
                            message: "Note added",
                        },
                    });
                    const reminder = await createNewReminder(tx, lead.id, userId, {
                        title: data.followUp?.title ?? `Follow up with ${lead.name}`,
                        description: data.followUp?.description,
                        priority: data.followUp?.priority ?? "MEDIUM",
                        dueAt,
                    });
                    updateData.nextFollowUpAt = reminder.dueAt;
                }
                else if (targetStatus === "NOT_RESPONDING") {
                    const rawDueAt = data.followUpDate || data.followUp?.dueAt;
                    if (!rawDueAt) {
                        throw new app_error_1.AppError("Follow-up date & time are required when status is NOT_RESPONDING", 400);
                    }
                    const dueAt = new Date(rawDueAt);
                    const reminder = await createNewReminder(tx, lead.id, userId, {
                        title: data.followUp?.title ??
                            `Follow up with ${lead.name} (Not Responding)`,
                        description: data.followUp?.description,
                        priority: data.followUp?.priority ?? "MEDIUM",
                        dueAt,
                    });
                    updateData.nextFollowUpAt = reminder.dueAt;
                    if (data.notes && data.notes.trim() !== "") {
                        await tx.leadNote.create({
                            data: {
                                leadId: lead.id,
                                userId,
                                note: data.notes,
                            },
                        });
                        await tx.leadActivity.create({
                            data: {
                                leadId: lead.id,
                                userId,
                                type: "UPDATED",
                                message: "Note added",
                            },
                        });
                    }
                    await tx.leadActivity.create({
                        data: {
                            leadId: lead.id,
                            userId,
                            type: "STATUS_CHANGED",
                            message: `Status changed from ${lead.status} to NOT_RESPONDING`,
                            metadata: { oldStatus: lead.status, newStatus: "NOT_RESPONDING" },
                        },
                    });
                }
                else if (targetStatus === "QUOTATION_SENT") {
                    // It's allowed for post-quotation-creation popup.
                    if (!data.notes || data.notes.trim() === "") {
                        throw new app_error_1.AppError("Notes are required when status is QUOTATION_SENT", 400);
                    }
                    await tx.leadNote.create({
                        data: {
                            leadId: lead.id,
                            userId,
                            note: data.notes,
                        },
                    });
                    await tx.leadActivity.create({
                        data: {
                            leadId: lead.id,
                            userId,
                            type: "STATUS_CHANGED",
                            message: `Status changed from ${lead.status} to QUOTATION_SENT`,
                            metadata: { oldStatus: lead.status, newStatus: "QUOTATION_SENT" },
                        },
                    });
                    await tx.leadActivity.create({
                        data: {
                            leadId: lead.id,
                            userId,
                            type: "UPDATED",
                            message: "Note added after quotation creation",
                        },
                    });
                    if (data.followUpDate || data.followUp?.dueAt) {
                        const dueAt = new Date((data.followUpDate || data.followUp?.dueAt));
                        const reminder = await createNewReminder(tx, lead.id, userId, {
                            title: data.followUp?.title ??
                                `Follow up with ${lead.name} (Quotation Sent)`,
                            description: data.followUp?.description,
                            priority: data.followUp?.priority ?? "MEDIUM",
                            dueAt,
                        });
                        updateData.nextFollowUpAt = reminder.dueAt;
                    }
                }
                else if (targetStatus === "NEGOTIATION") {
                    if (!data.notes || data.notes.trim() === "") {
                        throw new app_error_1.AppError("Notes are required when status is NEGOTIATION", 400);
                    }
                    const rawDueAt = data.followUpDate || data.followUp?.dueAt;
                    if (!rawDueAt) {
                        throw new app_error_1.AppError("Follow-up date & time are required when status is NEGOTIATION", 400);
                    }
                    const dueAt = new Date(rawDueAt);
                    if (!data.reason || data.reason.trim() === "") {
                        throw new app_error_1.AppError("Negotiation reason is required when status is NEGOTIATION", 400);
                    }
                    await tx.leadNote.create({
                        data: {
                            leadId: lead.id,
                            userId,
                            note: data.notes,
                        },
                    });
                    await tx.leadActivity.create({
                        data: {
                            leadId: lead.id,
                            userId,
                            type: "STATUS_CHANGED",
                            message: `Status changed from ${lead.status} to NEGOTIATION. Reason: ${data.reason}`,
                            metadata: {
                                oldStatus: lead.status,
                                newStatus: "NEGOTIATION",
                                reason: data.reason,
                            },
                        },
                    });
                    await tx.leadActivity.create({
                        data: {
                            leadId: lead.id,
                            userId,
                            type: "UPDATED",
                            message: "Note added",
                        },
                    });
                    const reminder = await createNewReminder(tx, lead.id, userId, {
                        title: data.followUp?.title ??
                            `Follow up with ${lead.name} (Negotiation)`,
                        description: data.followUp?.description,
                        priority: data.followUp?.priority ?? "MEDIUM",
                        dueAt,
                    });
                    updateData.nextFollowUpAt = reminder.dueAt;
                }
                else if (targetStatus === "LOST") {
                    if (!data.notes || data.notes.trim() === "") {
                        throw new app_error_1.AppError("Notes are required when status is LOST", 400);
                    }
                    const allowedLostReasons = [
                        "price",
                        "competitor",
                        "cancelled",
                        "budget",
                        "no response",
                        "other",
                    ];
                    if (!data.reason ||
                        !allowedLostReasons.includes(data.reason.toLowerCase())) {
                        throw new app_error_1.AppError("Invalid lost reason. Allowed values are: Price, Competitor, Cancelled, Budget, No Response, Other", 400);
                    }
                    updateData.lostReason = data.reason;
                    await tx.leadNote.create({
                        data: {
                            leadId: lead.id,
                            userId,
                            note: data.notes,
                        },
                    });
                    await tx.leadActivity.create({
                        data: {
                            leadId: lead.id,
                            userId,
                            type: "STATUS_CHANGED",
                            message: `Lead marked as lost. Reason: ${data.reason}`,
                            metadata: {
                                oldStatus: lead.status,
                                newStatus: "LOST",
                                reason: data.reason,
                            },
                        },
                    });
                    await tx.leadActivity.create({
                        data: {
                            leadId: lead.id,
                            userId,
                            type: "UPDATED",
                            message: "Note added",
                        },
                    });
                    const rawDueAt = data.followUpDate || data.followUp?.dueAt;
                    if (rawDueAt) {
                        const dueAt = new Date(rawDueAt);
                        const reminder = await createNewReminder(tx, lead.id, userId, {
                            title: data.followUp?.title ?? `Follow up with ${lead.name} (Lost)`,
                            description: data.followUp?.description,
                            priority: data.followUp?.priority ?? "MEDIUM",
                            dueAt,
                        });
                        updateData.nextFollowUpAt = reminder.dueAt;
                    }
                }
                else if (targetStatus === "WON") {
                    if (data.notes && data.notes.trim() !== "") {
                        await tx.leadNote.create({
                            data: {
                                leadId: lead.id,
                                userId,
                                note: data.notes,
                            },
                        });
                        await tx.leadActivity.create({
                            data: {
                                leadId: lead.id,
                                userId,
                                type: "UPDATED",
                                message: "Note added",
                            },
                        });
                    }
                    await tx.leadActivity.create({
                        data: {
                            leadId: lead.id,
                            userId,
                            type: "STATUS_CHANGED",
                            message: `Status changed from ${lead.status} to WON`,
                            metadata: { oldStatus: lead.status, newStatus: "WON" },
                        },
                    });
                }
            }
            else {
                if (data.notes && data.notes.trim() !== "") {
                    await tx.leadNote.create({
                        data: {
                            leadId: lead.id,
                            userId,
                            note: data.notes,
                        },
                    });
                    await tx.leadActivity.create({
                        data: {
                            leadId: lead.id,
                            userId,
                            type: "UPDATED",
                            message: "Note added",
                        },
                    });
                }
                if (data.followUp) {
                    await createNewReminder(tx, lead.id, userId, {
                        title: data.followUp.title ?? `Follow up with ${lead.name}`,
                        description: data.followUp.description,
                        priority: data.followUp.priority ?? "MEDIUM",
                        dueAt: new Date(data.followUp.dueAt),
                    });
                    await updateLeadNextFollowUp(tx, lead.id);
                }
            }
            const updatedLead = await tx.lead.update({
                where: { id },
                data: updateData,
            });
            return updatedLead;
        });
    }
    static async getStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const [total, notResponding, won, lost, todayFollowUp] = await Promise.all([
            prisma_1.prisma.lead.count({ where: { isActive: true } }),
            prisma_1.prisma.lead.count({
                where: { isActive: true, status: "NOT_RESPONDING" },
            }),
            prisma_1.prisma.lead.count({ where: { isActive: true, status: "WON" } }),
            prisma_1.prisma.lead.count({ where: { isActive: true, status: "LOST" } }),
            prisma_1.prisma.lead.count({
                where: {
                    isActive: true,
                    nextFollowUpAt: { gte: today, lt: tomorrow },
                },
            }),
        ]);
        return {
            total,
            followUp: notResponding,
            notResponding,
            won,
            lost,
            todayFollowUp,
        };
    }
    static async deactivate(id) {
        const lead = await prisma_1.prisma.lead.findUnique({
            where: { id },
        });
        if (!lead) {
            throw new app_error_1.AppError("Lead not found", 404);
        }
        return prisma_1.prisma.lead.update({
            where: { id },
            data: {
                isActive: false,
            },
        });
    }
}
exports.LeadService = LeadService;
//# sourceMappingURL=lead.service.js.map