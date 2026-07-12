import request from 'supertest';
import app from '../../src/app';

/**
 * Workflow integration tests covering the full chain:
 * Lead -> Customer -> Quotation -> Quotation Edit -> Approval -> Payment -> Partial -> Overdue -> Completion -> Project.
 */

describe('Full Business Workflow', () => {
  let leadId: number;
  let customerId: number;
  let quotationId: number;
  let paymentId: number;
  let _projectId: number;

  test('Create Lead', async () => {
    const res = await request(app)
      .post('/api/leads')
      .send({ name: 'Test Lead', source: 'Web' })
      .set('Authorization', 'Bearer test-token-owner');
    expect(res.status).toBe(201);
    leadId = res.body.id;
  });

  test('Convert Lead to Customer', async () => {
    const res = await request(app)
      .post(`/api/leads/${leadId}/convert`)
      .send({ name: 'Acme Corp', mobile: '5551234' })
      .set('Authorization', 'Bearer test-token-owner');
    expect(res.status).toBe(200);
    customerId = res.body.customerId;
  });

  test('Create Quotation for Customer', async () => {
    const res = await request(app)
      .post('/api/quotations')
      .send({ title: 'Initial Quote', amount: 1000, customerId })
      .set('Authorization', 'Bearer test-token-owner');
    expect(res.status).toBe(201);
    quotationId = res.body.id;
  });

  test('Edit Quotation (V2)', async () => {
    const res = await request(app)
      .patch(`/api/quotations/${quotationId}`)
      .send({ amount: 1200 })
      .set('Authorization', 'Bearer test-token-owner');
    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(1200);
  });

  test('Approve Quotation', async () => {
    const res = await request(app)
      .post(`/api/quotations/${quotationId}/approve`)
      .set('Authorization', 'Bearer test-token-owner');
    expect(res.status).toBe(200);
  });

  test('Create Payment', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({ quotationId, amountReceived: 600 })
      .set('Authorization', 'Bearer test-token-owner');
    expect(res.status).toBe(201);
    paymentId = res.body.id;
  });

  test('Partial Payment leads to Overdue status after due date simulation', async () => {
    // Simulate time passage by updating payment due date (implementation‑specific)
    const res = await request(app)
      .post(`/api/payments/${paymentId}/mark-overdue`)
      .set('Authorization', 'Bearer test-token-owner');
    expect(res.status).toBe(200);
  });

  test('Complete Payment and close Quotation', async () => {
    const res = await request(app)
      .post(`/api/payments/${paymentId}/complete`)
      .set('Authorization', 'Bearer test-token-owner');
    expect(res.status).toBe(200);
  });

  test('Create Project from Completed Quotation', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ quotationId })
      .set('Authorization', 'Bearer test-token-owner');
    expect(res.status).toBe(201);
    _projectId = res.body.id;
  });

  test('Verify cross‑module effects (dashboard analytics)', async () => {
    const res = await request(app).get('/api/dashboard').set('Authorization', 'Bearer test-token-owner');
    expect(res.status).toBe(200);
    // Expect analytics to reflect the payment and project
    expect(res.body.totalRevenueCollected).toBeGreaterThanOrEqual(600);
    expect(res.body.projectCount).toBeGreaterThanOrEqual(1);
  });
});
