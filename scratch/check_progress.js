const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProgress() {
  try {
    const progress = await prisma.userProgress.findMany({
      take: 10,
    });
    console.log('Sample Progress:', JSON.stringify(progress, null, 2));
    
    const usersWithProgress = await prisma.user.findMany({
      where: {
        quizProgress: {
          some: {}
        }
      },
      select: { name: true }
    });
    console.log('Users with progress:', usersWithProgress.length);
  } catch (error) {
    console.error('Error checking progress:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProgress();
