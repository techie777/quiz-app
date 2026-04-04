const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const r1 = await prisma.$runCommandRaw({ dropIndexes: "Category", index: "Category_name_key" }).catch(() => null);
    const r2 = await prisma.$runCommandRaw({ dropIndexes: "Category", index: "Category_slug_key" }).catch(() => null);
    console.log("Indexes dropped:", {r1, r2});
  } catch(e) { console.error(e); }
  finally { await prisma.$disconnect(); }
}
main();
