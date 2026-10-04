const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
  const client = new MongoClient(process.env.DATABASE_URL);
  try {
    await client.connect();
    const db = client.db();
    const catCol = db.collection("Category");
    const qCol = db.collection("Question");

    const categories = await catCol.find({}).toArray();
    console.log("Total Category docs in Mongo:", categories.length);

    // Group categories by with vs without questions
    let catsWithQs = 0;
    let totalQsLinked = 0;

    const summary = [];

    for (const cat of categories) {
      const qCount = await qCol.countDocuments({ categoryId: cat._id });
      if (qCount > 0) {
        catsWithQs++;
        totalQsLinked += qCount;
        summary.push({ id: cat._id.toString(), topic: cat.topic, slug: cat.slug, parentId: cat.parentId, qCount });
      }
    }

    console.log(`Categories with questions: ${catsWithQs}/${categories.length}, total questions linked: ${totalQsLinked}`);
    console.log("Categories with questions:", summary);

    // Now let's check what categoryIds in Question are NOT in Category collection
    const distinctCatIds = await qCol.distinct("categoryId");
    const catIdMap = new Map(categories.map(c => [c._id.toString(), c]));

    const unlinkedCatIds = [];
    for (const cid of distinctCatIds) {
      if (!cid) continue;
      const cidStr = cid.toString();
      if (!catIdMap.has(cidStr)) {
        const count = await qCol.countDocuments({ categoryId: cid });
        const sample = await qCol.findOne({ categoryId: cid });
        unlinkedCatIds.push({
          unlinkedId: cidStr,
          count,
          category_id: sample?.category_id?.toString(),
          topic_id: sample?.topic_id?.toString(),
          tags: sample?.tags,
          sampleText: sample?.text
        });
      }
    }

    console.log(`Unlinked categoryIds in Question: ${unlinkedCatIds.length}`);
    console.log("Unlinked categoryIds details:", JSON.stringify(unlinkedCatIds, null, 2));

  } finally {
    await client.close();
  }
}

run().catch(console.error);
