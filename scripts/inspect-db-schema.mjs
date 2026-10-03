import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://admin:admin@cluster0.oz8064k.mongodb.net/quizweb?retryWrites=true&w=majority&appName=Cluster0&readPreference=primary";

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('quizweb');

  const q = await db.collection("Question").findOne({});
  console.log("Sample question keys:", Object.keys(q || {}));
  console.log("Sample question details:", {
    _id: q?._id,
    topic: q?.topic,
    subTopic: q?.subTopic,
    tags: q?.tags,
    chapter: q?.chapter,
    subject: q?.subject,
    exam: q?.exam,
    difficulty: q?.difficulty
  });

  const cat = await db.collection("Category").findOne({ slug: "india-gk" });
  console.log("India GK category doc:", {
    _id: cat?._id,
    slug: cat?.slug,
    topic: cat?.topic,
    emoji: cat?.emoji,
    subCategoriesCount: cat?.subCategories?.length
  });

  const setsCount = await db.collection("gk_sets").countDocuments();
  console.log("Total gk_sets count:", setsCount);
  const sampleSet = await db.collection("gk_sets").findOne({});
  console.log("Sample gk_set:", sampleSet ? {
    id: sampleSet.id,
    topicId: sampleSet.topicId,
    subjectId: sampleSet.subjectId,
    tags: sampleSet.tags,
    questionCount: sampleSet.questionIds?.length
  } : null);

  const sampleTagQ = await db.collection("Question").findOne({ tags: { $exists: true, $ne: [] } });
  console.log("Sample question with tags:", sampleTagQ ? {
    topic: sampleTagQ.topic,
    subTopic: sampleTagQ.subTopic,
    tags: sampleTagQ.tags
  } : "No question with non-empty tags");

  // Let's count questions with tags
  const qWithTagsCount = await db.collection("Question").countDocuments({ tags: { $exists: true, $ne: [] } });
  console.log("Questions with tags count:", qWithTagsCount);

  // Let's count questions with subTopic
  const qWithSubTopicCount = await db.collection("Question").countDocuments({ subTopic: { $exists: true, $ne: null, $ne: "" } });
  console.log("Questions with subTopic count:", qWithSubTopicCount);

  await client.close();
}

run().catch(console.error);
