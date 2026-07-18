import "dotenv/config";
import {
  PrismaClient,
  UserRole,
  ProjectPhase,
  LifecycleStatus,
  LeadStatus,
  ReminderStatus,
  ReminderType,
  ReminderPriority,
  ReminderRepeatType,
  TaskStatus,
  TaskPriority,
  QuotationStatus,
  QuotationRevisionReason,
  QuotationType,
  LeadActivityType,
  ProjectStatus,
  PaymentStatus,
} from "@prisma/client";
import bcrypt from "bcrypt";
import { dummyProducts } from "./dummy-products";

const prisma = new PrismaClient();

// Seedable PRNG (Mulberry32)
function createRandom(seed = 123456789) {
  let h = seed;
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const rnd = createRandom(987654321);

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}

function getRandomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => rnd() - 0.5);
  return shuffled.slice(0, count);
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(rnd() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number, decimals = 2): number {
  const val = rnd() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

function getRandomBoolean(trueProb = 0.5): boolean {
  return rnd() < trueProb;
}

function generateIndianMobile(): string {
  const digits = "6789";
  let mobile = "+91 " + getRandomElement(digits.split(""));
  for (let i = 0; i < 9; i++) {
    mobile += getRandomInt(0, 9);
  }
  return mobile;
}

const indianFirstNames = [
  "Rajesh", "Amit", "Suresh", "Ramesh", "Vikram", "Sunil", "Anil", "Sanjay", "Vijay", "Deepak",
  "Sandeep", "Manoj", "Alok", "Ajay", "Rahul", "Rohit", "Abhishek", "Vivek", "Gaurav", "Saurabh",
  "Pankaj", "Nitin", "Ashish", "Vikas", "Dinesh", "Pritesh", "Harish", "Mahesh", "Krunal", "Jayesh",
  "Priya", "Neha", "Anjali", "Pooja", "Aarti", "Swati", "Ritu", "Divya", "Sneha", "Shruti",
  "Preeti", "Jyoti", "Kavita", "Meena", "Sunita", "Geeta", "Karan", "Arjun", "Aditya", "Rohan",
  "Vikrant", "Siddharth", "Sameer", "Varun", "Mayank", "Manish", "Gopal", "Shyam", "Radha", "Kiran"
];

const indianLastNames = [
  "Sharma", "Gupta", "Verma", "Mehta", "Patel", "Joshi", "Shah", "Trivedi", "Mishra", "Pandey",
  "Yadav", "Rao", "Reddy", "Nair", "Iyer", "Pillai", "Bhat", "Shenoy", "Hegde", "Naik",
  "Patil", "Deshmukh", "Kulkarni", "Singh", "Kumar", "Sen", "Das", "Mukherjee", "Banerjee", "Chatterjee",
  "Choudhury", "Bose", "Dutta", "Nandi", "Chakraborty", "Sarma", "Giri", "Panda", "Dwivedi", "Tripathi"
];

const cities = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Pune", "Jaipur", "Surat",
  "Lucknow", "Nagpur", "Indore", "Thane", "Bhopal"
];

const businessNames = [
  "Balaji Enterprises", "Krishna Electricals", "Saraswati Builders", "OM Constructions", "Ganesh Traders",
  "Aditya Housing", "Shree Dev Developers", "Apex Infrastructures", "Elite Electricals", "Sai Enterprises",
  "Aura Spaces", "Marvel Realtors", "Prestige Group", "Sobha Developers", "Godrej Properties",
  "Lodha Group", "DLF Limited", "Kolte Patil", "Brigade Group", "Puravankara"
];

const sources = ["Google", "Reference", "Justdial", "Cold Call", "Walk-in", "Website", "Exhibition"];

const streetNames = ["M.G. Road", "J.M. Road", "Link Road", "S.V. Road", "Outer Ring Road", "Kharadi Bypass", "Viman Nagar Main St", "Connaught Place", "Ghatkopar East", "Salt Lake Sec V"];
const areaNames = ["Shivaji Nagar", "Kothrud", "Kharadi", "Hinjewadi", "Gachibowli", "Madhapur", "Whitefield", "Indiranagar", "Andheri West", "Rajajinagar"];

function generateIndianAddress(city: string): string {
  const plot = getRandomInt(10, 500);
  const street = getRandomElement(streetNames);
  const area = getRandomElement(areaNames);
  return `Flat ${plot}, ${street}, ${area}, ${city} - ${getRandomInt(400001, 400099)}`;
}

// Timeline helpers
const now = new Date("2026-06-29T12:00:00.000Z");
const startTimelineDate = new Date("2026-01-01T00:00:00.000Z");

function getRandomDate(from: Date, to: Date): Date {
  return new Date(from.getTime() + rnd() * (to.getTime() - from.getTime()));
}

// 100 products definitions
const productsList = dummyProducts;

