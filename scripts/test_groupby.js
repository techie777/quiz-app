const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const cats = await prisma.category.findMany({ select: { id: true } });
  const categoryIds = cats.map(c => c.id);
  console.log("Testing groupBy for", categoryIds.length, "categories...");

  console.time("groupBy");
  try {
    const groups = await prisma.question.groupBy({
      by: ['categoryId', 'difficulty'],
      where: { categoryId: { in: categoryIds } },
      _count: true
    });
    console.timeEnd("groupBy");
    console.log("GroupBy succeeded! Groups:", groups.length);
  } catch (err) {
    console.timeEnd("groupBy");
    console.error("GroupBy error:", err);
  }

  await prisma.$disconnect();
}

test().catch(console.error);
