require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient(process.env.DATABASE_URL);
  await client.connect();
  const db = client.db();

  console.log("Connected to MongoDB.");

  const questions = await db.collection('Question').find({}).toArray();
  console.log(`Total questions in DB: ${questions.length}`);

  let badCount = 0;
  const badSamples = [];

  for (const q of questions) {
    if (Array.isArray(q.options_list)) {
      const hasObject = q.options_list.some(opt => typeof opt === 'object' && opt !== null);
      if (hasObject) {
        badCount++;
        if (badSamples.length < 3) badSamples.push(q);
      }
    }
  }

  console.log(`Questions with Object in options_list: ${badCount}`);
  if (badSamples.length > 0) {
    console.log("First bad sample id:", badSamples[0]._id, "options_list:", badSamples[0].options_list);
  }

  await client.close();
}

main().catch(console.error);
