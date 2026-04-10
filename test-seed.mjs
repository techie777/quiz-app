import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding dummy SSC data...");
  const rand = Math.floor(Math.random() * 10000);

  const category = await prisma.mockCategory.create({
    data: {
      name: `SSC Exam Set ${rand}`,
      slug: `ssc-${rand}`,
      icon: "🏛️",
      sortOrder: 1,
    }
  });

  const exam = await prisma.mockExam.create({
    data: {
      name: `SSC CGL ${rand} Mock`,
      slug: `ssc-cgl-${rand}-mock`,
      emoji: "📝",
      description: "Staff Selection Commission Combined Graduate Level Examination dummy data",
      categoryId: category.id,
      sortOrder: 1,
      hidden: false,
    }
  });

  await prisma.mockExamSection.create({
    data: {
      examId: exam.id,
      title: "SSC CGL Eligibility Criteria",
      content: "<p>The Staff Selection Commission conducts the SSC CGL exam... Start your preparation with our curated mock tests below.</p>",
      sortOrder: 1
    }
  });

  const existingPaper = await prisma.mockPaper.findFirst({
    where: { isLive: true }
  });

  let paperId = null;
  if (existingPaper) {
    paperId = existingPaper.id;
    await prisma.mockPaper.update({
      where: { id: existingPaper.id },
      data: { examId: exam.id }
    });
    console.log(`Linked existing paper to MockExam`);
  }

  const studyMaterial = await prisma.studyMaterial.create({
    data: {
      name: `Ultimate SSC Book ${rand}`,
      slug: `ssc-book-${rand}`,
      image: "https://images.unsplash.com/photo-1546410531-fdd9de04812a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      description: "The ultimate guide covering Tier I and Tier II syllabus for the SSC.",
      authors: "QuizWeb Editorial Team",
      alignedTo: "SSC CGL"
    }
  });

  const subject1 = await prisma.studySubject.create({
    data: {
      name: "Quantitative Aptitude",
      slug: `quant-${rand}`,
      sortOrder: 1,
      materialId: studyMaterial.id
    }
  });

  await prisma.studyChapter.create({
    data: {
      title: "Number Systems",
      slug: "number-systems",
      content: "<h3>Introduction to Number Systems</h3><p>A number system is a writing system to express numbers...</p>",
      sortOrder: 1,
      subjectId: subject1.id,
      practiceId: paperId 
    }
  });

  console.log("Database seeded successfully with SSC dummy data!");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
