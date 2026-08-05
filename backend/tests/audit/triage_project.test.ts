import request from 'supertest';
import app from '../../src/app';
import { PrismaClient, EnquiryStatus, OpportunityStatus, ProjectPhase, LifecycleStatus } from '@prisma/client';

const prisma = new PrismaClient();

describe('Enquiry Triage Project Name Customization', () => {
  let enquiryId: string;
  const uniqueMobile = '+91 9999999999';

  beforeAll(async () => {
    // Cleanup any existing data for the test mobile
    await prisma.opportunityActivity.deleteMany({
      where: { opportunity: { customer: { mobile: uniqueMobile } } }
    });
    await prisma.customerActivity.deleteMany({
      where: { customer: { mobile: uniqueMobile } }
    });
    await prisma.projectPhaseTracking.deleteMany({
      where: { project: { customer: { mobile: uniqueMobile } } }
    });
    await prisma.projectActivity.deleteMany({
      where: { project: { customer: { mobile: uniqueMobile } } }
    });
    await prisma.project.deleteMany({
      where: { customer: { mobile: uniqueMobile } }
    });
    await prisma.opportunity.deleteMany({
      where: { customer: { mobile: uniqueMobile } }
    });
    await prisma.enquiry.deleteMany({
      where: { mobile: uniqueMobile }
    });
    await prisma.customer.deleteMany({
      where: { mobile: uniqueMobile }
    });

    // Seed Owner and Settings if not existing
    const salesmanUser = await prisma.user.findFirst({
      where: { email: 'salesman@test.com' }
    });
    const salesmanId = salesmanUser ? salesmanUser.id : 'test-user-id-salesman';

    await prisma.systemSettings.upsert({
      where: { id: 'default' },
      update: {
        categorySalesmanAssignment: { PIPES: salesmanId }
      },
      create: {
        id: 'default',
        companyName: 'Test Company',
        categorySalesmanAssignment: { PIPES: salesmanId }
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Should create an enquiry', async () => {
    const res = await request(app)
      .post('/api/enquiries')
      .send({
        name: 'Raj Kumar',
        mobile: uniqueMobile,
        email: 'raj.kumar@example.com',
        source: 'MANUAL',
        message: 'Need electrical layout work done.'
      })
      .set('Authorization', 'Bearer test-token-owner');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    enquiryId = res.body.data.id;
    expect(enquiryId).toBeDefined();
  });

  test('Should triage enquiry and create project with custom name', async () => {
    const customProjectName = 'Raj Kumar Residence Electrical Work';

    const res = await request(app)
      .post(`/api/enquiries/${enquiryId}/triage`)
      .send({
        category: 'PIPES',
        notes: 'Some initial notes',
        projectName: customProjectName
      })
      .set('Authorization', 'Bearer test-token-owner');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify the enquiry status is updated
    const updatedEnquiry = await prisma.enquiry.findUnique({
      where: { id: enquiryId }
    });
    expect(updatedEnquiry?.status).toBe(EnquiryStatus.TRIAGED);

    // Verify customer is created
    const customer = await prisma.customer.findUnique({
      where: { mobile: uniqueMobile }
    });
    expect(customer).not.toBeNull();
    expect(customer?.name).toBe('Raj Kumar');

    // Verify project is created with correct name
    const project = await prisma.project.findFirst({
      where: { customerId: customer!.id, projectName: customProjectName }
    });
    expect(project).not.toBeNull();
    expect(project?.currentPhase).toBe(ProjectPhase.PIPES);

    // Verify opportunity is linked to the project and has category/status set
    const opportunity = await prisma.opportunity.findFirst({
      where: { customerId: customer!.id, projectId: project!.id }
    });
    expect(opportunity).not.toBeNull();
    expect(opportunity?.category).toBe('PIPES');
    expect(opportunity?.status).toBe(OpportunityStatus.NEW);

    // Verify project phase tracking records are created
    const tracking = await prisma.projectPhaseTracking.findMany({
      where: { projectId: project!.id }
    });
    expect(tracking.length).toBe(6);

    const pipesTracking = tracking.find(t => t.phase === ProjectPhase.PIPES);
    expect(pipesTracking?.status).toBe(LifecycleStatus.IN_PROGRESS);
  });
});
