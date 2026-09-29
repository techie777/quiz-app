require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const { MongoClient } = require('mongodb');

async function fix() {
  const client = new MongoClient(process.env.DATABASE_URL);
  await client.connect();
  const db = client.db();
  const qCol = db.collection('Question');

  // Find all questions where options is an Array
  const questions = await qCol.find({}).toArray();
  let fixedCount = 0;

  for (const q of questions) {
    let needsUpdate = false;
    const update = {};

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
      fixedCount++;
    }
  }

  console.log(`Converted options array to JSON string for ${fixedCount} questions.`);

  // Now test Prisma findMany
  const { prisma } = require('../src/lib/prisma.js');
  try {
    const cats = await prisma.category.findMany({
      where: { hidden: false },
      include: {
        _count: { select: { questions: true } },
        questions: {
          take: 3,
          select: {
            id: true,
            text: true,
            textHi: true,
            options: true,
            optionsHi: true,
          }
        }
      }
    });
    console.log(`SUCCESS! Prisma returned ${cats.length} categories.`);
  } catch (err) {
    console.error('Prisma test error:', err);
  }

  await client.close();
}

fix().catch(console.error);
