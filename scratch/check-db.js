const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const guide = await prisma.careerGuide.findUnique({
    where: { slug: 'ias' },
    include: { sections: true }
  });
  console.log('--- DB DIAGNOSTIC ---');
  console.log('Slug:', guide?.slug);
  console.log('Name:', guide?.name);
  console.log('NameHi:', guide?.nameHi);
  console.log('DescriptionHi:', guide?.descriptionHi);
  console.log('Sections Count:', guide?.sections?.length);
  if (guide?.sections?.length > 0) {
    console.log('First Section Title:', guide.sections[0].title);
    console.log('First Section TitleHi:', guide.sections[0].titleHi);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
