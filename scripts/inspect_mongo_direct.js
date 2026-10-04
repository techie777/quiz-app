const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
  const client = new MongoClient(process.env.DATABASE_URL);
  try {
    await client.connect();
    const db = client.db();
    const col = db.collection("Question");

    const count = await col.countDocuments();
    console.log("Total Question count in Mongo:", count);

    // Let's sample 5 documents
    const samples = await col.find({}).limit(5).toArray();
    console.log("Samples:", samples.map(s => ({
      _id: s._id,
      categoryId: s.categoryId,
      categoryIdType: typeof s.categoryId,
      isCategoryIdObjectId: s.categoryId && s.categoryId._bsontype === 'ObjectID',
      category_id: s.category_id,
      category_idType: typeof s.category_id,
      topic_id: s.topic_id
    })));

    // Let's check how many have categoryId as ObjectId vs String vs null vs missing
    const withNull = await col.countDocuments({ categoryId: null });
    const withString = await col.countDocuments({ categoryId: { $type: "string" } });
    const withObjectId = await col.countDocuments({ categoryId: { $type: "objectId" } });
    const missing = await col.countDocuments({ categoryId: { $exists: false } });

    console.log({ withNull, withString, withObjectId, missing });

    // Now let's check what distinct categoryIds exist in Question
    const distinctCatIds = await col.distinct("categoryId");
    console.log("Total distinct categoryId in Question:", distinctCatIds.length);
    console.log("First 10 distinct categoryIds:", distinctCatIds.slice(0, 10));

    // Check if these distinct categoryIds exist in Category collection
    const catCol = db.collection("Category");
    const matchedCats = await catCol.find({
      $or: [
        { _id: { $in: distinctCatIds } },
        { _id: { $in: distinctCatIds.filter(id => id).map(id => {
          try { return new (require('mongodb').ObjectId)(id); } catch(e) { return null; }
        }).filter(Boolean) } }
      ]
    }).toArray();

    console.log("Matched categories in Category collection:", matchedCats.length);

  } finally {
    await client.close();
  }
}
run().catch(console.error);
