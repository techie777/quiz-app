const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
}

async function migrate() {
  console.log('Starting slug migration...');
  const categories = await prisma.category.findMany();
  
  for (const cat of categories) {
    if (!cat.slug) {
      let baseSlug = slugify(cat.topic);
      let slug = baseSlug;
      let count = 1;
      
      // Ensure uniqueness
      while (true) {
        const existing = await prisma.category.findUnique({
          where: { slug }
        });
        if (!existing) break;
        slug = `${baseSlug}-${count}`;
        count++;
      }
      
      await prisma.category.update({
        where: { id: cat.id },
        data: { slug }
      });
      console.log(`Updated "${cat.topic}" -> ${slug}`);
    } else {
      console.log(`Skipping "${cat.topic}" (already has slug: ${cat.slug})`);
    }
  }
  console.log('Migration complete!');
  await prisma.$disconnect();
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
