const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const fact = await prisma.funFact.findFirst({
    where: { description: { contains: 'shark' } },
    select: { id: true, description: true, image: true }
  });
  console.log(JSON.stringify(fact, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
