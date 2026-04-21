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
      duplicates.push({ id: it.id, key, firstId: seen.get(key) });
    } else {
      seen.set(key, it.id);
    }
  }
  
  console.log(`Found ${duplicates.length} duplicates.`);
  if (duplicates.length > 0) {
    console.log('Duplicates:', duplicates.slice(0, 5));
    // Optionally delete them
    /*
    for (const d of duplicates) {
      await prisma.currentAffair.delete({ where: { id: d.id } });
    }
    console.log('Deleted all duplicates.');
    */
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
