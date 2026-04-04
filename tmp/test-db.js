const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const total = await prisma.category.count();
    console.log("Total Categories without where:", total);
    
    const totalWithWhere = await prisma.category.count({
      where: {
        hidden: false,
        parentId: null
      }
    });
    console.log("Total Categories with where:", totalWithWhere);
    
    const countWithOnlyHidden = await prisma.category.count({
      where: { hidden: false }
    });
    console.log("Total hidden false:", countWithOnlyHidden);
    
    // Check if there are ANY categories in DB at all
    const sample = await prisma.category.findFirst();
    console.log("Sample:", sample ? sample.id : "null");
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
