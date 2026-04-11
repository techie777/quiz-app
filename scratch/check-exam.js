const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const exams = await prisma.mockExam.findMany({ take: 5 });
    console.log("Exams found:", exams.length);
    console.log(JSON.stringify(exams, null, 2));
    
    // Check specific ID
    const specific = await prisma.mockExam.findUnique({ where: { id: "69d81622b496ebd9e91a66e7" } });
    console.log("Specific exam found:", specific ? "YES" : "NO");
    if (specific) console.log(specific);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
