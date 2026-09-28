import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

const DEFAULT_DB_URL = "mongodb+srv://admin:admin@cluster0.oz8064k.mongodb.net/quizweb?retryWrites=true&w=majority&appName=Cluster0";
const DEFAULT_SECRET = "637b5d8a9e2f4c1b0a8d7e6f5c4b3a2d";

try {
  dotenv.config({ path: ".env.local" });
  dotenv.config();
} catch (e) {}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DEFAULT_DB_URL;
}
if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = DEFAULT_SECRET;
}

let dbUrl = process.env.DATABASE_URL || DEFAULT_DB_URL;
// Ensure readPreference is primary so MongoDB transactions and upserts succeed
if (dbUrl.includes("readPreference=primaryPreferred")) {
  dbUrl = dbUrl.replace("readPreference=primaryPreferred", "readPreference=primary");
} else if (!dbUrl.includes("readPreference=")) {
  dbUrl += (dbUrl.includes("?") ? "&" : "?") + "readPreference=primary";
}

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

globalForPrisma.prisma = prisma;

export default prisma;