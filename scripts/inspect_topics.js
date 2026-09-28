const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://admin:admin@cluster0.oz8064k.mongodb.net/quizweb?retryWrites=true&w=majority&appName=Cluster0&readPreference=primary";

async function inspect() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('quizweb');
    const topics = await db.collection('TaxonomyTopic').find({ questionCount: { $gte: 15 } }).limit(5).toArray();
    console.log("Topics with >= 15 questions:", JSON.stringify(topics, null, 2));

    // Also check exams and states present in questions
    const exams = await db.collection('Question').distinct('exam', { exam: { $ne: null, $ne: "" } });
    console.log("Unique exams in Question bank:", exams);

    const states = await db.collection('Question').distinct('state', { state: { $ne: null, $ne: "" } });
    console.log("Unique states in Question bank:", states);

    const totalSets = await db.collection('QuizSet').countDocuments();
    console.log("Total sets in QuizSet:", totalSets);

    const setsPerTopic = await db.collection('QuizSet').aggregate([
      { $match: { topicId: { $ne: null } } },
      { $group: { _id: "$topicId", count: { $sum: 1 } } },
      { $limit: 5 }
    ]).toArray();
    console.log("Sample setsPerTopic:", setsPerTopic);
  } finally {
    await client.close();
  }
}

inspect();
