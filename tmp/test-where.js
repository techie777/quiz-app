const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    let where = {
      hidden: false,
      parentId: null,
    };
    const total = await prisma.category.count({ where });
    console.log("Total matched:", total);
  } catch(e) { console.error(e); }
  finally { await prisma.$disconnect(); }
}
main();
