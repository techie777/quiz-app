const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const allCats = await prisma.category.findMany({
    select: { id: true, topic: true, slug: true, parentId: true }
  });
  console.log('Total categories in DB:', allCats.length);

  const totalQuestions = await prisma.question.count();
  console.log('Total questions in DB:', totalQuestions);

  const sampleQuestions = await prisma.question.findMany({
    take: 10,
    select: { id: true, text: true, categoryId: true, category_id: true }
  });
  console.log('Sample questions:', sampleQuestions);

  const catIdSet = new Set(allCats.map(c => c.id));

  // Count how many questions match categoryId vs category_id
  const allQuestionCatIds = await prisma.question.findMany({
    select: { categoryId: true, category_id: true }
  });

  let matchingCategoryId = 0;
  let matchingCategory_id = 0;
  let unmatchedBoth = 0;

  for (const q of allQuestionCatIds) {
    const m1 = catIdSet.has(q.categoryId);
    const m2 = catIdSet.has(q.category_id);
    if (m1) matchingCategoryId++;
    if (m2) matchingCategory_id++;
    if (!m1 && !m2) unmatchedBoth++;
  }

  console.log('matching question.categoryId to category.id:', matchingCategoryId);
  console.log('matching question.category_id to category.id:', matchingCategory_id);
  console.log('unmatched both:', unmatchedBoth);

  await prisma.$disconnect();
}

test().catch(console.error);
