require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const { MongoClient } = require('mongodb');

async function fixAll() {
  const client = new MongoClient(process.env.DATABASE_URL);
  await client.connect();
  const db = client.db();
  const qCol = db.collection('Question');

  console.log("Connected to MongoDB.");
  const total = await qCol.countDocuments();
  console.log(`Total questions: ${total}`);

  // 1. Fix options_list where elements are objects
  const badOptionsList = await qCol.find({ 'options_list.0': { $exists: true } }).toArray();
  let fixedOptionsList = 0;
  for (const q of badOptionsList) {
    if (Array.isArray(q.options_list)) {
      const isBad = q.options_list.some(item => typeof item === 'object' && item !== null);
      if (isBad) {
        const cleanStrings = q.options_list.map(item => {
          if (typeof item === 'object' && item !== null) {
            return item.text || item.text_en || item.name || JSON.stringify(item);
          }
          return String(item);
        });
        await qCol.updateOne({ _id: q._id }, { $set: { options_list: cleanStrings } });
        fixedOptionsList++;
      }
    }
  }
  console.log(`Fixed options_list on ${fixedOptionsList} questions.`);

  // 2. Fix correct where it's a string instead of integer
  const stringCorrectQuestions = await qCol.find({ correct: { $type: "string" } }).toArray();
  console.log(`Questions where correct is a string: ${stringCorrectQuestions.length}`);
  for (const q of stringCorrectQuestions) {
    await qCol.updateOne(
      { _id: q._id },
      { 
        $set: { 
          correct: 0,
          correctAnswer: q.correctAnswer || q.correct
        } 
      }
    );
  }
  console.log(`Fixed correct field on ${stringCorrectQuestions.length} questions.`);

  // 3. Ensure options and optionsHi are JSON strings
  const questions = await qCol.find({}).toArray();
  let fixedOptions = 0;
  for (const q of questions) {
    let update = {};
    let needsUpdate = false;
    if (Array.isArray(q.options)) {
      update.options = JSON.stringify(q.options);
      needsUpdate = true;
    }
    if (Array.isArray(q.options_hi)) {
      update.optionsHi = JSON.stringify(q.options_hi);
      needsUpdate = true;
    } else if (Array.isArray(q.optionsHi)) {
      update.optionsHi = JSON.stringify(q.optionsHi);
      needsUpdate = true;
    }
    if (needsUpdate) {
      await qCol.updateOne({ _id: q._id }, { $set: update });
      fixedOptions++;
    }
  }
  console.log(`Fixed options JSON strings on ${fixedOptions} questions.`);

  await client.close();

  // 4. Test Prisma query
  console.log("\nTesting Prisma query: category.findMany with full questions...");
  const { prisma } = require('../src/lib/prisma.js');
  try {
    const categories = await prisma.category.findMany({
      where: { hidden: false },
      include: {
        _count: { select: { questions: true } },
        questions: true // Fetch ALL fields to guarantee no Prisma type errors!
      },
      take: 20
    });
    console.log(`SUCCESS! Prisma returned ${categories.length} categories with full questions.`);
    const totalWithQ = categories.filter(c => c._count.questions > 0);
    console.log(`Sample categories with questions:`, totalWithQ.slice(0, 5).map(c => ({
      topic: c.topic,
      qCount: c._count.questions,
      sampleQuestion: c.questions[0]?.text
    })));
  } catch (err) {
    console.error("Prisma verification FAILED:", err);
  } finally {
    await prisma.$disconnect();
  }
}

fixAll().catch(console.error);
