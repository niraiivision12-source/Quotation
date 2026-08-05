import request from 'supertest';
import app from '../../src/app';
import { PrismaClient, OpportunityStatus, ProductCategory, ProjectPhase } from '@prisma/client';

const prisma = new PrismaClient();

describe('Won/Lost Follow-up Workflow Integration Tests', () => {
  let opportunityId: string;
  let customerId: string;
  let salesmanId: string;
  let projectId: string;

  beforeAll(async () => {
    // Ensure we have a salesman user in DB before creating related entities
    let salesmanUser = await prisma.user.findFirst({
      where: { email: 'salesman@test.com' }
    });
    if (!salesmanUser) {
      salesmanUser = await prisma.user.create({
        data: {
          id: 'test-user-id-salesman',
          name: 'Test SALESMAN',
          email: 'salesman@test.com',
          password: 'hashed_password_123',
          role: 'SALESMAN',
          isActive: true
        }
      });
    }
    salesmanId = salesmanUser.id;

    // Create a test customer
    const customer = await prisma.customer.create({
      data: {
        name: 'Test Followup Customer',
        mobile: '+91 9999988888',
        email: 'followup.test@example.com',
        assignedToId: salesmanId,
      }
    });
    customerId = customer.id;

    // Create a test project
    const project = await prisma.project.create({
      data: {
        customerId: customerId,
        projectName: 'Test Progress Project',
        currentPhase: 'PIPES',
        assignedToId: salesmanId,
      }
    });
    projectId = project.id;

    // Create an opportunity in NEW state linked to project
    const opportunity = await prisma.opportunity.create({
      data: {
        customerId: customerId,
        projectId: projectId,
        category: ProductCategory.PIPES,
        status: OpportunityStatus.NEW,
        assignedToId: salesmanId,
        estimatedValue: 150000,
        isActive: true,
      }
    });
    opportunityId = opportunity.id;
  });

  afterAll(async () => {
    // Cleanup the created items
    if (opportunityId) {
      // Find all opportunities for this project
      const opps = await prisma.opportunity.findMany({ where: { projectId } });
      const oppIds = opps.map(o => o.id);
      
      await prisma.reminder.deleteMany({ where: { opportunityId: { in: oppIds } } });
      await prisma.opportunityActivity.deleteMany({ where: { opportunityId: { in: oppIds } } });
      await prisma.opportunity.deleteMany({ where: { projectId } }).catch(() => {});
    }
    if (projectId) {
      await prisma.projectActivity.deleteMany({ where: { projectId } });
      await prisma.project.delete({ where: { id: projectId } }).catch(() => {});
    }
    if (customerId) {
      await prisma.customer.delete({ where: { id: customerId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  test('Patch opportunity to WON should fail if followUp is missing', async () => {
    const res = await request(app)
      .patch(`/api/opportunities/${opportunityId}`)
      .send({
        status: 'WON',
      })
      .set('Authorization', 'Bearer test-token-salesman');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation failed");
    const errors = res.body.errors || [];
    const hasFollowUpError = errors.some((err: any) =>
      err.message.includes("Follow-up is required")
    );
    expect(hasFollowUpError).toBe(true);
  });

  test('Patch opportunity to WON should fail if nextPhase is missing', async () => {
    const res = await request(app)
      .patch(`/api/opportunities/${opportunityId}`)
      .send({
        status: 'WON',
        followUp: {
          title: 'Won client check-in',
          dueAt: new Date(Date.now() + 86400000).toISOString(),
        }
      })
      .set('Authorization', 'Bearer test-token-salesman');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation failed");
    const errors = res.body.errors || [];
    const hasNextPhaseError = errors.some((err: any) =>
      err.message.includes("Next phase is required")
    );
    expect(hasNextPhaseError).toBe(true);
  });

  test('Patch opportunity to LOST should fail if followUp is missing', async () => {
    const res = await request(app)
      .patch(`/api/opportunities/${opportunityId}`)
      .send({
        status: 'LOST',
        lostReason: 'Too expensive',
      })
      .set('Authorization', 'Bearer test-token-salesman');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation failed");
    const errors = res.body.errors || [];
    const hasFollowUpError = errors.some((err: any) =>
      err.message.includes("Follow-up is required")
    );
    expect(hasFollowUpError).toBe(true);
  });

  test('Patch opportunity to LOST should fail if lostReason is missing', async () => {
    const res = await request(app)
      .patch(`/api/opportunities/${opportunityId}`)
      .send({
        status: 'LOST',
        nextPhase: 'LIGHTS',
        followUp: {
          title: 'Lost Client Check-in',
          dueAt: new Date(Date.now() + 86400000 * 30).toISOString(),
        }
      })
      .set('Authorization', 'Bearer test-token-salesman');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation failed");
    const errors = res.body.errors || [];
    const hasLostReasonError = errors.some((err: any) =>
      err.message.includes("Lost reason is required")
    );
    expect(hasLostReasonError).toBe(true);
  });

  test('Patch opportunity to LOST should succeed with followUp, lostReason, and nextPhase', async () => {
    const res = await request(app)
      .patch(`/api/opportunities/${opportunityId}`)
      .send({
        status: 'LOST',
        lostReason: 'Client chose competitor Acme',
        nextPhase: 'LIGHTS',
        followUp: {
          title: 'Future Check-in',
          description: 'Call back in 3 months to check on project phase 2',
          priority: 'LOW',
          dueAt: new Date(Date.now() + 86400000 * 90).toISOString(),
        }
      })
      .set('Authorization', 'Bearer test-token-salesman');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe(OpportunityStatus.LOST);
    expect(res.body.data.lostReason).toBe('Client chose competitor Acme');
    expect(res.body.data.nextPhase).toBe('LIGHTS');

    // 1. Verify project phase was progressed in database
    const dbProject = await prisma.project.findUnique({
      where: { id: projectId }
    });
    expect(dbProject?.currentPhase).toBe(ProjectPhase.LIGHTS);

    // 2. Verify next category opportunity was automatically created
    const nextOpp = await prisma.opportunity.findFirst({
      where: {
        projectId,
        category: ProductCategory.LIGHTS,
      }
    });
    expect(nextOpp).toBeDefined();
    expect(nextOpp?.status).toBe(OpportunityStatus.NEW);

    // 3. Verify reminder is created and duplicates are prevented
    const reminders = await prisma.reminder.findMany({
      where: { opportunityId }
    });
    expect(reminders.length).toBe(1);
    expect(reminders[0].title).toBe('Future Check-in');
    expect(reminders[0].status).toBe('PENDING');
  });
});