async function main() {
  console.log("Starting DB clean & seed...");

  // 1. Clean Database
  console.log("Truncating tables...");
  const tableNames = [
    "PaymentTransaction",
    "Payment",
    "Reminder",
    "Task",
    "QuotationItem",
    "Quotation",
    "ProjectPhaseTracking",
    "ProjectActivity",
    "Project",
    "CustomerActivity",
    "Customer",
    "LeadNote",
    "LeadActivity",
    "Lead",
    "ProductMargin",
    "Product",
    "SystemSettings",
    "User",
  ];

  for (const tableName of tableNames) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
  }
  console.log("Truncation complete.");

  // 2. Hash password once for all users
  const hashedPassword = await bcrypt.hash("Admin@123", 10);

  // 3. Create Users
  console.log("Creating users...");
  const usersToCreate = [
    // 1 Owner
    { name: "Rajesh Sharma", email: "owner@system.com", password: hashedPassword, role: UserRole.OWNER },
    // 4 Salesmen
    { name: "Suresh Patel", email: "suresh.sales@system.com", password: hashedPassword, role: UserRole.SALESMAN },
    { name: "Amit Mishra", email: "amit.sales@system.com", password: hashedPassword, role: UserRole.SALESMAN },
    { name: "Vikram Nair", email: "vikram.sales@system.com", password: hashedPassword, role: UserRole.SALESMAN },
    { name: "Priya Sen", email: "priya.sales@system.com", password: hashedPassword, role: UserRole.SALESMAN },
    // 2 Accountants
    { name: "Sunil Gupta", email: "sunil.finance@system.com", password: hashedPassword, role: UserRole.ACCOUNTANT },
    { name: "Neha Bhat", email: "neha.finance@system.com", password: hashedPassword, role: UserRole.ACCOUNTANT },
    // 2 Attendants
    { name: "Anil Yadav", email: "anil.care@system.com", password: hashedPassword, role: UserRole.ATTENDANT },
    { name: "Ritu Kulkarni", email: "ritu.care@system.com", password: hashedPassword, role: UserRole.ATTENDANT },
  ];

  const dbUsers = [];
  for (const u of usersToCreate) {
    const created = await prisma.user.create({ data: u });
    dbUsers.push(created);
  }
  console.log(`Created ${dbUsers.length} users.`);

  const owner = dbUsers.find(u => u.role === UserRole.OWNER)!;
  const salesmen = dbUsers.filter(u => u.role === UserRole.SALESMAN);
  const accountants = dbUsers.filter(u => u.role === UserRole.ACCOUNTANT);

  // 4. Create Settings
  console.log("Creating system settings...");
  const salesmanPercentages: Record<string, number> = {};
  salesmanPercentages[salesmen[0].id] = 30;
  salesmanPercentages[salesmen[1].id] = 30;
  salesmanPercentages[salesmen[2].id] = 20;
  salesmanPercentages[salesmen[3].id] = 20;

  const projectPhaseAssignment: Record<string, string> = {
    PIPES: salesmen[0].id,
    WIRING: salesmen[1].id,
    SWITCHES: salesmen[2].id,
    LIGHTS: salesmen[3].id,
    FANS: salesmen[0].id,
    OTHERS: salesmen[1].id,
  };

  await prisma.systemSettings.create({
    data: {
      id: "default",
      companyName: "Antigravity Electrical Systems Pvt Ltd",
      companyLogo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=200",
      companyGst: "27AAAAA1111A1Z1",
      companyAddress: "405, Pride Icon, Kharadi, Pune, Maharashtra - 411014",
      companyPhone: "+91 20 6789 0123",
      companyEmail: "info@antigravityelectric.com",
      companyWebsite: "www.antigravityelectric.com",
      bankName: "HDFC Bank Ltd",
      bankAccountNo: "50100200300405",
      bankIfsc: "HDFC0001234",
      bankBranch: "Kharadi Branch, Pune",
      upiId: "antigravity@hdfc",
      termsAndConditions: "1. Prices are valid for 30 days.\n2. 50% advance along with order.\n3. GST extra as applicable.",
      leadAssignmentMethod: "PERCENTAGE",
      leadSalesmanPercentages: salesmanPercentages,
      projectAssignmentMethod: "PERCENTAGE",
      projectSalesmanPercentages: salesmanPercentages,
      projectPhaseAssignment: projectPhaseAssignment,
      quoteValidityDays: 30,
      quoteDefaultNotes: "Looking forward to working with you.",
      quoteDefaultDiscount: 5.00,
      paymentAssignmentMethod: "PERCENTAGE",
      paymentAssignmentPercentages: salesmanPercentages,
    }
  });
  console.log("Seeded system settings.");

  // 5. Seed Products
  console.log(`Seeding ${productsList.length} products...`);
  const dbProducts = [];
  for (let i = 0; i < productsList.length; i++) {
    const raw = productsList[i];
    
    // Deterministic stock allocation
    let stockQty = getRandomInt(15, 300);
    if (i < 10) {
      stockQty = 0; // Out of stock
    } else if (i < 25) {
      stockQty = getRandomInt(1, 10); // Low stock
    }

    const createdProduct = await prisma.product.create({
      data: {
        sku: raw.sku,
        name: raw.name,
        brand: raw.brand,
        category: raw.category,
        costPrice: raw.costPrice,
        mrp: raw.mrp,
        stockQty,
        unit: raw.unit,
        isActive: true,
      }
    });
    dbProducts.push(createdProduct);

    // Create standard margin for Salesman role
    await prisma.productMargin.create({
      data: {
        productId: createdProduct.id,
        role: UserRole.SALESMAN,
        marginPercent: getRandomFloat(10, 25),
      }
    });
  }
  console.log(`Seeded ${dbProducts.length} products & margins.`);

  // 6. Seed 80 Leads
  console.log("Seeding 80 leads...");
  const dbLeads = [];
  const leadStatuses = [
    ...Array(10).fill(LeadStatus.NEW),
    ...Array(15).fill(LeadStatus.CONTACTED),
    ...Array(10).fill(LeadStatus.NOT_RESPONDING),
    ...Array(15).fill(LeadStatus.QUOTATION_SENT),
    ...Array(10).fill(LeadStatus.NEGOTIATION),
    ...Array(12).fill(LeadStatus.WON),
    ...Array(8).fill(LeadStatus.LOST)
  ];

  for (let i = 0; i < 80; i++) {
    const firstName = indianFirstNames[i % indianFirstNames.length];
    const lastName = indianLastNames[(i + 7) % indianLastNames.length];
    const name = `${firstName} ${lastName}`;
    const status = leadStatuses[i];
    const assignedSalesman = salesmen[i % salesmen.length];
    const city = cities[i % cities.length];
    const source = sources[i % sources.length];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`;
    const mobile = generateIndianMobile();

    const createdAt = getRandomDate(startTimelineDate, new Date(now.getTime() - 5 * 24 * 3600000));
    const updatedAt = getRandomDate(createdAt, now);

    let convertedAt = null;
    if (status === LeadStatus.WON) {
      convertedAt = getRandomDate(createdAt, updatedAt);
    }

    let nextFollowUpAt = null;
    if (status === LeadStatus.CONTACTED || status === LeadStatus.NEGOTIATION) {
      nextFollowUpAt = getRandomDate(now, new Date(now.getTime() + 10 * 24 * 3600000));
    }

    const estimatedValue = getRandomFloat(25000, 350000);

    const createdLead = await prisma.lead.create({
      data: {
        name,
        mobile,
        email,
        source,
        status,
        city,
        notes: `Inquired about electricity installation and products. Need items for a residential property.`,
        assignedToId: assignedSalesman.id,
        createdAt,
        updatedAt,
        convertedAt,
        estimatedValue,
        nextFollowUpAt,
        lostReason: status === LeadStatus.LOST ? getRandomElement(["Price too high", "Competitor offered lower rate", "Delayed project", "Location out of service"]) : null,
      }
    });
    dbLeads.push(createdLead);

    // Lead activities
    await prisma.leadActivity.create({
      data: {
        leadId: createdLead.id,
        userId: assignedSalesman.id,
        type: LeadActivityType.CREATED,
        message: `Lead was created from source: ${source}`,
        createdAt,
      }
    });

    if (status !== LeadStatus.NEW) {
      await prisma.leadActivity.create({
        data: {
          leadId: createdLead.id,
          userId: assignedSalesman.id,
          type: LeadActivityType.STATUS_CHANGED,
          message: `Lead status updated to ${status}`,
          createdAt: getRandomDate(createdAt, updatedAt),
        }
      });
    }

    // Lead note
    await prisma.leadNote.create({
      data: {
        leadId: createdLead.id,
        userId: assignedSalesman.id,
        note: `Contacted lead at ${mobile}. Customer is interested in premium modular switches and wires.`,
        createdAt: getRandomDate(createdAt, updatedAt),
      }
    });
  }
  console.log(`Seeded ${dbLeads.length} leads.`);

  // 7. Seed 40 Customers
  console.log("Seeding 40 customers...");
  const dbCustomers = [];
  
  // 12 originating from WON leads
  const wonLeads = dbLeads.filter(l => l.status === LeadStatus.WON);
  for (let i = 0; i < wonLeads.length; i++) {
    const lead = wonLeads[i];
    
    // Credit options
    const creditAllowed = i % 2 === 0; // mix of true/false
    const maxCreditAmount = creditAllowed ? getRandomFloat(100000, 500000) : 0;
    const defaultCreditDays = creditAllowed ? getRandomElement([15, 30, 45]) : 0;

    const createdCust = await prisma.customer.create({
      data: {
        name: lead.name,
        mobile: lead.mobile,
        email: lead.email,
        city: lead.city,
        source: lead.source,
        address: generateIndianAddress(lead.city || "Mumbai"),
        assignedToId: lead.assignedToId,
        leadId: lead.id,
        creditAllowed,
        maxCreditAmount,
        defaultCreditDays,
        notes: `Converted from Lead. ${lead.notes}`,
        createdAt: lead.convertedAt || lead.createdAt,
        updatedAt: lead.updatedAt,
      }
    });
    dbCustomers.push(createdCust);

    // Customer Activity
    await prisma.customerActivity.create({
      data: {
        customerId: createdCust.id,
        type: "CREATED",
        message: `Customer profile created automatically from Won Lead.`,
        createdAt: createdCust.createdAt,
      }
    });
  }

  // 28 created directly
  for (let i = 0; i < 28; i++) {
    const firstName = indianFirstNames[(i + 13) % indianFirstNames.length];
    const lastName = indianLastNames[(i + 19) % indianLastNames.length];
    
    const isBusiness = i % 3 === 0;
    const name = isBusiness 
      ? getRandomElement(businessNames) + " (Prop: " + firstName + " " + lastName + ")"
      : `${firstName} ${lastName}`;

    const city = cities[i % cities.length];
    const mobile = generateIndianMobile();
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${getRandomInt(10, 99)}@gmail.com`;
    const salesman = salesmen[i % salesmen.length];
    
    const creditAllowed = i % 4 === 0;
    const maxCreditAmount = creditAllowed ? getRandomFloat(50000, 300000) : 0;
    const defaultCreditDays = creditAllowed ? getRandomElement([15, 30, 45]) : 0;

    const createdAt = getRandomDate(startTimelineDate, new Date(now.getTime() - 2 * 24 * 3600000));
    
    const createdCust = await prisma.customer.create({
      data: {
        name,
        mobile,
        email,
        city,
        source: getRandomElement(sources),
        address: generateIndianAddress(city),
        assignedToId: salesman.id,
        creditAllowed,
        maxCreditAmount,
        defaultCreditDays,
        notes: `Direct customer walk-in / inquiry.`,
        createdAt,
        updatedAt: getRandomDate(createdAt, now),
      }
    });
    dbCustomers.push(createdCust);

    await prisma.customerActivity.create({
      data: {
        customerId: createdCust.id,
        type: "CREATED",
        message: `Direct customer profile created.`,
        createdAt: createdCust.createdAt,
      }
    });
  }
  console.log(`Seeded ${dbCustomers.length} customers.`);

  // 8. Seed 30 Projects
  console.log("Seeding 30 projects...");
  const dbProjects = [];
  const projectPhases = [
    ProjectPhase.PIPES,
    ProjectPhase.WIRING,
    ProjectPhase.SWITCHES,
    ProjectPhase.LIGHTS,
    ProjectPhase.FANS,
    ProjectPhase.OTHERS,
  ];

  const projectStatuses = [
    ...Array(15).fill(ProjectStatus.ACTIVE),
    ...Array(6).fill(ProjectStatus.COMPLETED),
    ...Array(6).fill(ProjectStatus.CLOSED_WITH_SALE),
    ...Array(3).fill(ProjectStatus.CLOSED_WITHOUT_SALE),
  ];

  for (let i = 0; i < 30; i++) {
    const customer = dbCustomers[i % dbCustomers.length];
    const status = projectStatuses[i];
    const phaseIndex = i % projectPhases.length;
    const currentPhase = projectPhases[phaseIndex];

    const budget = getRandomFloat(100000, 1500000);
    const projectName = `${customer.name.split(" ")[0]}'s site electrical layout`;

    const createdAt = getRandomDate(customer.createdAt, now);
    const startDate = getRandomDate(createdAt, now);
    const expectedCompletion = new Date(startDate.getTime() + getRandomInt(30, 120) * 24 * 3600000);

    const createdProj = await prisma.project.create({
      data: {
        customerId: customer.id,
        projectName,
        location: customer.address,
        currentPhase,
        estimatedBudget: budget,
        startDate,
        expectedCompletion,
        isCompleted: status === ProjectStatus.COMPLETED || status === ProjectStatus.CLOSED_WITH_SALE,
        status,
        assignedToId: customer.assignedToId,
        createdAt,
        updatedAt: getRandomDate(createdAt, now),
      }
    });
    dbProjects.push(createdProj);

    // Project Activity
    await prisma.projectActivity.create({
      data: {
        projectId: createdProj.id,
        userId: customer.assignedToId,
        type: "CREATED",
        message: `Project created for customer ${customer.name}`,
        createdAt,
      }
    });
  }
  console.log(`Seeded ${dbProjects.length} projects.`);

  // 9. Seed Project Phase Tracking
  console.log("Seeding project phase trackings...");
  for (const proj of dbProjects) {
    const pIndex = projectPhases.indexOf(proj.currentPhase);
    
    // For each of the 6 phases, we create a ProjectPhaseTracking record
    for (let idx = 0; idx < projectPhases.length; idx++) {
      const phase = projectPhases[idx];
      let status = LifecycleStatus.NOT_STARTED;
      let startedAt = null;
      let completedAt = null;
      let remarks = "";

      // Logic for active projects
      if (proj.status === ProjectStatus.ACTIVE) {
        if (idx < pIndex) {
          status = LifecycleStatus.COMPLETED;
          startedAt = new Date(proj.startDate!.getTime() + idx * 10 * 24 * 3600000);
          completedAt = new Date(startedAt.getTime() + 8 * 24 * 3600000);
          remarks = `${phase} work executed and verified.`;
        } else if (idx === pIndex) {
          status = LifecycleStatus.IN_PROGRESS;
          startedAt = new Date(proj.startDate!.getTime() + idx * 10 * 24 * 3600000);
          remarks = `${phase} work is currently ongoing on-site.`;
        }
      } 
      // Logic for completed projects
      else if (proj.status === ProjectStatus.COMPLETED || proj.status === ProjectStatus.CLOSED_WITH_SALE) {
        status = LifecycleStatus.COMPLETED;
        startedAt = new Date(proj.startDate!.getTime() + idx * 10 * 24 * 3600000);
        completedAt = new Date(startedAt.getTime() + 8 * 24 * 3600000);
        remarks = `${phase} work successfully completed.`;
      } 
      // Closed without sale / cancelled
      else {
        if (idx < 2) {
          status = LifecycleStatus.COMPLETED;
          startedAt = new Date(proj.startDate!.getTime() + idx * 10 * 24 * 3600000);
          completedAt = new Date(startedAt.getTime() + 8 * 24 * 3600000);
          remarks = `${phase} work finished before client cancelled.`;
        } else {
          status = LifecycleStatus.SKIPPED;
          remarks = `Project terminated before executing ${phase}.`;
        }
      }

      await prisma.projectPhaseTracking.create({
        data: {
          projectId: proj.id,
          phase,
          status,
          startedAt,
          completedAt,
          remarks,
          assignedToId: proj.assignedToId,
          estimatedValue: proj.estimatedBudget ? proj.estimatedBudget.dividedBy(6) : 0,
        }
      });
    }
  }
  console.log("Phase trackings completed.");

  // 10. Seed 70 Quotations (including versions)
  console.log("Seeding 70 quotations...");
  const dbQuotations = [];
  
  // Walk-in Quotations: 10
  // Lead Quotations: 25
  // Project Quotations: 35
  const quotationStatuses = [
    QuotationStatus.DRAFT,
    QuotationStatus.SENT,
    QuotationStatus.APPROVED,
    QuotationStatus.REJECTED,
    QuotationStatus.EXPIRED,
  ];

  // Helper to generate items, subtotal, discount, total
  function generateQuotationPricingAndItems() {
    const itemsCount = getRandomInt(2, 6);
    const selectedProds = getRandomElements(dbProducts, itemsCount);
    let subtotal = 0;
    const itemsData = [];

    for (const prod of selectedProds) {
      const quantity = getRandomInt(5, 50);
      const costPrice = Number(prod.costPrice);
      const marginPercent = getRandomFloat(10, 25);
      const sellingPrice = parseFloat((costPrice * (1 + marginPercent / 100)).toFixed(2));
      const totalPrice = sellingPrice * quantity;
      
      subtotal += totalPrice;
      itemsData.push({
        productId: prod.id,
        quantity,
        costPrice,
        marginPercent,
        sellingPrice,
        totalPrice,
      });
    }

    const discountAmount = getRandomBoolean(0.4) ? parseFloat((subtotal * getRandomFloat(2, 10) / 100).toFixed(2)) : 0;
    const totalAmount = subtotal - discountAmount;

    return {
      subtotal,
      discountAmount,
      totalAmount,
      items: {
        create: itemsData,
      }
    };
  }

  let quotationCount = 1;
  function getNextQuotationNumber() {
    const num = String(quotationCount++).padStart(4, '0');
    return `QTN-2026-${num}`;
  }

  // A. Lead Quotations: 25
  for (let i = 0; i < 25; i++) {
    const lead = dbLeads[i % dbLeads.length];
    const status = i < 8 ? QuotationStatus.APPROVED : getRandomElement(quotationStatuses);
    const createdAt = getRandomDate(lead.createdAt, now);
    const validUntil = new Date(createdAt.getTime() + 30 * 24 * 3600000);
    const approvedAt = status === QuotationStatus.APPROVED ? getRandomDate(createdAt, now) : null;
    const rejectedAt = status === QuotationStatus.REJECTED ? getRandomDate(createdAt, now) : null;

    const pricingAndItems = generateQuotationPricingAndItems();

    const q = await prisma.quotation.create({
      data: {
        quotationNumber: getNextQuotationNumber(),
        type: QuotationType.LEAD,
        leadId: lead.id,
        createdById: lead.assignedToId || owner.id,
        status,
        version: 1,
        validUntil,
        createdAt,
        updatedAt: getRandomDate(createdAt, now),
        approvedAt,
        rejectedAt,
        notes: "Detailed pricing of wire coils and switches.",
        companyNameSnapshot: "Antigravity Electrical Systems Pvt Ltd",
        companyGstSnapshot: "27AAAAA1111A1Z1",
        companyAddressSnapshot: "405, Pride Icon, Kharadi, Pune, Maharashtra - 411014",
        companyPhoneSnapshot: "+91 20 6789 0123",
        companyEmailSnapshot: "info@antigravityelectric.com",
        ...pricingAndItems,
      }
    });

    dbQuotations.push(q);
  }

  // B. Project/Customer Quotations: 35 (including version trees)
  // Let's create some version hierarchies (V1, V2, V3) for a subset of projects
  // We'll create 8 families of revisions (8 * 3 = 24 quotations) and 11 single versions (11 quotations) = 35 total.
  
  // Revision Families
  for (let i = 0; i < 8; i++) {
    const proj = dbProjects[i % dbProjects.length];
    const createdAtV1 = getRandomDate(proj.createdAt, now);
    const pricingAndItemsV1 = generateQuotationPricingAndItems();
    
    // V1 (Expired or Rejected)
    const q1 = await prisma.quotation.create({
      data: {
        quotationNumber: getNextQuotationNumber(),
        type: QuotationType.CUSTOMER,
        projectId: proj.id,
        customerId: proj.customerId,
        phase: proj.currentPhase,
        createdById: proj.assignedToId || owner.id,
        status: QuotationStatus.REJECTED,
        version: 1,
        validUntil: new Date(createdAtV1.getTime() + 15 * 24 * 3600000),
        createdAt: createdAtV1,
        updatedAt: createdAtV1,
        notes: "Project phase quotation draft V1",
        companyNameSnapshot: "Antigravity Electrical Systems Pvt Ltd",
        companyGstSnapshot: "27AAAAA1111A1Z1",
        companyAddressSnapshot: "405, Pride Icon, Kharadi, Pune, Maharashtra - 411014",
        ...pricingAndItemsV1,
      }
    });
    dbQuotations.push(q1);

    // V2 (Revision Reason: CUSTOMER_REQUEST)
    const createdAtV2 = new Date(createdAtV1.getTime() + 2 * 24 * 3600000);
    const pricingAndItemsV2 = generateQuotationPricingAndItems();
    const q2 = await prisma.quotation.create({
      data: {
        quotationNumber: getNextQuotationNumber(),
        type: QuotationType.CUSTOMER,
        projectId: proj.id,
        customerId: proj.customerId,
        phase: proj.currentPhase,
        createdById: proj.assignedToId || owner.id,
        status: QuotationStatus.REJECTED,
        version: 2,
        parentQuotationId: q1.id,
        validUntil: new Date(createdAtV2.getTime() + 15 * 24 * 3600000),
        createdAt: createdAtV2,
        updatedAt: createdAtV2,
        revisionReason: QuotationRevisionReason.CUSTOMER_REQUEST,
        notes: "Project phase quotation draft V2 (swapped some light models)",
        companyNameSnapshot: "Antigravity Electrical Systems Pvt Ltd",
        companyGstSnapshot: "27AAAAA1111A1Z1",
        companyAddressSnapshot: "405, Pride Icon, Kharadi, Pune, Maharashtra - 411014",
        ...pricingAndItemsV2,
      }
    });
    dbQuotations.push(q2);

    // V3 (Approved)
    const createdAtV3 = new Date(createdAtV2.getTime() + 3 * 24 * 3600000);
    const pricingAndItemsV3 = generateQuotationPricingAndItems();
    const q3 = await prisma.quotation.create({
      data: {
        quotationNumber: getNextQuotationNumber(),
        type: QuotationType.CUSTOMER,
        projectId: proj.id,
        customerId: proj.customerId,
        phase: proj.currentPhase,
        createdById: proj.assignedToId || owner.id,
        status: QuotationStatus.APPROVED,
        version: 3,
        parentQuotationId: q1.id, // linked to top-level parent
        validUntil: new Date(createdAtV3.getTime() + 30 * 24 * 3600000),
        createdAt: createdAtV3,
        updatedAt: createdAtV3,
        approvedAt: getRandomDate(createdAtV3, now),
        revisionReason: QuotationRevisionReason.PRICE_CHANGE,
        notes: "Final approved project phase quotation V3",
        companyNameSnapshot: "Antigravity Electrical Systems Pvt Ltd",
        companyGstSnapshot: "27AAAAA1111A1Z1",
        companyAddressSnapshot: "405, Pride Icon, Kharadi, Pune, Maharashtra - 411014",
        ...pricingAndItemsV3,
      }
    });
    dbQuotations.push(q3);
  }

  // Single Versions for remaining project counts
  for (let i = 8; i < 19; i++) {
    const proj = dbProjects[i % dbProjects.length];
    const status = i < 15 ? QuotationStatus.APPROVED : getRandomElement([QuotationStatus.DRAFT, QuotationStatus.SENT]);
    const createdAt = getRandomDate(proj.createdAt, now);
    const validUntil = new Date(createdAt.getTime() + 30 * 24 * 3600000);
    const pricingAndItems = generateQuotationPricingAndItems();

    const q = await prisma.quotation.create({
      data: {
        quotationNumber: getNextQuotationNumber(),
        type: QuotationType.CUSTOMER,
        projectId: proj.id,
        customerId: proj.customerId,
        phase: proj.currentPhase,
        createdById: proj.assignedToId || owner.id,
        status,
        version: 1,
        validUntil,
        createdAt,
        updatedAt: getRandomDate(createdAt, now),
        approvedAt: status === QuotationStatus.APPROVED ? getRandomDate(createdAt, now) : null,
        notes: "Quotation for lighting fixture install.",
        companyNameSnapshot: "Antigravity Electrical Systems Pvt Ltd",
        companyGstSnapshot: "27AAAAA1111A1Z1",
        companyAddressSnapshot: "405, Pride Icon, Kharadi, Pune, Maharashtra - 411014",
        ...pricingAndItems,
      }
    });
    dbQuotations.push(q);
  }

  // C. Walk-in Quotations: 10
  for (let i = 0; i < 10; i++) {
    const status = i < 4 ? QuotationStatus.APPROVED : getRandomElement([QuotationStatus.DRAFT, QuotationStatus.SENT, QuotationStatus.EXPIRED]);
    const createdAt = getRandomDate(startTimelineDate, now);
    const validUntil = new Date(createdAt.getTime() + 30 * 24 * 3600000);

    const walkInFirst = indianFirstNames[(i + 23) % indianFirstNames.length];
    const walkInLast = indianLastNames[(i + 29) % indianLastNames.length];
    const pricingAndItems = generateQuotationPricingAndItems();

    const q = await prisma.quotation.create({
      data: {
        quotationNumber: getNextQuotationNumber(),
        type: QuotationType.WALK_IN_CUSTOMER,
        walkInName: `${walkInFirst} ${walkInLast}`,
        walkInMobile: generateIndianMobile(),
        walkInEmail: `${walkInFirst.toLowerCase()}.${walkInLast.toLowerCase()}@outlook.com`,
        walkInAddress: `Walk-in customer residence in ${getRandomElement(cities)}`,
        createdById: getRandomElement(salesmen).id,
        status,
        version: 1,
        validUntil,
        createdAt,
        updatedAt: getRandomDate(createdAt, now),
        approvedAt: status === QuotationStatus.APPROVED ? getRandomDate(createdAt, now) : null,
        notes: "Walk-in shop checkout list.",
        companyNameSnapshot: "Antigravity Electrical Systems Pvt Ltd",
        companyGstSnapshot: "27AAAAA1111A1Z1",
        companyAddressSnapshot: "405, Pride Icon, Kharadi, Pune, Maharashtra - 411014",
        ...pricingAndItems,
      }
    });
    dbQuotations.push(q);
  }
  console.log(`Seeded ${dbQuotations.length} quotations.`);

  // 11. Seed Payments & PaymentTransactions
  console.log("Seeding payments and transactions...");
  const approvedQuotes = dbQuotations.filter(q => q.status === QuotationStatus.APPROVED);
  let billsCount = 1;

  for (let i = 0; i < approvedQuotes.length; i++) {
    const quote = approvedQuotes[i];
    
    // Find matching project/customer/salesman
    let customerId = quote.customerId;
    let projectId = quote.projectId;
    let salesmanId = quote.createdById;

    // Fallbacks if Walk-in or Lead quotes
    if (!customerId) {
      // Find a customer
      const fallbackCust = getRandomElement(dbCustomers);
      customerId = fallbackCust.id;
      salesmanId = fallbackCust.assignedToId || owner.id;
    }
    if (!projectId) {
      // Find a project or assign a random project from this customer
      const projectsForCust = dbProjects.filter(p => p.customerId === customerId);
      if (projectsForCust.length > 0) {
        projectId = projectsForCust[0].id;
      } else {
        projectId = getRandomElement(dbProjects).id;
      }
    }

    const billNumber = `INV-2026-${String(billsCount++).padStart(4, '0')}`;
    const billDate = quote.approvedAt || quote.createdAt;
    const totalBillAmount = quote.totalAmount;
    
    // Distribute payment status: Fully Paid (12), Partial (6), Pending (4), Overdue (3)
    let status: PaymentStatus;
    let amountReceived: number;
    
    if (i < 12) {
      status = PaymentStatus.FULLY_PAID;
      amountReceived = Number(totalBillAmount);
    } else if (i < 18) {
      status = PaymentStatus.PARTIALLY_PAID;
      amountReceived = Number(totalBillAmount) * getRandomFloat(0.3, 0.7);
    } else if (i < 22) {
      status = PaymentStatus.PENDING;
      amountReceived = 0;
    } else {
      status = PaymentStatus.OVERDUE;
      amountReceived = 0;
    }

    const pendingAmount = Number(totalBillAmount) - amountReceived;
    
    // Due Date
    let dueDate;
    if (status === PaymentStatus.OVERDUE) {
      // Due date was in the past (e.g. 15-30 days ago)
      dueDate = new Date(now.getTime() - getRandomInt(15, 30) * 24 * 3600000);
    } else {
      // Due date is in future
      dueDate = new Date(billDate.getTime() + 30 * 24 * 3600000);
    }

    const payment = await prisma.payment.create({
      data: {
        customerId: customerId!,
        projectId: projectId!,
        quotationId: quote.id,
        salesmanId: salesmanId,
        accountantId: getRandomElement(accountants).id,
        collectorId: salesmanId,
        billNumber,
        billDate,
        totalBillAmount,
        amountReceived,
        pendingAmount,
        status,
        dueDate,
        creditPeriod: 30,
        remarks: "Payment schedule linked to quotation.",
      }
    });

    // Add PaymentTransactions
    if (status === PaymentStatus.FULLY_PAID) {
      const txDate = getRandomDate(billDate, now);
      await prisma.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          date: txDate,
          amount: totalBillAmount,
          paymentMethod: getRandomElement(["BANK_TRANSFER", "UPI", "CHEQUE", "CASH"]),
          referenceNumber: `TXN${getRandomInt(100000, 999999)}`,
          notes: "Full payment received against invoice.",
          updatedById: getRandomElement(accountants).id,
          createdAt: txDate,
          updatedAt: txDate,
        }
      });
    } else if (status === PaymentStatus.PARTIALLY_PAID) {
      const txDate = getRandomDate(billDate, now);
      await prisma.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          date: txDate,
          amount: amountReceived,
          paymentMethod: getRandomElement(["BANK_TRANSFER", "UPI", "CHEQUE", "CASH"]),
          referenceNumber: `TXN${getRandomInt(100000, 999999)}`,
          notes: "Partial payment received.",
          updatedById: getRandomElement(accountants).id,
          createdAt: txDate,
          updatedAt: txDate,
        }
      });
    }

    // Update quote with bill markers
    await prisma.quotation.update({
      where: { id: quote.id },
      data: {
        billCreated: true,
        billNumber,
        billDate,
      }
    });
  }
  console.log("Payment records and transactions seeded.");

  // 12. Seed Reminders
  console.log("Seeding reminders...");
  const dbPayments = await prisma.payment.findMany();
  
  // We need to create reminders for: Leads, Projects, Customers, Payments, Tasks
  const reminderTypes = [
    ReminderType.LEAD,
    ReminderType.PROJECT,
    ReminderType.CUSTOMER,
    ReminderType.PAYMENT,
    ReminderType.TASK,
  ];

  for (let i = 0; i < 40; i++) {
    const type = reminderTypes[i % reminderTypes.length];
    const user = getRandomElement(dbUsers);
    
    let leadId = null;
    let projectId = null;
    let customerId = null;
    let paymentId = null;
    let title = "General follow-up reminder";
    let description = "Check project or client status.";

    if (type === ReminderType.LEAD) {
      const lead = getRandomElement(dbLeads);
      leadId = lead.id;
      title = `Follow up with lead: ${lead.name}`;
      description = `Discuss pricing options for the requested modular layouts.`;
    } else if (type === ReminderType.PROJECT) {
      const proj = getRandomElement(dbProjects);
      projectId = proj.id;
      title = `Inspect project site: ${proj.projectName}`;
      description = `Check phase alignment and material delivery status.`;
    } else if (type === ReminderType.CUSTOMER) {
      const customer = getRandomElement(dbCustomers);
      customerId = customer.id;
      title = `Call customer: ${customer.name}`;
      description = `Review feedback on the recent delivery.`;
    } else if (type === ReminderType.PAYMENT) {
      const payment = getRandomElement(dbPayments);
      paymentId = payment.id;
      title = `Collect payment for Invoice: ${payment.billNumber}`;
      description = `Pending amount is ₹${payment.pendingAmount}. Contact client.`;
    }

    const dueAt = getRandomDate(startTimelineDate, new Date(now.getTime() + 15 * 24 * 3600000));
    
    // Mix statuses: PENDING (future), COMPLETED, MISSED, CANCELLED
    let status: ReminderStatus;
    let completedAt = null;

    if (dueAt.getTime() < now.getTime()) {
      // Due in past
      if (i % 3 === 0) {
        status = ReminderStatus.COMPLETED;
        completedAt = getRandomDate(dueAt, now);
      } else if (i % 3 === 1) {
        status = ReminderStatus.MISSED;
      } else {
        status = ReminderStatus.CANCELLED;
      }
    } else {
      // Due in future
      status = i % 5 === 0 ? ReminderStatus.CANCELLED : ReminderStatus.PENDING;
    }

    await prisma.reminder.create({
      data: {
        title,
        description,
        type,
        dueAt,
        completedAt,
        status,
        userId: user.id,
        leadId,
        projectId,
        customerId,
        paymentId,
        priority: getRandomElement([ReminderPriority.LOW, ReminderPriority.MEDIUM, ReminderPriority.HIGH, ReminderPriority.CRITICAL]),
        repeatType: ReminderRepeatType.NONE,
      }
    });
  }
  console.log("Reminders seeded.");

  // 13. Seed Tasks
  console.log("Seeding tasks for every user...");
  // Mix: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
  const taskStatuses = [
    TaskStatus.PENDING,
    TaskStatus.IN_PROGRESS,
    TaskStatus.COMPLETED,
    TaskStatus.CANCELLED,
  ];

  const taskTitles = [
    "Verify warehouse stock items",
    "Submit GST returns sheet",
    "Inspect piping wiring site layouts",
    "Dispatch conduit pipes Supreme piece batch",
    "Clarify margin profiles with owner",
    "Log walk-in customer cash sales",
    "Prepare HDFC Bank account statement",
    "Follow up with HDFC bank IFSC branch",
    "Update price margins on BLDC Usha fans",
    "Schedule safety checks for wiring teams"
  ];

  for (const user of dbUsers) {
    // Generate 3 tasks for each user
    for (let j = 0; j < 3; j++) {
      const status = taskStatuses[(user.name.charCodeAt(0) + j) % taskStatuses.length];
      const title = taskTitles[(user.name.charCodeAt(0) + j) % taskTitles.length];
      
      const createdAt = getRandomDate(startTimelineDate, now);
      const dueAt = getRandomDate(createdAt, new Date(now.getTime() + 10 * 24 * 3600000));
      const completedAt = status === TaskStatus.COMPLETED ? getRandomDate(createdAt, now) : null;

      await prisma.task.create({
        data: {
          title,
          description: `Task assigned during general workflow planning.`,
          status,
          priority: getRandomElement([TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.CRITICAL]),
          dueAt,
          assignedToId: user.id,
          createdById: owner.id,
          completedAt,
          createdAt,
          updatedAt: getRandomDate(createdAt, now),
        }
      });
    }
  }
  console.log("Tasks seeded.");

  // 14. Seed Activities for feeds (LeadActivity, CustomerActivity, ProjectActivity)
  console.log("Populating chronological activity logs...");
  // We'll generate generic activities for leads, customers, projects to make sure feeds are completely full
  const sampleActivities = [
    { type: "NOTE_ADDED", message: "Client added new modular switches specification." },
    { type: "FOLLOW_UP_SET", message: "Follow-up set for next Monday to close proposal." },
    { type: "CONTACTED", message: "Spoke with client on phone. Discussed HDFC details." },
    { type: "QUOTATION_SENT", message: "Quotation sent by email with bank snapshots." },
    { type: "NEGOTIATION_STARTED", message: "Negotiation started on margin discounts." },
  ];

  for (let i = 0; i < 15; i++) {
    const lead = dbLeads[i % dbLeads.length];
    const act = sampleActivities[i % sampleActivities.length];
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        userId: lead.assignedToId || owner.id,
        type: act.type as LeadActivityType,
        message: act.message,
        createdAt: getRandomDate(lead.createdAt, now),
      }
    });
  }

  for (let i = 0; i < 15; i++) {
    const customer = dbCustomers[i % dbCustomers.length];
    await prisma.customerActivity.create({
      data: {
        customerId: customer.id,
        type: "UPDATE",
        message: "Customer contact profile updated.",
        createdAt: getRandomDate(customer.createdAt, now),
      }
    });
  }

  for (let i = 0; i < 15; i++) {
    const project = dbProjects[i % dbProjects.length];
    await prisma.projectActivity.create({
      data: {
        projectId: project.id,
        userId: project.assignedToId || owner.id,
        type: "PHASE_UPDATE",
        message: `Project phase activity changed at site.`,
        createdAt: getRandomDate(project.createdAt, now),
      }
    });
  }

  console.log("DB Seeding complete! Database is fully populated.");
}

main()
  .catch((e) => {
    console.error("Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
