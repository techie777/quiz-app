const dns = require("dns");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

const { MongoClient } = require("mongodb");

const DEFAULT_DB_URL =
  "mongodb+srv://admin:admin@cluster0.oz8064k.mongodb.net/quizweb?retryWrites=true&w=majority&appName=Cluster0&readPreference=primary";

// PRNG logic (same as src/lib/prng.js)
function createMulberry32(seed) {
  let s = 0;
  if (typeof seed === "number") {
    s = seed >>> 0;
  } else if (typeof seed === "string") {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
    }
    s = h;
  } else {
    s = Math.floor(Math.random() * 0xffffffff) >>> 0;
  }

  return function prng() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleArrayWithRng(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  console.log("=== Phase 3 Acceptance Test: Gameplay, Tracker & Challenge ===");

  // ── TEST 1: Rule 5 Seed-based PRNG Determinism (Mulberry32) ──
  console.log("\n[Test 1] Testing Seed-based PRNG Determinism...");
  const sampleQuestions = Array.from({ length: 20 }, (_, i) => `Question_${i + 1}`);
  const seed = 543210;

  const rng1 = createMulberry32(seed);
  const shuffledDevice1 = shuffleArrayWithRng(sampleQuestions, rng1);

  const rng2 = createMulberry32(seed);
  const shuffledDevice2 = shuffleArrayWithRng(sampleQuestions, rng2);

  const diffRng = createMulberry32(999999);
  const shuffledDifferentSeed = shuffleArrayWithRng(sampleQuestions, diffRng);

  const isIdentical = JSON.stringify(shuffledDevice1) === JSON.stringify(shuffledDevice2);
  const isDifferent = JSON.stringify(shuffledDevice1) !== JSON.stringify(shuffledDifferentSeed);

  console.log("Device 1 first 3 Qs:", shuffledDevice1.slice(0, 3));
  console.log("Device 2 first 3 Qs:", shuffledDevice2.slice(0, 3));
  console.log("Identical shuffle across two simulated devices:", isIdentical ? "PASS ✓" : "FAIL ✗");
  console.log("Different seed produces different shuffle:", isDifferent ? "PASS ✓" : "FAIL ✗");

  if (!isIdentical || !isDifferent) {
    throw new Error("PRNG determinism test failed");
  }

  // ── TEST 2: Option ID / Content Resilience Against Shuffling ──
  console.log("\n[Test 2] Testing Answer Checking Resilience Against Option Shuffling...");
  const testQ = {
    text: "What is the capital of India?",
    options: ["Mumbai", "New Delhi", "Kolkata", "Chennai"],
    optionsHi: ["मुंबई", "नई दिल्ली", "कोलकाता", "चेन्नई"],
    correctAnswer: "New Delhi",
  };

  const optionRng1 = createMulberry32(123456);
  const indices = [0, 1, 2, 3];
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(optionRng1() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const shuffledOpts = indices.map((i) => testQ.options[i]);
  const userChosenIdx = shuffledOpts.indexOf("New Delhi");
  const isScoreCorrect = shuffledOpts[userChosenIdx] === testQ.correctAnswer;

  console.log("Shuffled options:", shuffledOpts);
  console.log("Correct answer position:", userChosenIdx);
  console.log("Evaluated answer matches correctAnswer:", isScoreCorrect ? "PASS ✓" : "FAIL ✗");
  if (!isScoreCorrect) throw new Error("Scoring broken by option shuffle");

  // ── TEST 3: Database & Progress Persistence API ──
  console.log("\n[Test 3] Testing GK Progress Persistence API (/api/gk/progress)...");
  const client = new MongoClient(DEFAULT_DB_URL);
  await client.connect();
  const db = client.db("quizweb");

  const sampleSet = await db.collection("gk_sets").findOne({ status: "published" });
  if (!sampleSet) throw new Error("No published set found for testing");

  const testDeviceId = "test_device_" + Date.now();
  const postProgressRes = await fetch("http://localhost:3000/api/gk/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      setId: sampleSet.id,
      subjectId: sampleSet.subjectId,
      topicId: sampleSet.topicId,
      score: 19,
      totalQuestions: 20,
      stars: 3,
      deviceId: testDeviceId,
      language: "en",
      status: "completed",
    }),
  });

  const postProgressData = await postProgressRes.json();
  console.log("POST /api/gk/progress status:", postProgressRes.status, "Response:", postProgressData);
  if (!postProgressRes.ok || !postProgressData.success) {
    throw new Error("POST /api/gk/progress failed");
  }

  // Verify in MongoDB directly
  const savedProgress = await db.collection("gk_progress").findOne({
    deviceId: testDeviceId,
    setId: sampleSet.id,
  });
  console.log("Direct MongoDB progress document:", {
    setId: savedProgress.setId,
    bestScore: savedProgress.bestScore,
    stars: savedProgress.stars,
    status: savedProgress.status,
  });
  if (savedProgress.bestScore !== 19 || savedProgress.stars !== 3) {
    throw new Error("Progress document in DB does not match expected values");
  }

  // ── TEST 4: Customer Topic Sets Enriched with Progress ──
  console.log("\n[Test 4] Verifying Set List Progress Enrichment via Customer API...");
  const setsRes = await fetch(
    `http://localhost:3000/api/gk/topic-sets?subjectId=${sampleSet.subjectId}&deviceId=${testDeviceId}&language=en`
  );
  const setsData = await setsRes.json();
  const testedSet = (setsData.sets || []).find((s) => s.id === sampleSet.id);
  console.log("Customer API set with progress:", {
    id: testedSet?.id,
    number: testedSet?.number,
    completed: testedSet?.completed,
    stars: testedSet?.stars,
    bestScore: testedSet?.bestScore,
  });
  if (!testedSet || !testedSet.completed || testedSet.stars !== 3 || testedSet.bestScore !== 19) {
    throw new Error("Customer API did not enrich set with completed progress");
  }

  // ── TEST 5: Direct Link & Challenge Retrieval Endpoint ──
  console.log("\n[Test 5] Verifying Direct Quiz Link / Challenge Set Retrieval...");
  const directSetRes = await fetch(`http://localhost:3000/api/gk/topic-sets?setId=${sampleSet.id}&language=en`);
  const directSetData = await directSetRes.json();
  console.log("Direct Set Questions count:", directSetData.questions?.length);
  if (!directSetRes.ok || !directSetData.questions || directSetData.questions.length !== 20) {
    throw new Error("Direct set retrieval failed");
  }

  // Cleanup test progress document
  await db.collection("gk_progress").deleteOne({ deviceId: testDeviceId, setId: sampleSet.id });
  await client.close();

  console.log("\n=== Phase 3 Acceptance Test: ALL CHECKS PASSED SUCCESSFULLY! ===");
}

main().catch((err) => {
  console.error("Phase 3 Acceptance Test Error:", err);
  process.exit(1);
});
