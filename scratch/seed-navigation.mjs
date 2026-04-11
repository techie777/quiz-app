import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const links = [
    { name: "Home", href: "/", icon: "🏠", description: "Master Hub", sortOrder: 0 },
    { name: "Quizzes", href: "/quizzes", icon: "🧠", description: "Play dynamic quizzes", sortOrder: 1 },
    { name: "Daily Quiz", href: "/daily", icon: "🏆", description: "Take our daily quiz", sortOrder: 2 },
    { name: "Daily Current Affairs", href: "/daily-current-affairs", icon: "📰", description: "Latest daily updates", sortOrder: 3 },
    { name: "Govt Jobs Alerts", href: "/govt-jobs-alerts", icon: "💼", description: "Job notifications", sortOrder: 4 },
    { name: "Mock Tests", href: "/mock-tests", icon: "✍️", description: "Practice papers", sortOrder: 5 },
    { name: "Govt Study Material", href: "/govt-study", icon: "📚", description: "FlexBook study notes", sortOrder: 6 },
    { name: "Book My Course", href: "/book-my-course", icon: "🎒", description: "Order courses online", sortOrder: 7 },
    { name: "Career Guide", href: "/career-guide", icon: "🧭", description: "Career guidance", sortOrder: 8 },
    { name: "Fun facts", href: "/fun-facts", icon: "✨", description: "Amazing facts", sortOrder: 9 },
    { name: "True/False", href: "/true-false", icon: "✅", description: "Interactive challenges", sortOrder: 10 },
    { name: "School Study", href: "/school-study", icon: "🎓", description: "Interactive revision", sortOrder: 11 },
  ];

  console.log("Seeding initial navigation links...");

  for (const link of links) {
    await prisma.navigationLink.upsert({
      where: { href: link.href },
      update: { ...link },
      create: { ...link }
    });
  }

  console.log("Navigation seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
