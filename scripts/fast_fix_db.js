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

    console.log("=== 1. ENSURING NO NULL CATEGORY_ID ===");
    const generalCat = await catCol.findOne({ slug: "general-knowledge" }) || await catCol.findOne({});
    const nullRes = await qCol.updateMany(
      { $or: [{ categoryId: null }, { categoryId: { $exists: false } }] },
      { $set: { categoryId: generalCat._id, category_id: generalCat._id } }
    );
    console.log(`Fixed ${nullRes.modifiedCount} null categoryId docs.`);

    console.log("\n=== 2. FAST NORMALIZING OPTIONS_LIST ===");
    // Only find docs where the first element is an object
    const objectDocs = await qCol.find({ "options_list.0": { $type: "object" } }).toArray();
    console.log(`Found ${objectDocs.length} docs with object-based options_list.`);

    if (objectDocs.length > 0) {
      const ops = objectDocs.map(doc => {
        const normalized = (doc.options_list || []).map(opt => {
          if (typeof opt === 'object' && opt !== null) {
            return opt.text || opt.text_hi || opt.text_en || String(opt);
          }
          return String(opt || '');
        });
        return {
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { options_list: normalized } }
          }
        };
      });

      // Execute in batches of 500
      for (let i = 0; i < ops.length; i += 500) {
        const batch = ops.slice(i, i + 500);
        await qCol.bulkWrite(batch);
        console.log(`Wrote batch ${i} to ${i + batch.length}`);
      }
    }

    console.log("\n=== 3. RE-LINKING UNLINKED CATEGORY QUESTIONS ===");
    const allCats = await catCol.find({}).toArray();
    const catMap = new Map();
    for (const c of allCats) {
      catMap.set(c._id.toString(), c);
      if (c.slug) catMap.set(c.slug, c);
    }

    const distinctCatIds = await qCol.distinct("categoryId");
    let relinked = 0;

    for (const cid of distinctCatIds) {
      if (!cid) continue;
      const cidStr = cid.toString();
      if (!catMap.has(cidStr)) {
        const sample = await qCol.findOne({ categoryId: cid });
        if (!sample) continue;

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
        if (!targetCat) targetCat = generalCat;

        const res = await qCol.updateMany(
          { categoryId: cid },
          { $set: { categoryId: targetCat._id } }
        );
        console.log(`Relinked ${res.modifiedCount} questions from ${cidStr} -> '${targetCat.topic}'`);
        relinked += res.modifiedCount;
      }
    }
    console.log(`Total relinked: ${relinked}`);

    console.log("\n=== 4. AGGREGATING REAL QUESTION COUNTS TO CATEGORIES ===");
    const counts = await qCol.aggregate([
      { $group: { _id: "$categoryId", count: { $sum: 1 } } }
    ]).toArray();

    const countMap = new Map();
    for (const c of counts) {
      if (c._id) countMap.set(c._id.toString(), c.count);
    }

    const catOps = allCats.map(cat => {
      const direct = countMap.get(cat._id.toString()) || 0;
      return {
        updateOne: {
          filter: { _id: cat._id },
          update: {
            $set: {
              questionCount: direct,
              totalQuestions: direct,
              status: direct > 0 ? "live" : (cat.status || "coming_soon")
            }
          }
        }
      };
    });

    for (let i = 0; i < catOps.length; i += 500) {
      const batch = catOps.slice(i, i + 500);
      await catCol.bulkWrite(batch);
    }
    console.log("Successfully updated question counts across all categories!");

    // Final total questions check
    const totalQInDB = await qCol.countDocuments();
    const linkedQInDB = await qCol.countDocuments({ categoryId: { $in: allCats.map(c => c._id) } });
    console.log(`\nDONE! Total questions in DB: ${totalQInDB} | Linked to valid categories: ${linkedQInDB}`);

  } finally {
    await client.close();
  }
}

run().catch(console.error);
