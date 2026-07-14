const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const govtSubjects = [
  // Section A
  { title: "Modern Indian History", emoji: "📜", section: "Section A: General Awareness & Static GK" },
  { title: "Ancient & Medieval Indian History", emoji: "🏛️", section: "Section A: General Awareness & Static GK" },
  { title: "Indian Polity & Constitution", emoji: "⚖️", section: "Section A: General Awareness & Static GK" },
  { title: "Geography", emoji: "🌍", section: "Section A: General Awareness & Static GK" },
  { title: "Indian Economy", emoji: "💰", section: "Section A: General Awareness & Static GK" },
  { title: "General Science", emoji: "🔬", section: "Section A: General Awareness & Static GK" },
  { title: "Life Sciences (Biology)", emoji: "🧬", section: "Section A: General Awareness & Static GK" },
  { title: "Static GK Trivia", emoji: "🧠", section: "Section A: General Awareness & Static GK" },
  { title: "Art, Culture & Literature", emoji: "🎭", section: "Section A: General Awareness & Static GK" },
  { title: "Current Affairs & Government Schemes", emoji: "📰", section: "Section A: General Awareness & Static GK" },
  // Section B
  { title: "Arithmetic Proficiency", emoji: "➕", section: "Section B: Quantitative Aptitude (Mathematics)" },
  { title: "Time & Motion Math", emoji: "⏱️", section: "Section B: Quantitative Aptitude (Mathematics)" },
  { title: "Number Systems & Basic Algebra", emoji: "🧮", section: "Section B: Quantitative Aptitude (Mathematics)" },
  { title: "Mensuration & Geometry", emoji: "📐", section: "Section B: Quantitative Aptitude (Mathematics)" },
  { title: "Data Interpretation (DI)", emoji: "📊", section: "Section B: Quantitative Aptitude (Mathematics)" },
  // Section C
  { title: "Verbal Reasoning", emoji: "🗣️", section: "Section C: Reasoning Ability & Intelligence" },
  { title: "Logical & Analytical Reasoning", emoji: "🧩", section: "Section C: Reasoning Ability & Intelligence" },
  { title: "Non-Verbal Reasoning", emoji: "👁️", section: "Section C: Reasoning Ability & Intelligence" },
  // Section D
  { title: "English Language & Comprehension", emoji: "📖", section: "Section D: Languages & Digital Literacy" }
];

async function seed() {
  console.log("Shifting existing sections...");
  await prisma.section.updateMany({
    data: { order: { increment: 1 } }
  });

  console.log("Creating Govt Exams section...");
  const govtSection = await prisma.section.create({
    data: {
      name: "Govt Exams",
      nameHi: "सरकारी परीक्षाएं",
      order: 1,
      isVisible: true
    }
  });

  const sectionsMap = {};
  let subOrder = 1;
  for (const item of govtSubjects) {
    if (!sectionsMap[item.section]) {
      console.log(`Creating subsection ${item.section}...`);
      sectionsMap[item.section] = await prisma.subSection.create({
        data: {
          name: item.section,
          sectionId: govtSection.id,
          order: subOrder++,
          quizIds: []
        }
      });
    }

    const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let cat = await prisma.category.findUnique({ where: { slug } });
    if (!cat) {
      console.log(`Creating category ${item.title}...`);
      cat = await prisma.category.create({
        data: {
          topic: item.title,
          slug,
          emoji: item.emoji,
          categoryClass: "bg-gradient-to-br from-blue-500 to-cyan-600",
          hidden: false,
          chips: JSON.stringify(["Govt Exams"])
        }
      });
    }

    console.log(`Linking ${item.title} to subsection...`);
    await prisma.subSection.update({
      where: { id: sectionsMap[item.section].id },
      data: {
        quizIds: { push: cat.id }
      }
    });
  }

  console.log("Seeding complete!");
}

seed().catch(console.error).finally(() => prisma.$disconnect());
