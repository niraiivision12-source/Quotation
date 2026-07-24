import request from 'supertest';
import app from '../../src/app';
import { PrismaClient, ProductCategory, EnquiryStatus, OpportunityStatus, QuotationStatus } from '@prisma/client';

const prisma = new PrismaClient();

describe('Redesigned CRM Full Business Workflow', () => {
  let productId: string;
  let enquiryId: string;
  let customerId: string;
  let opportunityId: string;
  let quotationId: string;
  let paymentId: string;

  beforeAll(async () => {
    // 1. Clean tables
    await prisma.opportunityActivity.deleteMany({});
    await prisma.customerActivity.deleteMany({});
    await prisma.reminder.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.paymentTransaction.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.quotationItem.deleteMany({});
    await prisma.quotation.deleteMany({});
    await prisma.opportunity.deleteMany({});
    await prisma.enquiry.deleteMany({});
    await prisma.customer.deleteMany({});

    // 2. Fetch or create a test product
    let product = await prisma.product.findFirst({
      where: { isActive: true }
    });
    if (!product) {
      product = await prisma.product.create({
        data: {
          sku: 'SKU-WORKFLOW-TEST',
          name: 'Workflow Test Product',
          brand: 'Legrand',
          category: 'Switches',
          costPrice: 50.00,
          mrp: 100.00,
          stockQty: 500,
          isActive: true
        }
      });
    }
    productId = product.id;

    // 3. Ensure systemSettings exists with category assignment
    const salesmanUser = await prisma.user.findFirst({
      where: { email: 'salesman@test.com' }
    });
    const salesmanId = salesmanUser ? salesmanUser.id : 'test-user-id-salesman';

    await prisma.systemSettings.upsert({
      where: { id: 'default' },
      update: {
        categorySalesmanAssignment: {
          PIPES: salesmanId,
          WIRES: salesmanId,
        }
      },
      create: {
        id: 'default',
        companyName: 'Test Company',
        categorySalesmanAssignment: {
          PIPES: salesmanId,
          WIRES: salesmanId,
        }
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Step 1: Webhook receives Whatsapp Message and creates Enquiry', async () => {
    const res = await request(app)
      .post('/api/enquiries')
      .send({
        name: 'John Doe',
        mobile: '9876543210',
        email: 'john@example.com',
        source: 'WHATSAPP',
        message: 'Looking for high quality pipes for my project.'
      })
      .set('Authorization', 'Bearer test-token-owner');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    enquiryId = res.body.data.id;
  });

  test('Step 2: Owner triages Enquiry and assigns Category PIPES', async () => {
    const res = await request(app)
      .post(`/api/enquiries/${enquiryId}/triage`)
      .send({
        category: 'PIPES'
      })
      .set('Authorization', 'Bearer test-token-owner');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.customer).toBeDefined();
    expect(res.body.data.opportunity).toBeDefined();
    customerId = res.body.data.customer.id;
    opportunityId = res.body.data.opportunity.id;

    // Verify Enquiry status is updated
    const updatedEnquiry = await prisma.enquiry.findUnique({ where: { id: enquiryId } });
    expect(updatedEnquiry?.status).toBe(EnquiryStatus.TRIAGED);
  });

  test('Step 3: Salesperson contacts customer and updates Opportunity status', async () => {
    const res = await request(app)
      .patch(`/api/opportunities/${opportunityId}`)
      .send({
        status: 'CONTACTED'
      })
      .set('Authorization', 'Bearer test-token-salesman');

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(OpportunityStatus.CONTACTED);
  });

  test('Step 4: Salesperson creates a Reminder for follow-up', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const res = await request(app)
      .post('/api/reminders')
      .send({
        title: 'Follow up call with John',
        description: 'Discuss pipes specification and quote preparation',
        type: 'OPPORTUNITY',
        priority: 'HIGH',
        dueAt: tomorrow.toISOString(),
        opportunityId: opportunityId,
        customerId: customerId
      })
      .set('Authorization', 'Bearer test-token-salesman');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test('Step 5: Salesperson creates a Quotation for the Opportunity', async () => {
    const res = await request(app)
      .post('/api/quotations')
      .send({
        type: 'CUSTOMER',
        customerId: customerId,
        opportunityId: opportunityId,
        items: [
          {
            productId: productId,
            quantity: 50,
            marginPercent: 10,
            discountPercent: 5
          }
        ],
        notes: 'Special workflow discount applied.'
      })
      .set('Authorization', 'Bearer test-token-salesman');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    quotationId = res.body.data.id;
  });

  test('Step 6: Quotation is Approved (automatically sets Opportunity to WON)', async () => {
    // 1. Move Quotation status to SENT first
    const sentRes = await request(app)
      .patch(`/api/quotations/${quotationId}/status`)
      .send({
        status: 'SENT'
      })
      .set('Authorization', 'Bearer test-token-salesman');
    expect(sentRes.status).toBe(200);

    // 2. Approve Quotation (Approved by Owner)
    const approveRes = await request(app)
      .patch(`/api/quotations/${quotationId}/status`)
      .send({
        status: 'APPROVED'
      })
      .set('Authorization', 'Bearer test-token-owner');

    expect(approveRes.status).toBe(200);

    // Verify Opportunity is automatically marked WON
    const wonOpp = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
    expect(wonOpp?.status).toBe(OpportunityStatus.WON);
  });

  test('Step 7: Payment created (Accountant links bill to Quotation)', async () => {
    // Enable credit for customer first
    await prisma.customer.update({
      where: { id: customerId },
      data: { creditAllowed: true }
    });

    // Get quotation total amount
    const quote = await prisma.quotation.findUnique({ where: { id: quotationId } });
    const totalAmount = Number(quote?.totalAmount || 0);

    const res = await request(app)
      .post('/api/payments/link-bill')
      .send({
        quotationId: quotationId,
        billNumber: 'INV-2026-001',
        billDate: new Date().toISOString(),
        totalBillAmount: totalAmount,
        initialAmountReceived: 100,
        allowCredit: true,
        dueDate: new Date(Date.now() + 86400000 * 30).toISOString()
      })
      .set('Authorization', 'Bearer test-token-accountant');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    paymentId = res.body.data.id;
  });

  test('Step 8: Record transaction (Accountant records second payment)', async () => {
    const res = await request(app)
      .post(`/api/payments/${paymentId}/transactions`)
      .send({
        amount: 200,
        date: new Date().toISOString(),
        paymentMethod: 'UPI',
        referenceNumber: 'TXN-987654321',
        notes: 'Received rest of the advance via UPI'
      })
      .set('Authorization', 'Bearer test-token-accountant');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // Verify updated payment record
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    expect(Number(payment?.amountReceived)).toBe(300); // 100 initial + 200 transaction
  });

  test('Step 9: Verify dashboard stats reflect the Redesigned CRM metrics', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', 'Bearer test-token-owner');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.kpiCards.totalEnquiries).toBeGreaterThanOrEqual(1);
    expect(res.body.data.kpiCards.wonOpportunities).toBeGreaterThanOrEqual(1);
  });
});
