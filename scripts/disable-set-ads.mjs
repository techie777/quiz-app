import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.local" });

const uri = process.env.DATABASE_URL;
if (!uri) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  await db.collection("app_settings").updateOne(
    { key: "monetization_config" },
    {
      $set: {
        key: "monetization_config",
        value: {
          adsEnabled: false,
          quizSetsAdsEnabled: false,
          proFeaturesEnabled: true,
          start: false,
          mid: false,
          result: false,
          review: false,
          share: false,
          midQuizMinQuestions: 10,
          maxAdMomentsPerSet: 5,
          gateChallengeInvite: false,
          freeSetsPerWindow: 9999,
        },
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  await db.collection("access_settings").updateOne(
    { key: "default" },
    {
      $set: {
        freeSetsPerWindow: 9999,
        quizSetsAdsEnabled: false,
        adsEnabled: false,
        proFeaturesEnabled: true,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  console.log("✅ Successfully disabled ads on quiz sets and updated settings in DB.");
  await client.close();
}

run().catch(console.error);
