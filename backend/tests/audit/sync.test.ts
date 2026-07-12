import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Sync Module Integration Tests', () => {
  const syncKey = 'd65f2faf60a0a9e62735c90df386be1c1271c1e5041a698ffc35aba292380b1d';

  beforeEach(async () => {
    // Clean products, units, stock groups
    await prisma.product.deleteMany({});
    await prisma.unit.deleteMany({});
    await prisma.stockGroup.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Authentication', () => {
    test('Reject sync request if Authorization header is missing', async () => {
      const res = await request(app)
        .post('/api/sync/stock-groups')
        .send([]);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/missing authorization/i);
    });

    test('Reject sync request if API key is invalid', async () => {
      const res = await request(app)
        .post('/api/sync/stock-groups')
        .set('Authorization', 'Bearer invalid_key')
        .send([]);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid api key/i);
    });
  });

  describe('Stock Group Sync', () => {
    test('Successfully sync new stock groups', async () => {
      const payload = [
        {
          tallyMasterId: 'sg-guid-1111',
          tallyGuid: 'sg-guid-1111',
          tallyAlterId: 1001,
          name: 'Electronics',
          parentName: null,
          isActive: true
        },
        {
          tallyMasterId: 'sg-guid-2222',
          tallyGuid: 'sg-guid-2222',
          tallyAlterId: 1002,
          name: 'Mobile Phones',
          parentName: 'Electronics',
          isActive: true
        }
      ];

      const res = await request(app)
        .post('/api/sync/stock-groups')
        .set('Authorization', `Bearer ${syncKey}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Processed successfully',
        count: 2,
        inserted: 2,
        updated: 0,
        attached: 0,
        failed: 0
      });

      // Verify db state
      const dbGroups = await prisma.stockGroup.findMany({
        orderBy: { name: 'asc' }
      });
      expect(dbGroups.length).toBe(2);
      expect(dbGroups[0].name).toBe('Electronics');
      expect(dbGroups[1].name).toBe('Mobile Phones');
      expect(dbGroups[1].parentName).toBe('Electronics');
    });

    test('Successfully update existing stock groups (Idempotency)', async () => {
      // First sync
      const payload = [
        {
          tallyMasterId: 'sg-guid-1111',
          tallyGuid: 'sg-guid-1111',
          tallyAlterId: 1001,
          name: 'Electronics',
          parentName: null,
          isActive: true
        }
      ];
      await request(app)
        .post('/api/sync/stock-groups')
        .set('Authorization', `Bearer ${syncKey}`)
        .send(payload);

      // Update payload
      const updatePayload = [
        {
          tallyMasterId: 'sg-guid-1111',
          tallyGuid: 'sg-guid-1111',
          tallyAlterId: 1002, // incremented AlterId
          name: 'Electronics & Gadgets', // updated name
          parentName: null,
          isActive: true
        }
      ];

      const res = await request(app)
        .post('/api/sync/stock-groups')
        .set('Authorization', `Bearer ${syncKey}`)
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(1);
      expect(res.body.inserted).toBe(0);

      const dbGroup = await prisma.stockGroup.findUnique({
        where: { tallyMasterId: 'sg-guid-1111' }
      });
      expect(dbGroup.name).toBe('Electronics & Gadgets');
      expect(dbGroup.tallyAlterId).toBe(1002);
    });

    test('Return validation failure format on malformed group payload', async () => {
      const badPayload = [
        {
          tallyGuid: 'sg-guid-1111',
          // missing tallyMasterId and name
        }
      ];

      const res = await request(app)
        .post('/api/sync/stock-groups')
        .set('Authorization', `Bearer ${syncKey}`)
        .send(badPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/validation failed/i);
    });
  });

  describe('Unit Sync', () => {
    test('Successfully sync units', async () => {
      const payload = [
        {
          tallyMasterId: 'unit-guid-1111',
          tallyGuid: 'unit-guid-1111',
          tallyAlterId: 2001,
          name: 'Pieces',
          symbol: 'Pcs',
          isActive: true
        }
      ];

      const res = await request(app)
        .post('/api/sync/units')
        .set('Authorization', `Bearer ${syncKey}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.inserted).toBe(1);

      const dbUnit = await prisma.unit.findUnique({
        where: { tallyMasterId: 'unit-guid-1111' }
      });
      expect(dbUnit.symbol).toBe('Pcs');
      expect(dbUnit.name).toBe('Pieces');
    });
  });

  describe('Product (Stock Item) Sync', () => {
    test('Sync product and resolve relationships successfully', async () => {
      // 1. Setup groups & units first
      await prisma.stockGroup.create({
        data: {
          tallyMasterId: 'sg-guid-2222',
          name: 'Mobile Phones',
          tallyAlterId: 1002
        }
      });
      await prisma.unit.create({
        data: {
          tallyMasterId: 'unit-guid-1111',
          name: 'Pieces',
          symbol: 'Pcs',
          tallyAlterId: 2001
        }
      });

      // 2. Sync product referencing by Name
      const productPayload = [
        {
          tallyMasterId: 'item-guid-1111',
          tallyGuid: 'item-guid-1111',
          tallyAlterId: 3001,
          sku: 'item-guid-1111',
          name: 'iPhone 15 Pro',
          brand: null,
          category: 'Mobile Phones',
          costPrice: 0,
          stockQty: 0,
          tallyStockQty: 8,
          stockGroupId: 'Mobile Phones', // Name resolution
          unitId: 'Pieces', // Name resolution
          isActive: true
        }
      ];

      const res = await request(app)
        .post('/api/sync/products')
        .set('Authorization', `Bearer ${syncKey}`)
        .send(productPayload);

      expect(res.status).toBe(200);
      expect(res.body.inserted).toBe(1);

      // Verify DB mapping resolved name to GUID
      const dbProduct = await prisma.product.findUnique({
        where: { tallyMasterId: 'item-guid-1111' }
      });
      expect(dbProduct.stockGroupId).toBe('sg-guid-2222');
      expect(dbProduct.unitId).toBe('unit-guid-1111');
      expect(dbProduct.tallyStockQty).toBe(8);
    });

    test('Sync product and resolve relation by symbol / abbreviation', async () => {
      await prisma.unit.create({
        data: {
          tallyMasterId: 'unit-guid-1111',
          name: 'Pieces',
          symbol: 'Pcs',
          tallyAlterId: 2001
        }
      });

      const productPayload = [
        {
          tallyMasterId: 'item-guid-1111',
          tallyGuid: 'item-guid-1111',
          tallyAlterId: 3001,
          sku: 'item-guid-1111',
          name: 'iPhone 15 Pro',
          brand: null,
          category: 'Mobile Phones',
          costPrice: 0,
          stockQty: 0,
          tallyStockQty: 8,
          stockGroupId: null,
          unitId: 'Pcs', // Symbol resolution
          isActive: true
        }
      ];

      const res = await request(app)
        .post('/api/sync/products')
        .set('Authorization', `Bearer ${syncKey}`)
        .send(productPayload);

      expect(res.status).toBe(200);
      expect(res.body.inserted).toBe(1);

      const dbProduct = await prisma.product.findUnique({
        where: { tallyMasterId: 'item-guid-1111' }
      });
      expect(dbProduct.unitId).toBe('unit-guid-1111');
    });

    test('Sync product with missing/unresolved relations gracefully maps to null without failing', async () => {
      const productPayload = [
        {
          tallyMasterId: 'item-guid-2222',
          tallyGuid: 'item-guid-2222',
          tallyAlterId: 3002,
          sku: 'item-guid-2222',
          name: 'USB-C Cable',
          brand: null,
          category: 'Electronics',
          costPrice: 0,
          stockQty: 0,
          tallyStockQty: 50,
          stockGroupId: 'Electronics', // Doesn't exist in DB
          unitId: 'Box', // Doesn't exist in DB
          isActive: true
        }
      ];

      const res = await request(app)
        .post('/api/sync/products')
        .set('Authorization', `Bearer ${syncKey}`)
        .send(productPayload);

      expect(res.status).toBe(200);
      expect(res.body.inserted).toBe(1);

      const dbProduct = await prisma.product.findUnique({
        where: { tallyMasterId: 'item-guid-2222' }
      });
      expect(dbProduct.stockGroupId).toBeNull();
      expect(dbProduct.unitId).toBeNull();
      expect(dbProduct.tallyStockQty).toBe(50);
    });

    test('Attach Tally identity to existing product by matching SKU', async () => {
      // Create product manually without tally sync fields
      await prisma.product.create({
        data: {
          sku: 'sku-manual-123',
          name: 'Manual Product',
          costPrice: 100,
          stockQty: 10
        }
      });

      const payload = [
        {
          tallyMasterId: 'item-guid-3333',
          tallyGuid: 'item-guid-3333',
          tallyAlterId: 3003,
          sku: 'sku-manual-123', // Matches manually created product's SKU
          name: 'Manual Product Updated',
          brand: null,
          category: 'Hardware',
          costPrice: 90,
          stockQty: 0,
          tallyStockQty: 15,
          stockGroupId: null,
          unitId: null,
          isActive: true
        }
      ];

      const res = await request(app)
        .post('/api/sync/products')
        .set('Authorization', `Bearer ${syncKey}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.attached).toBe(1);
      expect(res.body.inserted).toBe(0);

      const dbProduct = await prisma.product.findUnique({
        where: { sku: 'sku-manual-123' }
      });
      expect(dbProduct.tallyMasterId).toBe('item-guid-3333');
      expect(dbProduct.tallyStockQty).toBe(15);
      expect(dbProduct.stockQty).toBe(15); // should be updated to tally stock qty
    });
  });
});
