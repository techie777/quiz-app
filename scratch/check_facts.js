const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const facts = await prisma.funFact.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, description: true, image: true }
  });
  console.log(JSON.stringify(facts, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
