import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const exams = await prisma.mockExam.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        category: true,
        _count: {
          select: { papers: true, sections: true }
        }
      }
    });
    console.log(exams);
  } catch (e) {
    console.error(e);
  }
}
main().finally(() => prisma.$disconnect());
