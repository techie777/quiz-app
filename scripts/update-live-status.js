const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

const url = process.env.DATABASE_URL;

// Known Live Main Categories in QuizWeb (from DB questions + Current Affairs)
const LIVE_SLUGS = [
  "india-gk",
  "world-gk",
  "general-knowledge",
  "current-affairs",
  "indian-cities",
  "indian-states-uts",
  "religion-spirituality",
  "entertainment",
  "sports",
  "science",
  "technology",
  "history",
  "business-economy",
  "politics-government",
  "famous-people",
  "brands-companies",
  "lifestyle-everyday-knowledge"
];

// Topic count defaults matching Redesigned Home & content sets
const TOPIC_COUNTS = {
  "india-gk": 100,
  "general-knowledge": 40,
  "world-gk": 25,
  "current-affairs": 30,
  "indian-cities": 10,
  "indian-states-uts": 75,
  "religion-spirituality": 40,
  "entertainment": 20,
  "sports": 20,
  "science": 30,
  "technology": 25,
  "history": 30,
  "business-economy": 20,
  "politics-government": 20,
  "famous-people": 20,
  "brands-companies": 15,
  "lifestyle-everyday-knowledge": 15,
};

async function main() {
  const client = new MongoClient(url);
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    const db = client.db();
    const categoriesCol = db.collection("Category");

    // 1. Ensure current-affairs is live
    await categoriesCol.updateOne(
      { slug: "current-affairs" },
      { $set: { status: "live", group: "core" } }
    );
    console.log("Updated current-affairs to status: live");

    // 2. Ensure all live slugs have status: live
    for (const slug of LIVE_SLUGS) {
      await categoriesCol.updateOne(
        { slug },
        { $set: { status: "live" } }
      );
    }
    console.log(`Updated ${LIVE_SLUGS.length} categories to status: live`);

    // 3. Verify
    const liveCats = await categoriesCol.find({ slug: { $in: LIVE_SLUGS } }, { projection: { slug: 1, status: 1, group: 1 } }).toArray();
    console.log("Verified Live categories:", liveCats.map(c => `${c.slug}: ${c.status}`));
  } finally {
    await client.close();
  }
}

main().catch(console.error);
