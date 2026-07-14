const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Forum Dummy Data...");

  // 1. Create a dummy user if none exists for authoring
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "test_forum_user@example.com",
        name: "Test User",
        isPro: true,
        proBadge: "PRO MEMBER"
      }
    });
  }

  // 2. Create Forum Groups
  const groups = [
    { name: "UPSC Civil Services", slug: "upsc", description: "All discussions related to UPSC exams.", icon: "🏛️" },
    { name: "SSC Exams", slug: "ssc", description: "CGL, CHSL, MTS and other SSC discussions.", icon: "🏢" },
    { name: "Bank PO & Clerk", slug: "banking", description: "IBPS, SBI, RBI exams discussion.", icon: "🏦" }
  ];

  const createdGroups = [];
  for (const g of groups) {
    const existing = await prisma.forumGroup.findUnique({ where: { slug: g.slug } });
    if (!existing) {
      createdGroups.push(await prisma.forumGroup.create({ data: g }));
    } else {
      createdGroups.push(existing);
    }
  }

  // 3. Create Topics and Comments
  if (createdGroups.length > 0) {
    const topic = await prisma.forumTopic.create({
      data: {
        title: "How to prepare for UPSC Prelims 2027?",
        content: "Please share some strategies and booklists for the upcoming UPSC prelims. I am starting my preparation now.",
        groupId: createdGroups[0].id,
        authorId: user.id,
        viewCount: 42,
        isPinned: true
      }
    });

    await prisma.forumComment.create({
      data: {
        content: "I recommend starting with NCERTs from class 6 to 12. Also, read The Hindu daily for current affairs.",
        topicId: topic.id,
        authorId: user.id
      }
    });

    console.log("Dummy data created successfully!");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
