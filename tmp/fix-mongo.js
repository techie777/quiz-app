const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const res = await prisma.$runCommandRaw({
      delete: "Category",
      deletes: [
        { q: { topic: null }, limit: 0 },
        { q: { topic: { $exists: false } }, limit: 0 }
      ]
    });
    console.log("Cleanup:", res);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
