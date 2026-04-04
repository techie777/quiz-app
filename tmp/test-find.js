const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function find() {
  try {
    const cats = await prisma.category.findMany();
    console.log(cats);
  } catch(e) { console.error(e); }
  finally { await prisma.$disconnect(); }
}
find();
