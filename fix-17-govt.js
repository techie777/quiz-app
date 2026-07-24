const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixGovtTopics() {
  const topicsToRemove = [
    "Economy GK",
    "History GK",
    "Polity GK",
    "Ancient & Medieval Indian History",
    "Current Affairs & Government Schemes"
  ];

  const categories = await prisma.category.findMany({
    where: { 
      topic: { in: topicsToRemove },
      categoryClass: { contains: "govt-exam" }
    }
  });

  for (const cat of categories) {
    let newClass = cat.categoryClass.replace(/govt-exam/g, "").trim();
    // Clean up extra commas
    newClass = newClass.replace(/^,|,$/g, '').replace(/,+/g, ',');
    
    await prisma.category.update({
      where: { id: cat.id },
      data: { categoryClass: newClass || "" }
    });
    console.log(`Removed govt-exam from: ${cat.topic}`);
  }
}

fixGovtTopics().catch(e => console.error(e)).finally(() => prisma.$disconnect());
