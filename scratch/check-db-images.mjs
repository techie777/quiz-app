import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const all = await prisma.funFact.count();
  const withImages = await prisma.funFact.count({
    where: {
      image: { not: "" },
      NOT: { image: null }
    }
  });
  console.log(`Total Facts: ${all}`);
  console.log(`Facts with Images: ${withImages}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
