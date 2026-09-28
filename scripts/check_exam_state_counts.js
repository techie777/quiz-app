const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://admin:admin@cluster0.oz8064k.mongodb.net/quizweb?retryWrites=true&w=majority&appName=Cluster0&readPreference=primary";

async function check() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('quizweb');
    
    const examCounts = await db.collection('Question').aggregate([
      { $match: { exam: { $ne: null, $ne: "" }, status: "published" } },
      { $group: { _id: "$exam", count: { $sum: 1 } } }
    ]).toArray();
    console.log("Exam counts:", examCounts);

    const stateCounts = await db.collection('Question').aggregate([
      { $match: { state: { $ne: null, $ne: "" }, status: "published" } },
      { $group: { _id: "$state", count: { $sum: 1 } } }
    ]).toArray();
    console.log("State counts:", stateCounts);
  } finally {
    await client.close();
  }
}

check();
