const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const attempt = await prisma.mockAttempt.findFirst({
    orderBy: { startedAt: 'desc' },
    include: { paper: { include: { exam: true } } }
  });
  console.log("Attempt:", attempt.id, attempt.score, attempt.status);
  if (attempt) {
    console.log("paper:", attempt.paper?.title);
    if (attempt.paper) {
      console.log("exam:", attempt.paper.exam?.name);
    }
  }
}
run().catch(console.error).finally(() => prisma.$disconnect());
