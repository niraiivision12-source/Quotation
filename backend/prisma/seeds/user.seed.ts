import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Admin@123", 10);

  const exists = await prisma.user.findUnique({
    where: {
      email: "owner@system.com",
    },
  });

  if (exists) {
    console.log("Owner already exists");
    return;
  }

  await prisma.user.create({
    data: {
      name: "System Owner",
      email: "owner@system.com",
      password,
      role: UserRole.OWNER,
    },
  });

  console.log("Owner created");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
