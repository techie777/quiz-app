const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
  const client = new MongoClient(process.env.DATABASE_URL);
  try {
    await client.connect();
    const db = client.db();
    const qCol = db.collection("Question");

    const nullQuestions = await qCol.find({
      $or: [
        { categoryId: null },
        { categoryId: { $exists: false } }
      ]
    }).toArray();

    console.log("Count of null/missing categoryId questions:", nullQuestions.length);
    console.log("Sample null categoryId questions:", nullQuestions.slice(0, 3).map(q => ({
      _id: q._id,
      text: q.text,
      category_id: q.category_id,
      topic_id: q.topic_id,
      tags: q.tags
    })));

  } finally {
    await client.close();
  }
}

run().catch(console.error);
