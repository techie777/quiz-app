require('dotenv').config({ path: __dirname + '/../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dhurandar = await prisma.category.findFirst({
    where: { topic: { contains: 'Dhurandar', mode: 'insensitive' } }
  });
  console.log('Dhurandar Category:', dhurandar?.id, dhurandar?.topic);

  if (!dhurandar) {
    console.log('Dhurandar not found.');
    return;
  }

  let moviesSection = await prisma.section.findFirst({
    where: { name: { contains: 'Movies', mode: 'insensitive' } }
  });

  if (!moviesSection) {
    console.log('Creating Movies & Web Series section...');
    moviesSection = await prisma.section.create({
      data: {
        name: 'Movies & Web Series',
        nameHi: 'फिल्में और वेब सीरीज',
        order: 5,
      }
    });
  }

  let bollywoodSub = await prisma.subSection.findFirst({
    where: { sectionId: moviesSection.id, name: { contains: 'Bollywood', mode: 'insensitive' } }
  });

  if (!bollywoodSub) {
    console.log('Creating Bollywood Movies subsection...');
    bollywoodSub = await prisma.subSection.create({
      data: {
        name: 'Bollywood Movies',
        nameHi: 'बॉलीवुड फिल्में',
        sectionId: moviesSection.id,
        order: 1,
        quizIds: [dhurandar.id]
      }
    });
  } else {
    const quizIds = new Set(bollywoodSub.quizIds || []);
    quizIds.add(dhurandar.id);
    await prisma.subSection.update({
      where: { id: bollywoodSub.id },
      data: { quizIds: Array.from(quizIds) }
    });
  }
  
  console.log('Updated successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
