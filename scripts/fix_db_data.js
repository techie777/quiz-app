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

    console.log("=== 1. FIXING NULL CATEGORY_ID QUESTIONS ===");
    // Find a general category for orphaned speed-test questions
    const generalCat = await catCol.findOne({ slug: "general-knowledge" }) || await catCol.findOne({});
    console.log("Using fallback category:", generalCat.topic, generalCat._id);

    const updateNullRes = await qCol.updateMany(
      {
        $or: [
          { categoryId: null },
          { categoryId: { $exists: false } }
        ]
      },
      {
        $set: {
          categoryId: generalCat._id,
          category_id: generalCat._id,
        }
      }
    );
    console.log(`Updated ${updateNullRes.modifiedCount} questions with null/missing categoryId.`);

    console.log("\n=== 2. NORMALIZING OPTIONS_LIST TO PLAIN STRING ARRAYS ===");
    // Find all questions where options_list has objects
    const cursor = qCol.find({
      options_list: { $exists: true, $type: "array" }
    });

    let fixedCount = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (Array.isArray(doc.options_list)) {
        let hasObject = false;
        const normalized = doc.options_list.map(opt => {
          if (typeof opt === 'object' && opt !== null) {
            hasObject = true;
            return opt.text || opt.text_hi || opt.text_en || JSON.stringify(opt);
          }
          return String(opt || '');
        });

        if (hasObject) {
          await qCol.updateOne(
            { _id: doc._id },
            { $set: { options_list: normalized } }
          );
          fixedCount++;
        }
      }
    }
    console.log(`Normalized ${fixedCount} questions with object-based options_list to plain string arrays.`);

    console.log("\n=== 3. RE-LINKING UNLINKED CATEGORY_ID QUESTIONS ===");
    // Check unlinked categoryIds in Question
    const allCats = await catCol.find({}).toArray();
    const catMap = new Map();
    for (const c of allCats) {
      catMap.set(c._id.toString(), c);
      if (c.slug) catMap.set(c.slug, c);
    }

    // Mapping from legacy unlinked categoryIds to matching Category document
    // Let's inspect each distinct categoryId in Question
    const distinctCatIds = await qCol.distinct("categoryId");
    let relinkedQuestions = 0;

    for (const cid of distinctCatIds) {
      if (!cid) continue;
      const cidStr = cid.toString();
      if (!catMap.has(cidStr)) {
        // Find sample question
        const sample = await qCol.findOne({ categoryId: cid });
        if (!sample) continue;

        // Try to match by tags or category_id or subject
        let targetCat = null;
        if (sample.category_id && catMap.has(sample.category_id.toString())) {
          targetCat = catMap.get(sample.category_id.toString());
        } else if (Array.isArray(sample.tags)) {
          for (const tag of sample.tags) {
            if (catMap.has(tag)) {
              targetCat = catMap.get(tag);
              break;
            }
          }
        }

        if (!targetCat && sample.category && catMap.has(sample.category)) {
          targetCat = catMap.get(sample.category);
        }

        if (!targetCat) {
          targetCat = generalCat;
        }

        const res = await qCol.updateMany(
          { categoryId: cid },
          { $set: { categoryId: targetCat._id } }
        );
        console.log(`Relinked ${res.modifiedCount} questions from unlinked ${cidStr} -> '${targetCat.topic}' (${targetCat._id})`);
        relinkedQuestions += res.modifiedCount;
      }
    }
    console.log(`Total relinked questions: ${relinkedQuestions}`);

    console.log("\n=== 4. SYNCING QUESTION COUNTS ON CATEGORIES ===");
    for (const cat of allCats) {
      const count = await qCol.countDocuments({ categoryId: cat._id });
      await catCol.updateOne(
        { _id: cat._id },
        {
          $set: {
            questionCount: count,
            totalQuestions: count,
            status: count > 0 ? "live" : (cat.status || "coming_soon")
          }
        }
      );
    }
    console.log(`Updated question counts for all ${allCats.length} categories.`);

  } finally {
    await client.close();
  }
}

run().catch(console.error);
