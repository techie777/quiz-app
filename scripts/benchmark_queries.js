const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.time("categories.findMany");
  const cats = await prisma.category.findMany({
    select: {
      id: true,
      topic: true,
      _count: { select: { questions: true } }
    }
  });
  console.timeEnd("categories.findMany");
  console.log("Cats length:", cats.length);
  const withQuestions = cats.filter(c => c._count.questions > 0);
  console.log("Categories with questions:", withQuestions.length);
  console.log("Top 10 categories by questions:", withQuestions.sort((a,b) => b._count.questions - a._count.questions).slice(0, 10));

  await prisma.$disconnect();
}

test().catch(console.error);
