
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: 'Science', slug: 'science', image: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=400&q=80', sortOrder: 1 },
    { name: 'Bollywood', slug: 'bollywood', image: 'https://images.unsplash.com/photo-1585951237318-9ea5e175b891?auto=format&fit=crop&w=400&q=80', sortOrder: 2 },
    { name: 'Cricket', slug: 'cricket', image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=400&q=80', sortOrder: 3 },
    { name: 'History', slug: 'history', image: 'https://images.unsplash.com/photo-1461360228754-6e81c478585b?auto=format&fit=crop&w=400&q=80', sortOrder: 4 },
    { name: 'Animals', slug: 'animals', image: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=400&q=80', sortOrder: 5 },
    { name: 'Space', slug: 'space', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80', sortOrder: 6 },
  ];

  for (const cat of categories) {
    await prisma.funFactCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }

  const scienceFacts = [
    { categoryId: (await prisma.funFactCategory.findUnique({ where: { slug: 'science' } })).id, description: 'Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible.' },
    { categoryId: (await prisma.funFactCategory.findUnique({ where: { slug: 'science' } })).id, description: 'A day on Venus is longer than a year on Venus. It takes about 243 Earth days to rotate once on its axis, but only 225 Earth days to orbit the Sun.' },
    { categoryId: (await prisma.funFactCategory.findUnique({ where: { slug: 'science' } })).id, description: 'Water can boil and freeze at the same time. This is known as the "triple point" where the temperature and pressure are just right for all three states (solid, liquid, and gas) to coexist in thermodynamic equilibrium.' },
  ];

  for (const fact of scienceFacts) {
    await prisma.funFact.create({ data: fact });
  }

  console.log('Seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
