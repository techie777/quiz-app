const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding IBPS Dummy Data...');

  // 1. Find or Create IBPS Category
  let category = await prisma.mockCategory.findUnique({
    where: { slug: 'ibps' }
  });

  if (!category) {
    category = await prisma.mockCategory.create({
      data: {
        name: 'IBPS',
        slug: 'ibps',
        icon: '🏦',
        sortOrder: 2
      }
    });
    console.log('✅ Created IBPS Category');
  }

  // 2. Clear existing dummy exam if exists
  await prisma.mockExam.deleteMany({
    where: { slug: 'ibps-po-dummy' }
  });

  // 3. Create IBPS PO Exam (Sub-Category)
  const exam = await prisma.mockExam.create({
    data: {
      categoryId: category.id,
      name: 'IBPS PO 2026',
      slug: 'ibps-po-dummy',
      emoji: '👔',
      description: 'Comprehensive preparation portal for IBPS Probationary Officers.',
      quizCategoryIds: [],
      booksJson: JSON.stringify([
        {
          title: "IBPS PO Phase I & II Guide",
          author: "Arihant Experts",
          image: "https://m.media-amazon.com/images/I/81m6-N+1mDL.jpg",
          link: "https://amazon.in"
        }
      ]),
      studyMaterialJson: JSON.stringify([
        {
          title: "PO Detailed Syllabus 2026",
          description: "Official PDF for latest syllabus and exam pattern.",
          link: "/downloads/ibps-syllabus.pdf"
        }
      ])
    }
  });
  console.log('✅ Created IBPS PO Exam');

  // 4. Add Info Sections (Tabs logic)
  await prisma.mockExamSection.createMany({
    data: [
      {
        examId: exam.id,
        title: "Exam Pattern",
        type: "HEADING",
        content: "Detailed breakdown of Pre and Mains examination.",
        sortOrder: 0
      },
      {
        examId: exam.id,
        title: "Important Dates",
        type: "DATES",
        content: JSON.stringify({
          "Notification": "July 2026",
          "Prelims Exam": "October 2026",
          "Mains Result": "January 2027"
        }),
        sortOrder: 1
      },
      {
        examId: exam.id,
        title: "Eligibility Criteria",
        type: "LIST",
        content: JSON.stringify([
          "Age: 20-30 years",
          "Degree in any discipline from a recognized University",
          "Computer Literacy is mandatory"
        ]),
        sortOrder: 2
      }
    ]
  });
  console.log('✅ Created Info Sections');

  // 5. Add Dummy Papers
  await prisma.mockPaper.create({
    data: {
      examId: exam.id,
      title: "IBPS PO 2026: Full Mock Test #1",
      slug: 'ibps-po-2026-mock-1',
      timeLimit: 60,
      totalMarks: 100,
      paperType: 'MOCK',
      year: 2026,
      isLive: true,
      instructions: "This is a full-length mock test matching the latest pattern."
    }
  });

  await prisma.mockPaper.create({
    data: {
      examId: exam.id,
      title: "IBPS PO 2025: Official PYP",
      slug: 'ibps-po-2025-pyp',
      timeLimit: 60,
      totalMarks: 100,
      paperType: 'PYP',
      year: 2025,
      isLive: true,
      instructions: "Official previous year paper for practice."
    }
  });
  console.log('✅ Created Mock & PYP Papers');

  console.log('✨ Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
