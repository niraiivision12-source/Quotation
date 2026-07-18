import { PrismaClient } from '@prisma/client';
import { ProductService } from '../../src/modules/product/product.service';

const prisma = new PrismaClient();

describe('PostgreSQL Search Engine Integration Tests', () => {
  beforeAll(async () => {
    // Ensure clean state
    await prisma.quotationItem.deleteMany({});
    await prisma.product.deleteMany({});
  });

  afterAll(async () => {
    await prisma.quotationItem.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.$disconnect();
  });

  test('Search priority and ranking', async () => {
    // Seed test products
    const p1 = await prisma.product.create({
      data: {
        sku: 'SKU-LEGRAND-001',
        name: 'Legrand Switch 16A',
        brand: 'Legrand',
        category: 'Switches',
        stockQty: 10,
      },
    });

    const p2 = await prisma.product.create({
      data: {
        sku: 'SKU-OTHER-002',
        name: 'Anchor Switch 10A',
        brand: 'Anchor',
        category: 'Switches',
        stockQty: 5,
      },
    });

    const p3 = await prisma.product.create({
      data: {
        sku: 'SWITCH-LEGRAND-BLACK',
        name: 'Legrand Modular Switch Black',
        brand: 'Legrand',
        category: 'Switches',
        stockQty: 8,
      },
    });

    // Test 1: Word order independence
    const res1 = await ProductService.getAll(1, 20, 'switch legrand');
    expect(res1.items.length).toBeGreaterThanOrEqual(2);
    const topIds = res1.items.slice(0, 2).map((i: any) => i.id);
    expect(topIds).toContain(p1.id);
    expect(topIds).toContain(p3.id);

    // Test 2: Typo tolerance
    const res2 = await ProductService.getAll(1, 20, 'legand');
    expect(res2.items.length).toBeGreaterThan(0);
    expect(res2.items[0].brand).toBe('Legrand');

    // Test 3: Exact SKU priority
    const res3 = await ProductService.getAll(1, 20, 'SKU-LEGRAND-001');
    expect(res3.items[0].id).toBe(p1.id);

    // Test 4: Exact Name priority
    const res4 = await ProductService.getAll(1, 20, 'Legrand Switch 16A');
    expect(res4.items[0].id).toBe(p1.id);

    // Test 5: Partial typing / prefix matching
    const res5 = await ProductService.getAll(1, 20, 'anch');
    expect(res5.items[0].id).toBe(p2.id);
  });
});
