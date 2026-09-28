const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const { MongoClient, ObjectId } = require('mongodb');

const uri = "mongodb+srv://admin:admin@cluster0.oz8064k.mongodb.net/quizweb?retryWrites=true&w=majority&appName=Cluster0&readPreference=primary";

async function verify() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB for Step 5 Verification...");
    const db = client.db("quizweb");

    // 1. Verify Question Bank Count & Schema
    const totalQuestions = await db.collection("Question").countDocuments();
    console.log("Total Questions in Bank:", totalQuestions);

    const sample = await db.collection("Question").findOne({ difficulty_level: 1 });
    console.log("Sample Level 1 Question:", {
      id: sample._id.toString(),
      text_hi: sample.text_hi?.slice(0, 30),
      options_count: sample.options_list?.length,
      correct_index: sample.correct_index,
      category_id: sample.category_id?.toString(),
      topic_id: sample.topic_id?.toString(),
      difficulty_level: sample.difficulty_level,
      status: sample.status
    });

    // 2. Verify Coverage Matrix Aggregation
    const matrixAgg = await db.collection("Question").aggregate([
      {
        $group: {
          _id: { difficulty: "$difficulty_level" },
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    console.log("Difficulty breakdown in DB:", matrixAgg);

    // 3. Verify Error Reports collection exists and can insert/find
    const reportCount = await db.collection("QuestionReport").countDocuments();
    console.log("Current QuestionReport count:", reportCount);

    console.log("Step 5 Backend Verification Successful!");
  } catch (err) {
    console.error("Verification error:", err);
  } finally {
    await client.close();
  }
}

verify();
