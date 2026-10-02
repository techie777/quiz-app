const dns = require("dns");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

const { MongoClient } = require("mongodb");

const DEFAULT_DB_URL =
  "mongodb+srv://admin:admin@cluster0.oz8064k.mongodb.net/quizweb?retryWrites=true&w=majority&appName=Cluster0&readPreference=primary";

function slugify(text) {
  if (!text) return "";
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

async function ensureIndexes(db) {
  await db.collection("gk_subjects").createIndex({ id: 1 }, { unique: true });
  await db.collection("gk_subjects").createIndex({ topicId: 1, status: 1 });
  await db.collection("gk_subjects").createIndex({ slug: 1 });
  await db.collection("gk_sets").createIndex({ subjectId: 1, language: 1, number: 1 });
  await db.collection("gk_sets").createIndex({ id: 1 }, { unique: true });
  await db.collection("gk_remainders").createIndex({ subjectId: 1, language: 1 }, { unique: true });
  await db.collection("import_batches").createIndex({ id: 1 }, { unique: true });
  await db.collection("Question").createIndex({ subjectId: 1, status: 1, language: 1 });
  await db.collection("Question").createIndex({ textHash: 1 }, { sparse: true });
  console.log("Indexes verified.");
}

async function fastBackfill(db) {
  const topicsCol = db.collection("gk_topics");
  const subjectsCol = db.collection("gk_subjects");
  const qCol = db.collection("Question");

  console.log("Loading existing topics and subjects into cache...");
  const existingTopics = await topicsCol.find({}).toArray();
  const existingSubjects = await subjectsCol.find({}).toArray();

  const topicCache = new Map(); // key: lower(topicName) -> topicDoc
  existingTopics.forEach((t) => {
    if (t.name) topicCache.set(t.name.trim().toLowerCase(), t);
    if (t.nameHi) topicCache.set(t.nameHi.trim().toLowerCase(), t);
    if (t.slug) topicCache.set(t.slug.trim().toLowerCase(), t);
  });

  const subjectCache = new Map(); // key: `${topicId}::${lower(subjectName)}` -> subjectDoc
  existingSubjects.forEach((s) => {
    if (s.name) subjectCache.set(`${s.topicId}::${s.name.trim().toLowerCase()}`, s);
    if (s.nameHi) subjectCache.set(`${s.topicId}::${s.nameHi.trim().toLowerCase()}`, s);
  });

  async function getOrCreateTopic(cleanMaster, cleanCategory, cleanTopic) {
    const key = cleanTopic.toLowerCase();
    if (topicCache.has(key)) return topicCache.get(key);

    const topicSlug = slugify(cleanTopic) || `topic-${Date.now().toString(36)}`;
    const topicDoc = {
      id: `topic_${topicSlug}_${Date.now().toString(36)}`,
      slug: topicSlug,
      category: cleanCategory,
      masterCategory: cleanMaster,
      name: cleanTopic,
      nameHi: cleanTopic,
      icon: "📚",
      color: "from-indigo-500 to-purple-600",
      description: `${cleanTopic} questions`,
      descriptionHi: `${cleanTopic} प्रश्न`,
      status: "published",
      weight: 1,
      active: true,
      showOnHome: true,
      homeOrder: 99,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await topicsCol.insertOne(topicDoc);
    topicCache.set(key, topicDoc);
    if (topicDoc.slug) topicCache.set(topicDoc.slug.toLowerCase(), topicDoc);
    return topicDoc;
  }

  async function getOrCreateSubject(topicDoc, cleanMaster, cleanCategory, cleanSubject) {
    const key = `${topicDoc.id}::${cleanSubject.toLowerCase()}`;
    if (subjectCache.has(key)) return subjectCache.get(key);

    const subjectSlug = slugify(cleanSubject) || `subject-${Date.now().toString(36)}`;
    const subjectDoc = {
      id: `subj_${subjectSlug}_${Date.now().toString(36)}`,
      slug: subjectSlug,
      topicId: topicDoc.id,
      topicName: topicDoc.name,
      category: cleanCategory,
      masterCategory: cleanMaster,
      name: cleanSubject,
      nameHi: cleanSubject,
      icon: "📖",
      order: 1,
      status: "published",
      setCount: 0,
      questionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await subjectsCol.insertOne(subjectDoc);
    subjectCache.set(key, subjectDoc);
    return subjectDoc;
  }

  const missingCount = await qCol.countDocuments({
    $or: [{ subjectId: { $exists: false } }, { subjectId: null }],
  });
  console.log(`Questions missing subjectId: ${missingCount}`);

  if (missingCount === 0) {
    console.log("No questions missing subjectId.");
    return;
  }

  const questions = await qCol
    .find({
      $or: [{ subjectId: { $exists: false } }, { subjectId: null }],
    })
    .project({ _id: 1, category: 1, categoryName: 1, topicName: 1, topicId: 1, subTopic: 1, masterCategory: 1 })
    .toArray();

  console.log(`Fetched ${questions.length} questions to backfill. Preparing bulk write...`);

  let bulkOps = [];
  let totalProcessed = 0;

  for (const q of questions) {
    const rawCategory = q.category || q.categoryName || "India GK";
    const rawTopic = q.topicName || q.topicId || "General Knowledge";
    const rawSubject = q.subTopic && String(q.subTopic).trim() ? q.subTopic : rawTopic;

    const topicDoc = await getOrCreateTopic(q.masterCategory || "GK", rawCategory, rawTopic);
    const subjectDoc = await getOrCreateSubject(topicDoc, q.masterCategory || "GK", rawCategory, rawSubject);

    bulkOps.push({
      updateOne: {
        filter: { _id: q._id },
        update: {
          $set: {
            masterCategory: q.masterCategory || "GK",
            category: rawCategory,
            topicId: topicDoc.id,
            topicName: topicDoc.name,
            subjectId: subjectDoc.id,
            subjectName: subjectDoc.name,
            updatedAt: new Date(),
          },
        },
      },
    });

    if (bulkOps.length >= 500) {
      await qCol.bulkWrite(bulkOps, { ordered: false });
      totalProcessed += bulkOps.length;
      console.log(`Updated ${totalProcessed} / ${questions.length} questions...`);
      bulkOps = [];
    }
  }

  if (bulkOps.length > 0) {
    await qCol.bulkWrite(bulkOps, { ordered: false });
    totalProcessed += bulkOps.length;
    console.log(`Updated ${totalProcessed} / ${questions.length} questions.`);
  }
}

async function syncSubjectCounts(db) {
  const subjectsCol = db.collection("gk_subjects");
  const qCol = db.collection("Question");
  const setsCol = db.collection("gk_sets");

  const subjects = await subjectsCol.find({}).toArray();
  console.log(`Syncing counts for ${subjects.length} subjects...`);

  for (const s of subjects) {
    const qCount = await qCol.countDocuments({
      $or: [{ subjectId: s.id }, { topicId: s.topicId }],
      status: { $ne: "hidden" },
    });
    const setCount = await setsCol.countDocuments({
      $or: [{ subjectId: s.id }, { topicId: s.topicId }],
      status: "published",
    });

    await subjectsCol.updateOne(
      { _id: s._id },
      {
        $set: {
          questionCount: qCount,
          setCount: setCount,
          updatedAt: new Date(),
        },
      }
    );
  }
  console.log("Subject counts synchronized.");
}

async function main() {
  console.log("Connecting to MongoDB...");
  const client = new MongoClient(DEFAULT_DB_URL);
  await client.connect();
  const db = client.db("quizweb");
  console.log("Connected to MongoDB!");

  await ensureIndexes(db);
  await fastBackfill(db);
  await syncSubjectCounts(db);

  const totalQuestions = await db.collection("Question").countDocuments();
  const totalSets = await db.collection("gk_sets").countDocuments({ status: "published" });
  const totalTopics = await db.collection("gk_topics").countDocuments();
  const totalSubjects = await db.collection("gk_subjects").countDocuments();

  console.log("=== Database Summary ===");
  console.log(`Total Questions: ${totalQuestions}`);
  console.log(`Total Sets: ${totalSets}`);
  console.log(`Total Topics: ${totalTopics}`);
  console.log(`Total Subjects: ${totalSubjects}`);

  await client.close();
  console.log("Done!");
}

main().catch((err) => {
  console.error("Error during backfill:", err);
  process.exit(1);
});
