const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
  const client = new MongoClient(process.env.DATABASE_URL);
  try {
    await client.connect();
    const db = client.db();
    const qCol = db.collection("Question");

    const total = await qCol.countDocuments();
    console.log("Total questions in MongoDB:", total);

    // Find questions where options_list contains objects or non-string
    const allQuestions = await qCol.find({
      options_list: { $exists: true, $ne: [] }
    }).toArray();

    let invalidCount = 0;
    const samples = [];

    for (const q of allQuestions) {
      if (Array.isArray(q.options_list)) {
        const hasObject = q.options_list.some(opt => typeof opt === 'object' && opt !== null);
        if (hasObject) {
          invalidCount++;
          if (samples.length < 5) {
            samples.push({ id: q._id, options_list: q.options_list });
          }
        }
      }
    }

    console.log(`Questions with object in options_list: ${invalidCount}/${allQuestions.length}`);
    console.log("Samples:", JSON.stringify(samples, null, 2));

  } finally {
    await client.close();
  }
}

run().catch(console.error);
