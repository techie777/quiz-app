const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst();
    console.log('User model fields:', Object.keys(user));
    console.log('Engine Theme:', user.engineTheme);
  } catch (e) {
    console.error('Error accessing User model:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
