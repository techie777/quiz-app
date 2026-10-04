const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
  const client = new MongoClient(process.env.DATABASE_URL);
  try {
    await client.connect();
    const db = client.db();
    const qCol = db.collection("Question");
    const catCol = db.collection("Category");

    const categories = await catCol.find({}).toArray();
    const existingCatIds = new Set(categories.map(c => c._id.toString()));

    const distinctCatIds = await qCol.distinct("categoryId");
    const unlinked = distinctCatIds.filter(id => id && !existingCatIds.has(id.toString()));

    console.log("Unlinked count:", unlinked.length);
    for (const uid of unlinked) {
      const qs = await qCol.find({ categoryId: uid }).limit(2).toArray();
      const count = await qCol.countDocuments({ categoryId: uid });
      console.log(`\nUID: ${uid} (count: ${count})`);
      qs.forEach(q => {
        console.log(`  Q: ${q.text} | tags: ${q.tags} | exam: ${q.exam} | catName: ${q.category}`);
      });
    }
  } finally {
    await client.close();
  }
}

run().catch(console.error);
