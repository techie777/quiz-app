import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

// Add a connection timeout to prevent the build from hanging if the DB is unreachable
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;