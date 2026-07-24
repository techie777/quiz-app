const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listGovt() {
  const categories = await prisma.category.findMany({
    where: { categoryClass: { contains: "govt-exam" } },
    select: { id: true, topic: true, hidden: true }
  });
  console.log(`Found ${categories.length} govt-exam categories.`);
  categories.forEach((c, idx) => console.log(`${idx+1}. ${c.topic} (Hidden: ${c.hidden})`));
}

listGovt().catch(e => console.error(e)).finally(() => prisma.$disconnect());
