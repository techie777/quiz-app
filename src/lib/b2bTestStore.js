import { getDb } from "./mongoDb";

// In-memory fallback map for immediate resilience and fast lookups
const inMemoryTestStore = new Map();

/**
 * Normalizes test code (e.g. "APX-8492" or "TEST123")
 */
export function normalizeTestCode(code) {
  if (!code || typeof code !== "string") return "";
  return code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

/**
 * Generates a clean, unique 6-character alphanumeric test room code (e.g. "EXAM49", "APX812")
 */
export function generateTestCode(prefix = "TEST") {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${randomPart}`;
}

/**
 * Saves a new B2B test configuration
 */
export async function saveB2bTest(testData) {
  try {
    const testCode = normalizeTestCode(testData.testCode || generateTestCode("EXAM"));
    const record = {
      ...testData,
      testCode,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 1. Save to in-memory store for instant zero-latency socket access
    inMemoryTestStore.set(testCode, record);

    // 2. Persist to MongoDB collection
    try {
      const db = await getDb();
      const col = db.collection("b2b_tests");
      await col.updateOne(
        { testCode },
        { $set: record },
        { upsert: true }
      );
    } catch (dbErr) {
      console.warn("⚠️ [B2BStore] MongoDB persist failed, relying on memory store:", dbErr.message);
    }

    return record;
  } catch (err) {
    console.error("❌ [B2BStore] Failed to save test:", err);
    throw err;
  }
}

/**
 * Retrieves a test configuration by testCode
 */
export async function getB2bTest(rawCode) {
  const testCode = normalizeTestCode(rawCode);
  if (!testCode) return null;

  // Check in-memory first
  if (inMemoryTestStore.has(testCode)) {
    return inMemoryTestStore.get(testCode);
  }

  // Check MongoDB
  try {
    const db = await getDb();
    const col = db.collection("b2b_tests");
    const doc = await col.findOne({ testCode });
    if (doc) {
      inMemoryTestStore.set(testCode, doc);
      return doc;
    }
  } catch (err) {
    console.warn("⚠️ [B2BStore] MongoDB lookup failed:", err.message);
  }

  return null;
}

/**
 * Lists all tests created by an institute
 */
export async function listB2bTests(instituteId = "default") {
  try {
    const db = await getDb();
    const col = db.collection("b2b_tests");
    const cursor = col.find({}).sort({ createdAt: -1 }).limit(50);
    const docs = await cursor.toArray();
    return docs;
  } catch (err) {
    console.warn("⚠️ [B2BStore] MongoDB list failed, returning in-memory:", err.message);
    return Array.from(inMemoryTestStore.values());
  }
}
