import { PrismaClient } from '@prisma/client';
import { ProductService } from '../../src/modules/product/product.service';

const prisma = new PrismaClient();

describe('Comprehensive PostgreSQL Search Engine Scenario Tests', () => {
  let activeLegrandSwitch16: any;
  let activeLegrandSwitch16Black: any;
  let activeAnchorSwitch10: any;
  let activeLegrandSocket20: any;
  let inactiveLegrandSocket20: any;
  let activeFybrosWire: any;
  let activeLtMcb16: any;

  beforeAll(async () => {
    // 1. Clean database tables
    await prisma.quotationItem.deleteMany({});
    await prisma.product.deleteMany({});

    // 2. Insert diverse test products representing various edge cases
    activeLegrandSwitch16 = await prisma.product.create({
      data: {
        sku: 'SKU-LEG-16A-WHT',
        name: 'Legrand Switch 16A White',
        brand: 'Legrand',
        category: 'Switches',
        stockQty: 100,
        isActive: true,
      },
    });

    activeLegrandSwitch16Black = await prisma.product.create({
      data: {
        sku: 'SKU-LEG-16A-BLK',
        name: 'Legrand Switch 16A Black',
        brand: 'Legrand',
        category: 'Switches',
        stockQty: 50,
        isActive: true,
      },
    });

    activeAnchorSwitch10 = await prisma.product.create({
      data: {
        sku: 'SKU-ANC-10A-WHT',
        name: 'Anchor Switch 10A White',
        brand: 'Anchor',
        category: 'Switches',
        stockQty: 80,
        isActive: true,
      },
    });

    activeLegrandSocket20 = await prisma.product.create({
      data: {
        sku: 'SKU-LEG-20A-WHT',
        name: 'Legrand Socket 20A White',
        brand: 'Legrand',
        category: 'Sockets',
        stockQty: 30,
        isActive: true,
      },
    });

    // Inactive product matching the same name/brand to verify ranking
    inactiveLegrandSocket20 = await prisma.product.create({
      data: {
        sku: 'SKU-LEG-20A-INACT',
        name: 'Legrand Socket 20A White (Legacy)',
        brand: 'Legrand',
        category: 'Sockets',
        stockQty: 0,
        isActive: false, // Inactive
      },
    });

    activeFybrosWire = await prisma.product.create({
      data: {
        sku: 'SKU-FYB-WIRE-2.5',
        name: 'Fybros FR Wire 2.5 Sq mm Red',
        brand: 'Fybros',
        category: 'Wires',
        stockQty: 200,
        isActive: true,
      },
    });

    activeLtMcb16 = await prisma.product.create({
      data: {
        sku: 'SKU-LNT-MCB-16A',
        name: 'L&T MCB Single Pole 16A C-Curve',
        brand: 'L&T',
        category: 'Switchgears',
        stockQty: 15,
        isActive: true,
      },
    });

    // Seed additional products to test search volume (20 additional products)
    for (let i = 1; i <= 20; i++) {
      await prisma.product.create({
        data: {
          sku: `SKU-GENERIC-PROD-${i}`,
          name: `Generic Electrical Item Series ${i}`,
          brand: 'Generic',
          category: 'Others',
          stockQty: i * 5,
          isActive: true,
        },
      });
    }
  });

  afterAll(async () => {
    await prisma.quotationItem.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.$disconnect();
  });

  test('Scenario 1: Word Order Independence', async () => {
    // "white switch legrand" should match "Legrand Switch 16A White"
    const result = await ProductService.getAll(1, 20, 'white switch legrand');
    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result.items[0].id).toBe(activeLegrandSwitch16.id);
  });

  test('Scenario 2: Typo Tolerance', async () => {
    // "legand swich" should match Legrand switches
    const result = await ProductService.getAll(1, 20, 'legand swich');
    expect(result.items.length).toBeGreaterThanOrEqual(2);
    const ids = result.items.map((i: any) => i.id);
    expect(ids).toContain(activeLegrandSwitch16.id);
    expect(ids).toContain(activeLegrandSwitch16Black.id);
  });

  test('Scenario 3: Partial Typing / Prefix matching', async () => {
    // "leg" and "20a" should match "Legrand Socket 20A White"
    const result = await ProductService.getAll(1, 20, 'leg 20a');
    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result.items[0].id).toBe(activeLegrandSocket20.id);
  });

  test('Scenario 4: Mixed Queries', async () => {
    // "mcb 16a lnt" should match "L&T MCB Single Pole 16A C-Curve"
    const result = await ProductService.getAll(1, 20, 'mcb 16a lnt');
    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result.items[0].id).toBe(activeLtMcb16.id);
  });

  test('Scenario 5: Exact SKU Match Priority', async () => {
    // Searching for 'SKU-LEG-16A-BLK' should return "Legrand Switch 16A Black" as #1
    const result = await ProductService.getAll(1, 20, 'SKU-LEG-16A-BLK');
    expect(result.items[0].id).toBe(activeLegrandSwitch16Black.id);
  });

  test('Scenario 6: Exact Name Match Priority', async () => {
    // Searching for exact name 'Anchor Switch 10A White' should return Anchor Switch as #1
    const result = await ProductService.getAll(1, 20, 'Anchor Switch 10A White');
    expect(result.items[0].id).toBe(activeAnchorSwitch10.id);
  });

  test('Scenario 7: Active vs Inactive Priority', async () => {
    // ProductService.getAll filters to isActive: true by default, so the inactive product should not be returned,
    // though similar active products (like activeLegrandSocket20) might be returned due to similarity.
    const result = await ProductService.getAll(1, 20, 'SKU-LEG-20A-INACT');
    const ids = result.items.map((i: any) => i.id);
    expect(ids).not.toContain(inactiveLegrandSocket20.id);
    
    // Verify that every returned product is active
    result.items.forEach((item: any) => {
      expect(item.isActive).toBe(true);
    });
  });

  test('Scenario 8: Normalization & Punctuation', async () => {
    // Searching for "fybros fr wire - 2.5!!!" should be normalized and return "Fybros FR Wire 2.5 Sq mm Red"
    const result = await ProductService.getAll(1, 20, 'fybros fr wire - 2.5!!!');
    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result.items[0].id).toBe(activeFybrosWire.id);
  });
});
