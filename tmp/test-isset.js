const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const totalIsSet = await prisma.category.count({ where: { parentId: { isSet: false } } });
    console.log("Total isSet false:", totalIsSet);
    
    // Also check if admin endpoint has the same issue
  } catch(e) { console.error(e); }
  finally { await prisma.$disconnect(); }
}
main();
