const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedData() {
  try {
    console.log('Creating sample True/False data...');
    
    // Create sample categories
    const scienceCat = await prisma.trueFalseCategory.upsert({
      where: { slug: 'science' },
      update: { name: 'Science', nameHi: 'विज्ञान', slug: 'science', sortOrder: 1 },
      create: { name: 'Science', nameHi: 'विज्ञान', slug: 'science', sortOrder: 1 }
    });

    const historyCat = await prisma.trueFalseCategory.upsert({
      where: { slug: 'history' },
      update: { name: 'History', nameHi: 'इतिहास', slug: 'history', sortOrder: 2 },
      create: { name: 'History', nameHi: 'इतिहास', slug: 'history', sortOrder: 2 }
    });

    const geographyCat = await prisma.trueFalseCategory.upsert({
      where: { slug: 'geography' },
      update: { name: 'Geography', nameHi: 'भूगोल', slug: 'geography', sortOrder: 3 },
      create: { name: 'Geography', nameHi: 'भूगोल', slug: 'geography', sortOrder: 3 }
    });

    console.log('Categories created/updated:', { 
      science: scienceCat.id, 
      history: historyCat.id, 
      geography: geographyCat.id 
    });

    // Create sample questions
    const questions = [
      {
        categoryId: scienceCat.id,
        statement: 'The Earth is flat.',
        statementHi: 'धरती चपटी है।',
        correctAnswer: false,
        explanation: 'The Earth is round, not flat. It is an oblate spheroid.',
        explanationHi: 'धरती चपटी नहीं है, बल्कि गोल है। यह एक ओबलेट स्फेरॉइड है।'
      },
      {
        categoryId: scienceCat.id,
        statement: 'Water boils at 100 degrees Celsius at sea level.',
        statementHi: 'समुद्र तल पर जल 100 डिग्री सेल्सियस पर उबलता है।',
        correctAnswer: true,
        explanation: 'At standard atmospheric pressure (sea level), water boils at exactly 100°C.',
        explanationHi: 'मानक वायुमंडिक दाब (समुद्र तल) पर, जल ठीक 100°C पर उबलता है।'
      },
      {
        categoryId: historyCat.id,
        statement: 'The Great Wall of China is visible from the Moon.',
        statementHi: 'चीन की महान दीवार चांद से दिखाई देती है।',
        correctAnswer: false,
        explanation: 'This is a common misconception. The Great Wall is not visible from the Moon with naked eye.',
        explanationHi: 'यह एक सामान्य गलत धारणा है। महान दीवार चांद से नंगी आंखों से दिखाई नहीं देती।'
      },
      {
        categoryId: geographyCat.id,
        statement: 'Mount Everest is the highest mountain in the world.',
        statementHi: 'माउंट एवरेस्ट दुनिया की सबसे ऊंची पहाड़ है।',
        correctAnswer: true,
        explanation: 'Mount Everest, at 8,848 meters above sea level, is indeed the world highest mountain.',
        explanationHi: 'माउंट एवरेस्ट, समुद्र तल से 8,848 मीटर ऊंचाई, वास्तव में दुनिया की सबसे ऊंची पहाड़ है।'
      },
      {
        categoryId: geographyCat.id,
        statement: 'The Sahara Desert is the largest desert in the world.',
        statementHi: 'सहारा मरुभूमी दुनिया का सबसे बड़ा मरुभूमी है।',
        correctAnswer: true,
        explanation: 'The Sahara Desert is indeed the largest hot desert in the world, covering over 9 million square kilometers.',
        explanationHi: 'सहारा मरुभूमी वास्तव में दुनिया का सबसे बड़ा गर्म मरुभूमी है, जो 9 मिलियन वर्ग किलोमीटर से अधिक क्षेत्र में फैलता है।'
      }
    ];

    for (const question of questions) {
      await prisma.trueFalseQuestion.create({
        data: question
      });
    }

    console.log('✅ Sample True/False data created successfully!');
    console.log('Categories:', [scienceCat.name, historyCat.name, geographyCat.name]);
    console.log('Questions created:', questions.length);
    
  } catch (error) {
    console.error('❌ Error seeding True/False data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedData();
