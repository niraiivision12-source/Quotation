import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Admin@123", 10);

  const usersToCreate = [
    // 1 Owner
    { name: "Rajesh Sharma", email: "owner@system.com", password, role: UserRole.OWNER },
    // 4 Salesmen
    { name: "Suresh Patel", email: "suresh.sales@system.com", password, role: UserRole.SALESMAN },
    { name: "Amit Mishra", email: "amit.sales@system.com", password, role: UserRole.SALESMAN },
    { name: "Vikram Nair", email: "vikram.sales@system.com", password, role: UserRole.SALESMAN },
    { name: "Priya Sen", email: "priya.sales@system.com", password, role: UserRole.SALESMAN },
    // 2 Accountants
    { name: "Sunil Gupta", email: "sunil.finance@system.com", password, role: UserRole.ACCOUNTANT },
    { name: "Neha Bhat", email: "neha.finance@system.com", password, role: UserRole.ACCOUNTANT },
    // 2 Attendants
    { name: "Anil Yadav", email: "anil.care@system.com", password, role: UserRole.ATTENDANT },
    { name: "Ritu Kulkarni", email: "ritu.care@system.com", password, role: UserRole.ATTENDANT },
  ];

  console.log("Seeding users...");

  for (const u of usersToCreate) {
    const exists = await prisma.user.findUnique({
      where: {
        email: u.email,
      },
    });

    if (exists) {
      console.log(`User already exists: ${u.email}`);
    } else {
      await prisma.user.create({
        data: u,
      });
      console.log(`Created user: ${u.name} (${u.role})`);
    }
  }

  console.log("User seeding complete");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
