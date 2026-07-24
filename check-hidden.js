const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHiddenGovt() {
  const categories = await prisma.category.findMany({
    where: { categoryClass: "govt-exam" }
  });

  console.log(`Found ${categories.length} govt-exam categories.`);
  const hidden = categories.filter(c => c.hidden);
  console.log(`${hidden.length} are hidden:`);
  hidden.forEach(c => console.log(`- ${c.topic} (ID: ${c.id})`));

  const visible = categories.filter(c => !c.hidden);
  console.log(`\n${visible.length} are visible:`);
  visible.forEach(c => console.log(`- ${c.topic}`));
}

checkHiddenGovt().catch(e => console.error(e)).finally(() => prisma.$disconnect());
