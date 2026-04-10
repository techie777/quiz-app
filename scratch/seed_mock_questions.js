const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMissingQuestions() {
  const paperId = '69d7a928898b31ac17957dbe';
  try {
    const paper = await prisma.mockPaper.findUnique({
      where: { id: paperId },
      include: { sections: true }
    });

    if (!paper) {
      console.log('Paper not found');
      return;
    }

    console.log(`Working on paper: ${paper.title}`);

    for (const section of paper.sections) {
      const count = await prisma.mockQuestion.count({
        where: { sectionId: section.id }
      });
      
      console.log(`Section ${section.name} current count: ${count}`);
      
      const needed = 4 - count;
      if (needed > 0) {
        console.log(`Adding ${needed} questions to ${section.name}`);
        for (let i = 0; i < needed; i++) {
          await prisma.mockQuestion.create({
            data: {
              paperId,
              sectionId: section.id,
              text: `Sample Question ${count + i + 1} for ${section.name}: What is the capital of France?`,
              textHi: `${section.name} के लिए नमूना प्रश्न ${count + i + 1}: फ्रांस की राजधानी क्या है?`,
              options: JSON.stringify(["Paris", "London", "Berlin", "Madrid"]),
              optionsHi: JSON.stringify(["पेरिस", "लंदन", "बर्लिन", "मैड्रिड"]),
              answer: 0,
              explanation: "Paris is the capital and most populous city of France.",
              explanationHi: "पेरिस फ्रांस की राजधानी और सबसे अधिक आबादी वाला शहर है।"
            }
          });
        }
      }
    }
    console.log('Done!');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingQuestions();
