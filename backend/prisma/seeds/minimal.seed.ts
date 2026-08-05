import { PrismaClient, UserRole, ProductCategory, OpportunityStatus, ReminderPriority, ReminderType } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database...");
  const tableNames = [
    "PaymentTransaction",
    "Payment",
    "Reminder",
    "Task",
    "QuotationItem",
    "Quotation",
    "OpportunityActivity",
    "Opportunity",
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
  console.log("Database cleaned.");

  console.log("Creating default users...");
  const hashedPassword = await bcrypt.hash("Admin@123", 10);
  
  const owner = await prisma.user.create({
    data: {
      name: "Owner User",
      email: "owner@system.com",
      password: hashedPassword,
      role: UserRole.OWNER,
      isActive: true,
    }
  });

  const salesman = await prisma.user.create({
    data: {
      name: "Salesman User",
      email: "salesman@system.com",
      password: hashedPassword,
      role: UserRole.SALESMAN,
      isActive: true,
    }
  });

  console.log("Creating default system settings...");
  await prisma.systemSettings.create({
    data: {
      id: "default",
      companyName: "Minimal Test Electricals",
      categorySalesmanAssignment: {
        PIPES: salesman.id,
        WIRES: salesman.id,
        SWITCHES: salesman.id,
        LIGHTS: salesman.id,
        FANS: salesman.id,
        OTHERS: salesman.id,
      },
      projectPhaseAssignment: {
        PIPES: salesman.id,
        WIRING: salesman.id,
        SWITCHES: salesman.id,
        LIGHTS: salesman.id,
        FANS: salesman.id,
        OTHERS: salesman.id,
      }
    }
  });

  console.log("Creating test customers...");
  const customerA = await prisma.customer.create({
    data: {
      name: "Minimal Cust A",
      mobile: "+91 9999900001",
      email: "cust.a@test.com",
      assignedToId: salesman.id,
      city: "Mumbai",
    }
  });

  const customerB = await prisma.customer.create({
    data: {
      name: "Minimal Cust B",
      mobile: "+91 9999900002",
      email: "cust.b@test.com",
      assignedToId: salesman.id,
      city: "Pune",
    }
  });

  console.log("Creating test projects...");
  const projectA = await prisma.project.create({
    data: {
      customerId: customerA.id,
      projectName: "Cust A Residential Project",
      location: "Mumbai",
      assignedToId: salesman.id,
      currentPhase: "PIPES",
    }
  });

  console.log("Creating opportunities directly...");
  
  // 1. PIPES Opportunity in NEW status
  const opp1 = await prisma.opportunity.create({
    data: {
      customerId: customerA.id,
      projectId: projectA.id,
      category: ProductCategory.PIPES,
      status: OpportunityStatus.NEW,
      assignedToId: salesman.id,
      estimatedValue: 75000,
    }
  });

  // 2. WIRES Opportunity in NEGOTIATION status with follow-up
  const opp2 = await prisma.opportunity.create({
    data: {
      customerId: customerA.id,
      projectId: projectA.id,
      category: ProductCategory.WIRES,
      status: OpportunityStatus.NEGOTIATION,
      assignedToId: salesman.id,
      estimatedValue: 120000,
      nextFollowUpAt: new Date(Date.now() + 86400000 * 3),
    }
  });

  await prisma.reminder.create({
    data: {
      title: "Negotiation follow-up call",
      type: ReminderType.OPPORTUNITY,
      dueAt: new Date(Date.now() + 86400000 * 3),
      priority: ReminderPriority.HIGH,
      userId: salesman.id,
      customerId: customerA.id,
      opportunityId: opp2.id,
    }
  });

  // 3. SWITCHES Opportunity in WON status with post-sale follow-up
  const opp3 = await prisma.opportunity.create({
    data: {
      customerId: customerB.id,
      category: ProductCategory.SWITCHES,
      status: OpportunityStatus.WON,
      assignedToId: salesman.id,
      estimatedValue: 90000,
    }
  });

  await prisma.reminder.create({
    data: {
      title: "Post-Sale Follow-up",
      description: "Verify switches delivery and installation status",
      type: ReminderType.OPPORTUNITY,
      dueAt: new Date(Date.now() + 86400000 * 7),
      priority: ReminderPriority.MEDIUM,
      userId: salesman.id,
      customerId: customerB.id,
      opportunityId: opp3.id,
    }
  });

  // 4. LIGHTS Opportunity in LOST status with follow-up and lostReason
  const opp4 = await prisma.opportunity.create({
    data: {
      customerId: customerB.id,
      category: ProductCategory.LIGHTS,
      status: OpportunityStatus.LOST,
      assignedToId: salesman.id,
      estimatedValue: 45000,
      lostReason: "Competitor offered 15% discount on lights",
    }
  });

  await prisma.reminder.create({
    data: {
      title: "Future Check-in on Lost Account",
      description: "Call back for lighting maintenance check-in",
      type: ReminderType.OPPORTUNITY,
      dueAt: new Date(Date.now() + 86400000 * 30),
      priority: ReminderPriority.LOW,
      userId: salesman.id,
      customerId: customerB.id,
      opportunityId: opp4.id,
    }
  });

  console.log("Opportunities seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Minimal seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
