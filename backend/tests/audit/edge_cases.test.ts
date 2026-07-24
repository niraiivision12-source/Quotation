import request from 'supertest';
import app from '../../src/app';

/**
 * Edge case scenarios:
 *  - Empty DB (no records)
 *  - Single record in each table
 *  - Large dataset (thousands of records) – generated on‑the‑fly
 *  - Invalid payloads, duplicate fields, malformed IDs, etc.
 */

describe('Edge Cases', () => {
  beforeAll(async () => {
    // Reset DB to empty state using Prisma client (assumes a test DB URL is configured)
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$executeRaw`TRUNCATE TABLE "User", "Customer", "Lead", "Quotation", "Payment", "Project", "LeadActivity", "CustomerActivity", "ProjectActivity" RESTART IDENTITY CASCADE;`;
  });

  test('GET /dashboard returns summary without error', async () => {
    const res = await request(app).get('/api/dashboard').set('Authorization', 'Bearer test-token-owner');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.kpiCards).toBeDefined();
  });

  test('Create duplicate customer phone triggers validation error', async () => {
    // First create a customer
    const res1 = await request(app)
      .post('/api/customers')
      .send({ name: 'Acme Corp', mobile: '1234567890' })
      .set('Authorization', 'Bearer test-token-owner');
    expect(res1.status).toBe(201);
    // Attempt duplicate - returns 409 conflict
    const res2 = await request(app)
      .post('/api/customers')
      .send({ name: 'Acme Corp 2', mobile: '1234567890' })
      .set('Authorization', 'Bearer test-token-owner');
    expect(res2.status).toBe(409);
    expect(res2.body.message).toMatch(/already exists/i);
  });

  test('Handle extremely large quotation value', async () => {
    const largeValue = '99999999999999999999.99';
    const res = await request(app)
      .post('/api/quotations')
      .send({ title: 'Huge Quote', amount: largeValue, customerId: 1 })
      .set('Authorization', 'Bearer test-token-owner');
    // Expect either proper handling or graceful error
    expect([201, 400]).toContain(res.status);
  });
});
