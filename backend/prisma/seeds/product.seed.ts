import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  // --- PIPES ---
  { sku: "PIPE-PVC-1IN", name: "PVC Pipe 1 Inch", brand: "Supreme", category: "PIPES", costPrice: 120, unit: "piece" },
  { sku: "PIPE-PVC-2IN", name: "PVC Pipe 2 Inch", brand: "Supreme", category: "PIPES", costPrice: 210, unit: "piece" },
  { sku: "PIPE-COND-20MM", name: "Conduit Pipe 20mm", brand: "Neltex", category: "PIPES", costPrice: 85, unit: "piece" },
  { sku: "PIPE-COND-25MM", name: "Conduit Pipe 25mm", brand: "Neltex", category: "PIPES", costPrice: 110, unit: "piece" },
  { sku: "PIPE-FLEX-20MM", name: "Flexible Conduit 20mm", brand: "Polycab", category: "PIPES", costPrice: 65, unit: "meter" },

  // --- WIRING ---
  { sku: "WIRE-1SQ-RD", name: "Wire 1 Sqmm Red (90m coil)", brand: "Polycab", category: "WIRING", costPrice: 950, unit: "coil" },
  { sku: "WIRE-1SQ-BL", name: "Wire 1 Sqmm Black (90m coil)", brand: "Polycab", category: "WIRING", costPrice: 950, unit: "coil" },
  { sku: "WIRE-1SQ-GR", name: "Wire 1 Sqmm Green (90m coil)", brand: "Polycab", category: "WIRING", costPrice: 950, unit: "coil" },
  { sku: "WIRE-2.5SQ-RD", name: "Wire 2.5 Sqmm Red (90m coil)", brand: "Polycab", category: "WIRING", costPrice: 2100, unit: "coil" },
  { sku: "WIRE-2.5SQ-BL", name: "Wire 2.5 Sqmm Black (90m coil)", brand: "Polycab", category: "WIRING", costPrice: 2100, unit: "coil" },
  { sku: "WIRE-4SQ-RD", name: "Wire 4 Sqmm Red (90m coil)", brand: "Polycab", category: "WIRING", costPrice: 3200, unit: "coil" },
  { sku: "WIRE-6SQ-RD", name: "Wire 6 Sqmm Red (90m coil)", brand: "Polycab", category: "WIRING", costPrice: 4800, unit: "coil" },
  { sku: "WIRE-10SQ-BL", name: "Wire 10 Sqmm Black (90m coil)", brand: "Havells", category: "WIRING", costPrice: 7500, unit: "coil" },

  // --- SWITCHES ---
  { sku: "SW-1WAY-6A", name: "1-Way Switch 6A", brand: "Legrand", category: "SWITCHES", costPrice: 45, unit: "piece" },
  { sku: "SW-2WAY-6A", name: "2-Way Switch 6A", brand: "Legrand", category: "SWITCHES", costPrice: 65, unit: "piece" },
  { sku: "SW-16A-SOCKET", name: "16A Socket Outlet", brand: "Legrand", category: "SWITCHES", costPrice: 120, unit: "piece" },
  { sku: "SW-5A-SOCKET", name: "5A Socket Outlet", brand: "Legrand", category: "SWITCHES", costPrice: 55, unit: "piece" },
  { sku: "SW-MODULAR-PLATE-2", name: "Modular Plate 2 Module", brand: "Schneider", category: "SWITCHES", costPrice: 35, unit: "piece" },
  { sku: "SW-MODULAR-PLATE-4", name: "Modular Plate 4 Module", brand: "Schneider", category: "SWITCHES", costPrice: 55, unit: "piece" },
  { sku: "SW-MODULAR-PLATE-6", name: "Modular Plate 6 Module", brand: "Schneider", category: "SWITCHES", costPrice: 75, unit: "piece" },
  { sku: "SW-MCB-6A", name: "MCB Single Pole 6A", brand: "ABB", category: "SWITCHES", costPrice: 180, unit: "piece" },
  { sku: "SW-MCB-16A", name: "MCB Single Pole 16A", brand: "ABB", category: "SWITCHES", costPrice: 195, unit: "piece" },
  { sku: "SW-MCB-32A", name: "MCB Single Pole 32A", brand: "ABB", category: "SWITCHES", costPrice: 245, unit: "piece" },
  { sku: "SW-MCB-DP-32A", name: "MCB Double Pole 32A", brand: "ABB", category: "SWITCHES", costPrice: 480, unit: "piece" },
  { sku: "SW-ELCB-25A", name: "ELCB/RCCB 25A 30mA", brand: "Havells", category: "SWITCHES", costPrice: 950, unit: "piece" },
  { sku: "SW-ELCB-40A", name: "ELCB/RCCB 40A 30mA", brand: "Havells", category: "SWITCHES", costPrice: 1100, unit: "piece" },
  { sku: "SW-DB-4WAY", name: "Distribution Board 4 Way", brand: "Legrand", category: "SWITCHES", costPrice: 550, unit: "piece" },
  { sku: "SW-DB-8WAY", name: "Distribution Board 8 Way", brand: "Legrand", category: "SWITCHES", costPrice: 850, unit: "piece" },
  { sku: "SW-DB-12WAY", name: "Distribution Board 12 Way", brand: "Legrand", category: "SWITCHES", costPrice: 1200, unit: "piece" },

  // --- LIGHTS ---
  { sku: "LT-LED-BULB-7W", name: "LED Bulb 7W B22", brand: "Philips", category: "LIGHTS", costPrice: 65, unit: "piece" },
  { sku: "LT-LED-BULB-9W", name: "LED Bulb 9W B22", brand: "Philips", category: "LIGHTS", costPrice: 75, unit: "piece" },
  { sku: "LT-LED-BULB-12W", name: "LED Bulb 12W B22", brand: "Philips", category: "LIGHTS", costPrice: 90, unit: "piece" },
  { sku: "LT-LED-DOWN-7W", name: "LED Downlight 7W Round", brand: "Syska", category: "LIGHTS", costPrice: 120, unit: "piece" },
  { sku: "LT-LED-DOWN-12W", name: "LED Downlight 12W Round", brand: "Syska", category: "LIGHTS", costPrice: 185, unit: "piece" },
  { sku: "LT-LED-PANEL-12W", name: "LED Panel Light 12W", brand: "Wipro", category: "LIGHTS", costPrice: 250, unit: "piece" },
  { sku: "LT-LED-PANEL-24W", name: "LED Panel Light 24W", brand: "Wipro", category: "LIGHTS", costPrice: 420, unit: "piece" },
  { sku: "LT-LED-TUBE-18W", name: "LED Tube Light 18W 4ft", brand: "Philips", category: "LIGHTS", costPrice: 160, unit: "piece" },
  { sku: "LT-LED-STRIP-5M", name: "LED Strip Light 5m Warm White", brand: "Generic", category: "LIGHTS", costPrice: 350, unit: "roll" },
  { sku: "LT-HOLDER-B22", name: "Bulb Holder B22", brand: "GM", category: "LIGHTS", costPrice: 20, unit: "piece" },
  { sku: "LT-HOLDER-E27", name: "Bulb Holder E27", brand: "GM", category: "LIGHTS", costPrice: 25, unit: "piece" },
  { sku: "LT-BATTEN-2FT", name: "Fluorescent Batten 2ft", brand: "Crompton", category: "LIGHTS", costPrice: 180, unit: "piece" },
  { sku: "LT-BATTEN-4FT", name: "Fluorescent Batten 4ft", brand: "Crompton", category: "LIGHTS", costPrice: 260, unit: "piece" },

  // --- FANS ---
  { sku: "FAN-CEIL-48IN", name: "Ceiling Fan 48 Inch", brand: "Havells", category: "FANS", costPrice: 2200, unit: "piece" },
  { sku: "FAN-CEIL-52IN", name: "Ceiling Fan 52 Inch", brand: "Havells", category: "FANS", costPrice: 2600, unit: "piece" },
  { sku: "FAN-CEIL-48IN-USHA", name: "Ceiling Fan 48 Inch", brand: "Usha", category: "FANS", costPrice: 1850, unit: "piece" },
  { sku: "FAN-TABLE-16IN", name: "Table Fan 16 Inch", brand: "Crompton", category: "FANS", costPrice: 1200, unit: "piece" },
  { sku: "FAN-WALL-12IN", name: "Wall Fan 12 Inch", brand: "Orient", category: "FANS", costPrice: 1400, unit: "piece" },
  { sku: "FAN-EXH-6IN", name: "Exhaust Fan 6 Inch", brand: "Havells", category: "FANS", costPrice: 650, unit: "piece" },
  { sku: "FAN-EXH-9IN", name: "Exhaust Fan 9 Inch", brand: "Havells", category: "FANS", costPrice: 900, unit: "piece" },
  { sku: "FAN-SPEED-REG", name: "Fan Speed Regulator (Step)", brand: "Anchor", category: "FANS", costPrice: 85, unit: "piece" },
];

async function main() {
  console.log("Seeding products...");

  let created = 0;
  let skipped = 0;

  for (const product of products) {
    const existing = await prisma.product.findUnique({ where: { sku: product.sku } });

    if (existing) {
      console.log(`  ↷ Skipped (exists): ${product.name} [${product.sku}]`);
      skipped++;
      continue;
    }

    await prisma.product.create({
      data: {
        sku: product.sku,
        name: product.name,
        brand: product.brand,
        category: product.category,
        costPrice: product.costPrice,
        unit: product.unit,
        stockQty: 0,
      },
    });

    console.log(`  ✓ Created: ${product.name} [${product.sku}]`);
    created++;
  }

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
