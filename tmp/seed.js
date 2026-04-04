const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const fallbackCategories = [
  {
    topic: "Science",
    emoji: "🔬",
    description: "Test your knowledge of physics, chemistry, biology, and more!",
    categoryClass: "category-science",
    hidden: false,
    originalLang: "en",
    isTrending: true,
    chips: JSON.stringify(["Science", "Education"]),
    sortOrder: 1,
  },
  {
    topic: "History",
    emoji: "📚",
    description: "Explore historical events, famous personalities, and ancient civilizations!",
    categoryClass: "category-history",
    hidden: false,
    originalLang: "en",
    isTrending: false,
    chips: JSON.stringify(["History", "Education"]),
    sortOrder: 2,
  },
  {
    topic: "General Knowledge",
    emoji: "🧠",
    description: "Challenge yourself with questions from various fields!",
    categoryClass: "category-gk",
    hidden: false,
    originalLang: "en",
    isTrending: true,
    chips: JSON.stringify(["GK", "Quick 5 Min"]),
    sortOrder: 3,
  }
];

async function main() {
  try {
    for (const cat of fallbackCategories) {
      await prisma.category.create({ data: cat });
    }
    console.log("Seeded successfully");
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
