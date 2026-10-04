const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
  const client = new MongoClient(process.env.DATABASE_URL);
  try {
    await client.connect();
    const db = client.db();
    
    // Check all collections in the database
    const collections = await db.listCollections().toArray();
    console.log("Collections in DB:", collections.map(c => c.name));

    const qCol = db.collection("Question");
    const distinctCatIds = await qCol.distinct("categoryId");
    const catCol = db.collection("Category");
    const existingCats = await catCol.find({}).toArray();
    const existingCatIds = new Set(existingCats.map(c => c._id.toString()));

    const unlinked = distinctCatIds.filter(id => id && !existingCatIds.has(id.toString()));
    console.log("Unlinked count:", unlinked.length);

    for (const uid of unlinked) {
      // Let's see if this ID exists in any other collection!
      let foundIn = [];
      for (const colInfo of collections) {
        const c = db.collection(colInfo.name);
        const match = await c.findOne({ _id: uid });
        if (match) foundIn.push(colInfo.name);
      }
      const qSample = await qCol.findOne({ categoryId: uid });
      console.log(`Unlinked ID ${uid} found in collections:`, foundIn, `Sample Q: "${qSample?.text?.slice(0, 40)}" tags:`, qSample?.tags);
    }

  } finally {
    await client.close();
  }
}

run().catch(console.error);
