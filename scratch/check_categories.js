const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.category.findMany({
    include: {
      _count: {
        select: { questions: true }
      }
    }
  });
  
  const structure = cats.map(c => ({
    id: c.id,
    topic: c.topic,
    parentId: c.parentId,
    qCount: c._count.questions,
    hasQuestions: c._count.questions > 0
  }));
  
  console.log(JSON.stringify(structure, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
