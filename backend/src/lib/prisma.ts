import { PrismaClient } from "@prisma/client";
import { devLocalStorage } from "../utils/async-storage";

const globalForPrisma = global as unknown as {
  prisma: any;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "stdout", level: "error" },
      { emit: "stdout", level: "info" },
      { emit: "stdout", level: "warn" },
    ],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

if (typeof (prisma as any).$on === "function") {
  (prisma as any).$on("query", (e: any) => {
    const store = devLocalStorage.getStore();
    if (store) {
      store.sqlQueries.push({
        query: e.query,
        params: e.params,
        duration: e.duration,
        timestamp: new Date(),
      });
    }
  });
}

