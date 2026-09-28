const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const cats = await prisma.category.findMany({
      select: {
        id: true,
        topic: true,
        topicHi: true,
        slug: true,
        _count: { select: { questions: true } }
      }
    });
    console.log("Categories found:", cats.length);
    console.log(JSON.stringify(cats, null, 2));

    const totalQuestions = await prisma.question.count();
    console.log("Total questions in DB:", totalQuestions);

    const sampleQ = await prisma.question.findFirst();
    console.log("Sample question:", JSON.stringify(sampleQ, null, 2));
  } catch (err) {
    console.error("Error inspecting DB:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
