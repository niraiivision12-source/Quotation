"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function mapLeadStatusToOpportunityStatus(status) {
    switch (status) {
        case 'NEW':
            return client_1.OpportunityStatus.NEW;
        case 'CONTACTED':
        case 'NOT_RESPONDING':
            return client_1.OpportunityStatus.CONTACTED;
        case 'QUOTATION_SENT':
            return client_1.OpportunityStatus.QUOTATION_SENT;
        case 'NEGOTIATION':
            return client_1.OpportunityStatus.NEGOTIATION;
        case 'WON':
            return client_1.OpportunityStatus.WON;
        case 'LOST':
            return client_1.OpportunityStatus.LOST;
        default:
            return client_1.OpportunityStatus.NEW;
    }
}
function mapProjectPhaseToProductCategory(phase) {
    switch (phase) {
        case 'PIPES':
            return client_1.ProductCategory.PIPES;
        case 'WIRING':
            return client_1.ProductCategory.WIRES;
        case 'SWITCHES':
            return client_1.ProductCategory.SWITCHES;
        case 'LIGHTS':
            return client_1.ProductCategory.LIGHTS;
        case 'FANS':
            return client_1.ProductCategory.FANS;
        case 'OTHERS':
            return client_1.ProductCategory.OTHERS;
        default:
            return client_1.ProductCategory.OTHERS;
    }
}
async function runMigration() {
    console.log('Starting data migration to new Opportunity system...');
    await prisma.$transaction(async (tx) => {
        // 1. Migrate Leads to Opportunities
        const leads = await tx.lead.findMany({
            include: {
                activities: true,
                notesHistory: true,
            },
        });
        console.log(`Found ${leads.length} legacy leads to migrate.`);
        for (const lead of leads) {
            // Find or create customer
            let customer = await tx.customer.findUnique({
                where: { mobile: lead.mobile },
            });
            if (!customer) {
                customer = await tx.customer.create({
                    data: {
                        name: lead.name,
                        mobile: lead.mobile,
                        email: lead.email,
                        assignedToId: lead.assignedToId,
                        isActive: lead.isActive,
                        city: lead.city,
                        referralDate: lead.referralDate,
                        source: lead.source,
                    },
                });
                console.log(`Created new customer: ${customer.name} (${customer.mobile})`);
            }
            // Create opportunity for this lead
            const opportunity = await tx.opportunity.create({
                data: {
                    customerId: customer.id,
                    category: client_1.ProductCategory.OTHERS, // default for general leads
                    status: mapLeadStatusToOpportunityStatus(lead.status),
                    assignedToId: lead.assignedToId,
                    estimatedValue: lead.estimatedValue,
                    source: lead.source,
                    lostReason: lead.lostReason,
                    nextFollowUpAt: lead.nextFollowUpAt,
                    isActive: lead.isActive,
                    createdAt: lead.createdAt,
                    updatedAt: lead.updatedAt,
                },
            });
            // Update customer leadId connection (if empty)
            if (!customer.leadId) {
                await tx.customer.update({
                    where: { id: customer.id },
                    data: { leadId: lead.id },
                });
            }
            // Update linked quotations
            const quotationsCount = await tx.quotation.updateMany({
                where: { leadId: lead.id },
                data: {
                    opportunityId: opportunity.id,
                    customerId: customer.id,
                },
            });
            // Update linked reminders
            const remindersCount = await tx.reminder.updateMany({
                where: { leadId: lead.id },
                data: {
                    opportunityId: opportunity.id,
                    customerId: customer.id,
                    type: 'OPPORTUNITY',
                },
            });
            // Update linked tasks
            const tasksCount = await tx.task.updateMany({
                where: { leadId: lead.id },
                data: {
                    opportunityId: opportunity.id,
                    customerId: customer.id,
                },
            });
            // Migrate notes to opportunity activities
            for (const note of lead.notesHistory) {
                await tx.opportunityActivity.create({
                    data: {
                        opportunityId: opportunity.id,
                        userId: note.userId,
                        type: 'NOTE_ADDED',
                        message: `Migrated Note: ${note.note}`,
                        createdAt: note.createdAt,
                    },
                });
            }
            // Migrate activities
            for (const act of lead.activities) {
                await tx.opportunityActivity.create({
                    data: {
                        opportunityId: opportunity.id,
                        userId: act.userId,
                        type: act.type,
                        message: act.message,
                        metadata: act.metadata ?? undefined,
                        createdAt: act.createdAt,
                    },
                });
            }
            console.log(`Migrated Lead ${lead.name} -> Opportunity ID ${opportunity.id} (${quotationsCount.count} quotes, ${remindersCount.count} reminders, ${tasksCount.count} tasks updated).`);
        }
        // 2. Migrate Projects to Opportunities
        const projects = await tx.project.findMany({
            include: {
                phaseTracking: true,
                activities: true,
            },
        });
        console.log(`Found ${projects.length} legacy projects to migrate.`);
        for (const project of projects) {
            for (const tracker of project.phaseTracking) {
                // Skip NOT_STARTED or SKIPPED trackers to avoid junk data
                if (tracker.status === 'NOT_STARTED' || tracker.status === 'SKIPPED') {
                    continue;
                }
                const category = mapProjectPhaseToProductCategory(tracker.phase);
                // Check if opportunity already exists for this customer + category combo
                const existingOpp = await tx.opportunity.findFirst({
                    where: {
                        customerId: project.customerId,
                        category,
                    },
                });
                if (existingOpp) {
                    console.log(`Opportunity for customer ${project.customerId} and category ${category} already exists. Skipping.`);
                    continue;
                }
                const opportunity = await tx.opportunity.create({
                    data: {
                        customerId: project.customerId,
                        category,
                        status: tracker.status === 'COMPLETED' ? client_1.OpportunityStatus.WON : client_1.OpportunityStatus.NEW,
                        assignedToId: tracker.assignedToId || project.assignedToId,
                        estimatedValue: tracker.estimatedValue || project.estimatedBudget,
                        source: project.isActive ? 'MANUAL' : 'UNKNOWN',
                        createdAt: tracker.startedAt || tracker.createdAt || project.createdAt,
                        updatedAt: tracker.completedAt || tracker.updatedAt || project.updatedAt,
                    },
                });
                // Update quotations for this project and phase
                const quotationsCount = await tx.quotation.updateMany({
                    where: {
                        projectId: project.id,
                        phase: tracker.phase,
                    },
                    data: {
                        opportunityId: opportunity.id,
                        customerId: project.customerId,
                    },
                });
                // Update payments for this project
                // Note: Legacy payments are linked to the project as a whole.
                // We will link payments to the opportunity that corresponds to the phase of the quote (if quote is linked).
                // For general project payments, we can link them to this opportunity.
                const paymentsCount = await tx.payment.updateMany({
                    where: {
                        projectId: project.id,
                    },
                    data: {
                        opportunityId: opportunity.id,
                    },
                });
                // Update reminders for this project
                const remindersCount = await tx.reminder.updateMany({
                    where: {
                        projectId: project.id,
                    },
                    data: {
                        opportunityId: opportunity.id,
                        customerId: project.customerId,
                        type: 'OPPORTUNITY',
                    },
                });
                // Update tasks for this project
                const tasksCount = await tx.task.updateMany({
                    where: {
                        projectId: project.id,
                    },
                    data: {
                        opportunityId: opportunity.id,
                        customerId: project.customerId,
                    },
                });
                // Migrate project activities to opportunity activities
                for (const act of project.activities) {
                    await tx.opportunityActivity.create({
                        data: {
                            opportunityId: opportunity.id,
                            userId: act.userId,
                            type: act.type,
                            message: act.message,
                            metadata: act.metadata ?? undefined,
                            createdAt: act.createdAt,
                        },
                    });
                }
                console.log(`Migrated Project ${project.projectName} (${tracker.phase}) -> Opportunity ID ${opportunity.id} (${quotationsCount.count} quotes, ${paymentsCount.count} payments, ${remindersCount.count} reminders, ${tasksCount.count} tasks updated).`);
            }
        }
    });
    console.log('Data migration completed successfully!');
}
runMigration()
    .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=data-migration.js.map