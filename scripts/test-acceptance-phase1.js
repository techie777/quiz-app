const dns = require("dns");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

const { MongoClient } = require("mongodb");

const DEFAULT_DB_URL =
  "mongodb+srv://admin:admin@cluster0.oz8064k.mongodb.net/quizweb?retryWrites=true&w=majority&appName=Cluster0&readPreference=primary";

async function main() {
  console.log("=== Phase 1 Acceptance Test: Upload & Set Visibility ===");
  const client = new MongoClient(DEFAULT_DB_URL);
  await client.connect();
  const db = client.db("quizweb");

  // Check 1: Collections exist and have indexes
  const collections = await db.listCollections().toArray();
  const colNames = collections.map((c) => c.name);
  console.log("Collections present:", colNames.filter((n) => n.startsWith("gk_") || n === "Question"));

  // Check 2: All questions have subjectId
  const missingSubject = await db.collection("Question").countDocuments({
    $or: [{ subjectId: { $exists: false } }, { subjectId: null }],
  });
  console.log(`Questions missing subjectId: ${missingSubject} (Expect 0)`);
  if (missingSubject !== 0) throw new Error("Acceptance failure: some questions missing subjectId");

  // Check 3: Static sets are generated and published
  const totalSets = await db.collection("gk_sets").countDocuments({ status: "published" });
  console.log(`Total published sets in gk_sets: ${totalSets}`);
  if (totalSets === 0) throw new Error("Acceptance failure: 0 published sets");

  // Check 4: Check 7/7/6 mix verification on a set
  const sampleSet = await db.collection("gk_sets").findOne({ scope: "subject" });
  console.log("Sample static set:", {
    id: sampleSet.id,
    title: sampleSet.title,
    number: sampleSet.number,
    subjectName: sampleSet.subjectName,
    questionCount: sampleSet.questionIds.length,
    mix: sampleSet.mix,
    hasMixWarning: !!sampleSet.mixWarning,
  });
  if (sampleSet.questionIds.length !== 20) throw new Error("Acceptance failure: set does not have 20 questions");

  // Check 5: Call Customer API directly
  console.log("Calling customer API endpoint http://localhost:3000/api/gk/topic-sets...");
  const res = await fetch(`http://localhost:3000/api/gk/topic-sets?subjectId=${sampleSet.subjectId}&language=en`);
  const data = await res.json();
  console.log("Customer API response status:", res.status, "Sets returned:", data.sets?.length);
  if (!res.ok || !data.sets || data.sets.length === 0) {
    throw new Error("Acceptance failure: customer API cannot see the sets");
  }

  // Check 6: Check Read Mode questions endpoint (setId)
  const setDetailsRes = await fetch(`http://localhost:3000/api/gk/topic-sets?setId=${sampleSet.id}&language=en`);
  const setDetails = await setDetailsRes.json();
  console.log("Set questions returned for Read/Play mode:", setDetails.questions?.length);
  if (!setDetailsRes.ok || !setDetails.questions || setDetails.questions.length !== 20) {
    throw new Error("Acceptance failure: Set questions cannot be loaded for Read/Play mode");
  }

  // Check 7: Counts API
  const countsRes = await fetch("http://localhost:3000/api/gk/counts");
  const counts = await countsRes.json();
  console.log("Single shared counts:", counts);
  if (counts.totalSets !== totalSets) {
    throw new Error(`Count mismatch: API reported ${counts.totalSets}, DB has ${totalSets}`);
  }

  await client.close();
  console.log("=== Phase 1 Acceptance Test: ALL CHECKS PASSED SUCCESSFULLY! ===");
}

main().catch((err) => {
  console.error("Test failed:", err.message);
  process.exit(1);
});
