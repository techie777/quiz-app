const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const idxs = await prisma.$runCommandRaw({ listIndexes: "Category" });
    console.log(JSON.stringify(idxs, null, 2));
  } catch(e) { console.error(e); }
  finally { await prisma.$disconnect(); }
}
main();
