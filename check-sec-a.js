const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSectionA() {
  const govtSection = await prisma.section.findFirst({
    where: { name: "Govt Exams" },
    include: { subSections: true }
  });

  const sectionA = govtSection.subSections.find(s => s.name.includes("Section A"));
  console.log("Section A quizIds:", sectionA.quizIds);

  const categories = await prisma.category.findMany({
    where: { id: { in: sectionA.quizIds } }
  });

  categories.forEach((c, idx) => {
    console.log(`${idx + 1}. ${c.topic}`);
  });
}

checkSectionA().catch(e => console.error(e)).finally(() => prisma.$disconnect());
