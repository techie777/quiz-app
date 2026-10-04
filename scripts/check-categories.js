const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const cat = await prisma.category.findUnique({
      where: { id: "65f1a2b3c4d5e6f7a8b9c0d7" }
    });
    console.log("Category 65f1a2b3c4d5e6f7a8b9c0d7:", cat);

    const cat2 = await prisma.category.findUnique({
      where: { id: "69ba7a3f0449e229d0fd4386" }
    });
    console.log("Category 69ba7a3f0449e229d0fd4386:", cat2);

    // Find all categories
    const allCats = await prisma.category.findMany({
      select: { id: true, topic: true, slug: true }
    });
    console.log("Total categories in Category collection:", allCats.length);

    // Let's check how many questions have categoryId: null
    // Raw mongo query
    const nullCatCount = await prisma.question.count({
      where: { categoryId: null }
    }).catch(e => e.message);
    console.log("Count with categoryId: null:", nullCatCount);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
