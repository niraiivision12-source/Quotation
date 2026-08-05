/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const projects = await prisma.project.count();
  const opportunities = await prisma.opportunity.count();
  const quotations = await prisma.quotation.count();
  const customers = await prisma.customer.count();

  console.log("Counts in DB:");
  console.log("Users:", users);
  console.log("Projects:", projects);
  console.log("Opportunities:", opportunities);
  console.log("Quotations:", quotations);
  console.log("Customers:", customers);

  const sampleOpportunities = await prisma.opportunity.findMany({
    take: 5,
    include: {
      customer: true,
      project: true,
    }
  });
  console.log("Sample Opportunities:", JSON.stringify(sampleOpportunities, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
