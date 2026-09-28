const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://admin:admin@cluster0.oz8064k.mongodb.net/quizweb?retryWrites=true&w=majority&appName=Cluster0&readPreference=primary";

async function test() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB successfully via Google DNS!");
    const db = client.db("quizweb");
    const count = await db.collection("Question").countDocuments();
    console.log("Question documents count in MongoDB:", count);
  } catch (err) {
    console.error("MongoDB connection error:", err);
  } finally {
    await client.close();
  }
}

test();
