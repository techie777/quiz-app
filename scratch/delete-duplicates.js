const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.currentAffair.findMany({
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(`Total items: ${items.length}`);
  
  const seen = new Map();
  const duplicates = [];
  
  for (const it of items) {
    const key = `${it.date}-${it.heading}`;
    if (seen.has(key)) {
      duplicates.push(it.id);
    } else {
      seen.set(key, it.id);
    }
  }
  
  console.log(`Found ${duplicates.length} duplicates to delete.`);
  
  if (duplicates.length > 0) {
    const deleted = await prisma.currentAffair.deleteMany({
      where: {
        id: { in: duplicates }
      }
    });
    console.log(`Deleted ${deleted.count} duplicates.`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
