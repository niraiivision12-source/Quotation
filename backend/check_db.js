/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const projects = await prisma.project.count();
  const opportunities = await prisma.opportunity.count();
  const quotations = await prisma.quotation.count();
  const customers = await prisma.customer.count();
  const dealers = await prisma.dealer.count();
  const purchaseOrders = await prisma.purchaseOrder.count();
  const enquiries = await prisma.enquiry.count();

  console.log("Counts in DB:");
  console.log("Users:", users);
  console.log("Projects:", projects);
  console.log("Opportunities:", opportunities);
  console.log("Quotations:", quotations);
  console.log("Customers:", customers);
  console.log("Dealers:", dealers);
  console.log("Purchase Orders:", purchaseOrders);
  console.log("Enquiries:", enquiries);

  const sampleOpportunities = await prisma.opportunity.findMany({
    take: 2,
    include: {
      customer: true,
      project: true,
    }
  });
  console.log("Sample Opportunities:", JSON.stringify(sampleOpportunities, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());

