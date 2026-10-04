const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const taxCat = await prisma.taxonomyCategory.findUnique({
      where: { id: "6aba83d439d6daab73c92278" }
    });
    console.log("TaxonomyCategory 6aba83d439d6daab73c92278:", taxCat);

    const taxTopic = await prisma.taxonomyTopic.findUnique({
      where: { id: "6aba83d439d6daab73c9227f" }
    });
    console.log("TaxonomyTopic 6aba83d439d6daab73c9227f:", taxTopic);

    const taxCatCount = await prisma.taxonomyCategory.count();
    const taxTopicCount = await prisma.taxonomyTopic.count();
    console.log("Total TaxonomyCategory:", taxCatCount, "Total TaxonomyTopic:", taxTopicCount);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
