const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding Mock Test Data...');

  // 1. Create Mock Exam
  const exam = await prisma.mockExam.upsert({
    where: { slug: 'ssc-cgl-2024' },
    update: {},
    create: {
      name: 'SSC CGL 2024',
      slug: 'ssc-cgl-2024',
      emoji: '🦁',
      description: 'Full-length practice papers for SSC Combined Graduate Level Examination.',
      sortOrder: 1
    }
  });

  // 2. Create Mock Paper
  const paper = await prisma.mockPaper.upsert({
    where: { slug: 'ssc-cgl-2024-tier1-full-01' },
    update: {},
    create: {
      examId: exam.id,
      title: 'SSC CGL 2024 Tier-I Official Mock #01',
      slug: 'ssc-cgl-2024-tier1-full-01',
      timeLimit: 60,
      totalMarks: 200,
      positiveMarking: 2.0,
      negativeMarking: 0.5,
      instructionType: 'TCS',
      showSolutions: true,
      isLive: true
    }
  });

  const sections = [
    { name: 'General Intelligence', order: 1 },
    { name: 'General Awareness', order: 2 },
    { name: 'Quantitative Aptitude', order: 3 },
    { name: 'English Comprehension', order: 4 }
  ];

  const sectionInstances = [];
  for (const s of sections) {
    const section = await prisma.mockSection.create({
      data: {
        paperId: paper.id,
        name: s.name,
        order: s.order
      }
    });
    sectionInstances.push(section);
  }

  // 3. Create Mock Questions
  const questions = [
    {
      text: 'Select the missing number from the given options: 5, 11, 23, 47, ?',
      textHi: 'दिए गए विकल्पों में से लुप्त संख्या का चयन करें: 5, 11, 23, 47, ?',
      options: ['94', '95', '96', '97'],
      optionsHi: ['94', '95', '96', '97'],
      answer: 1, // 95
      sectionId: sectionInstances[0].id
    },
    {
      text: 'Who has been appointed as the new CEO of NITI Aayog in 2024?',
      textHi: '2024 में नीति आयोग के नए सीईओ के रूप में किसे नियुक्त किया गया है?',
      options: ['B.V.R. Subrahmanyam', 'Amitabh Kant', 'Parameswaran Iyer', 'Rajiv Kumar'],
      optionsHi: ['बी.वी.आर. सुब्रह्मण्यम', 'अमिताभ कांत', 'परमेश्वरन अय्यर', 'राजीव कुमार'],
      answer: 0,
      sectionId: sectionInstances[1].id
    },
    {
        text: 'The average of first five prime numbers is:',
        textHi: 'प्रथम पांच अभाज्य संख्याओं का औसत है:',
        options: ['5.0', '5.2', '5.4', '5.6'],
        optionsHi: ['5.0', '5.2', '5.4', '5.6'],
        answer: 3, // (2+3+5+7+11)/5 = 28/5 = 5.6
        sectionId: sectionInstances[2].id
    }
  ];

  for (const q of questions) {
    await prisma.mockQuestion.create({
      data: {
        paperId: paper.id,
        sectionId: q.sectionId,
        text: q.text,
        textHi: q.textHi,
        options: JSON.stringify(q.options),
        optionsHi: JSON.stringify(q.optionsHi),
        answer: q.answer,
        type: 'MCQ'
      }
    });
  }

  console.log('✅ Seeding Complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
