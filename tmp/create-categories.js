const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const gkCategories = [
  { topic: 'Biology GK', emoji: '🧬', categoryClass: 'category-biology-gk', originalLang: 'en' },
  { topic: 'Bollywood GK', emoji: '🎬', categoryClass: 'category-bollywood-gk', originalLang: 'en' },
  { topic: 'Chemistry GK', emoji: '⚗️', categoryClass: 'category-chemistry-gk', originalLang: 'en' },
  { topic: 'Computer GK', emoji: '💻', categoryClass: 'category-computer-gk', originalLang: 'en' },
  { topic: 'Economy GK', emoji: '📈', categoryClass: 'category-economy-gk', originalLang: 'en' },
  { topic: 'History GK', emoji: '🏛️', categoryClass: 'category-history-gk', originalLang: 'en' },
  { topic: 'Important days GK', emoji: '📅', categoryClass: 'category-important-days-gk', originalLang: 'en' },
  { topic: 'India GK', emoji: '🇮🇳', categoryClass: 'category-india-gk', originalLang: 'en' },
  { topic: 'Indian Dynasty & kingdom GK', emoji: '👑', categoryClass: 'category-indian-dynasty-kingdom-gk', originalLang: 'en' },
  { topic: 'Physics GK', emoji: '⚛️', categoryClass: 'category-physics-gk', originalLang: 'en' },
  { topic: 'Polity GK', emoji: '📜', categoryClass: 'category-polity-gk', originalLang: 'en' },
  { topic: 'Slogan GK', emoji: '🗣️', categoryClass: 'category-slogan-gk', originalLang: 'en' },
  { topic: 'Sports GK', emoji: '🏅', categoryClass: 'category-sports-gk', originalLang: 'en' },
  { topic: 'State GK', emoji: '🗺️', categoryClass: 'category-state-gk', originalLang: 'en' },
  { topic: 'World GK', emoji: '🌍', categoryClass: 'category-world-gk', originalLang: 'en' }
];

const othersCategories = [
  { topic: 'Founders', emoji: '👔', categoryClass: 'category-founders', originalLang: 'en' },
  { topic: 'Full Form', emoji: '🔤', categoryClass: 'category-full-form', originalLang: 'en' },
  { topic: 'World company & CEO', emoji: '🏢', categoryClass: 'category-world-company-ceo', originalLang: 'en' },
  { topic: 'Ramayana GK', emoji: '🏹', categoryClass: 'category-ramayana-gk', originalLang: 'en' },
  { topic: 'Religious GK', emoji: '🕉️', categoryClass: 'category-religious-gk', originalLang: 'en' },
  { topic: 'Mahabharat GK', emoji: '🛕', categoryClass: 'category-mahabharat-gk', originalLang: 'en' }
];

async function main() {
  try {
    // 1. Insert Categories
    console.log("Creating General Knowledge categories...");
    const gkIds = [];
    for (const c of gkCategories) {
      const created = await prisma.category.create({ data: { 
        ...c, 
        chips: JSON.stringify(["GK"]),
        description: `Questions on ${c.topic}`
      }});
      gkIds.push(created.id);
    }
    
    console.log("Creating Others categories...");
    const otherIds = [];
    for (const c of othersCategories) {
      const created = await prisma.category.create({ data: { 
        ...c, 
        chips: JSON.stringify(["Others"]),
        description: `Questions on ${c.topic}`
      }});
      otherIds.push(created.id);
    }

    // 2. Setup Section 'General Knowledge'
    let gkSection = await prisma.section.findFirst({ where: { name: 'General Knowledge' } });
    if (!gkSection) {
      gkSection = await prisma.section.create({ data: { name: 'General Knowledge', order: 1 }});
    }
    let gkSub = await prisma.subSection.findFirst({ where: { sectionId: gkSection.id, name: 'Topics' } });
    if (!gkSub) {
      gkSub = await prisma.subSection.create({ data: { name: 'Topics', order: 1, sectionId: gkSection.id, quizIds: gkIds }});
    } else {
      const updatedIds = Array.from(new Set([...gkSub.quizIds, ...gkIds]));
      await prisma.subSection.update({ where: { id: gkSub.id }, data: { quizIds: updatedIds }});
    }

    // 3. Setup Section 'Others'
    let othersSection = await prisma.section.findFirst({ where: { name: 'Others' } });
    if (!othersSection) {
      othersSection = await prisma.section.create({ data: { name: 'Others', order: 2 }});
    }
    let othersSub = await prisma.subSection.findFirst({ where: { sectionId: othersSection.id, name: 'Topics' } });
    if (!othersSub) {
      othersSub = await prisma.subSection.create({ data: { name: 'Topics', order: 1, sectionId: othersSection.id, quizIds: otherIds }});
    } else {
      const updatedIds = Array.from(new Set([...othersSub.quizIds, ...otherIds]));
      await prisma.subSection.update({ where: { id: othersSub.id }, data: { quizIds: updatedIds }});
    }

    console.log("Successfully created and tagged all categories!");
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
