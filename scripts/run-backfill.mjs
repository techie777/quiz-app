import dns from "dns";
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

import { MongoClient } from "mongodb";
import { ensureGkIndexes } from "../src/lib/gkDbInit.js";
import { backfillExistingQuestions } from "../src/lib/hierarchyService.js";
import { getRealCounts } from "../src/lib/counts.js";

const DEFAULT_DB_URL =
  "mongodb+srv://admin:admin@cluster0.oz8064k.mongodb.net/quizweb?retryWrites=true&w=majority&appName=Cluster0&readPreference=primary";

async function main() {
  console.log("Connecting to MongoDB...");
  const client = new MongoClient(DEFAULT_DB_URL);
  await client.connect();
  const db = client.db("quizweb");
  console.log("Connected successfully!");

  console.log("Ensuring GK indexes and collections...");
  await ensureGkIndexes(db);
  console.log("Indexes verified.");

  console.log("Starting backfill for existing questions...");
  const backfillResult = await backfillExistingQuestions(db);
  console.log("Backfill result:", backfillResult);

  console.log("Fetching real counts across the platform...");
  const counts = await getRealCounts(db);
  console.log("Real platform counts:", counts);

  await client.close();
  console.log("Done!");
}

main().catch((err) => {
  console.error("Backfill script error:", err);
  process.exit(1);
});
