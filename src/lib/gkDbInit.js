// src/lib/gkDbInit.js
import { getDb } from "./mongoDb.js";
import { GK_CATEGORIES, DEFAULT_GK_RULES, INITIAL_GK_TOPICS } from "./gkData.js";

let initPromise = null;

export async function ensureGkDbInitialized() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const db = await getDb();

      // 1. Create indexes on Question collection for GK queries & hash duplicate checking
      try {
        await db.collection("Question").createIndex(
          { subjectId: 1, language: 1, status: 1 },
          { background: true }
        );
        await db.collection("Question").createIndex(
          { importBatchId: 1 },
          { background: true, sparse: true }
        );
      } catch (idxErr) {
        console.warn("Question index creation non-fatal error:", idxErr.message);
      }

      // 2. Collections: gk_topics, gk_subjects, gk_sets, gk_rules, gk_progress, gk_remainders, import_batches
      const topicsCol = db.collection("gk_topics");
      const subjectsCol = db.collection("gk_subjects");
      const setsCol = db.collection("gk_sets");
      const rulesCol = db.collection("gk_rules");
      const progressCol = db.collection("gk_progress");
      const remaindersCol = db.collection("gk_remainders");
      const batchesCol = db.collection("import_batches");

      try {
        await topicsCol.createIndex({ category: 1, order: 1 });
        await topicsCol.createIndex({ id: 1 }, { unique: true });
        await subjectsCol.createIndex({ topicId: 1, order: 1 });
        await subjectsCol.createIndex({ id: 1 }, { unique: true });
        await subjectsCol.createIndex({ slug: 1 });
        await setsCol.createIndex({ subjectId: 1, language: 1, number: 1 });
        await setsCol.createIndex({ category: 1, language: 1, scope: 1, number: 1 });
        await setsCol.createIndex({ topicId: 1 });
        await setsCol.createIndex({ id: 1 }, { unique: true });
        await rulesCol.createIndex({ category: 1, language: 1 }, { unique: true });
        await progressCol.createIndex({ userId: 1, setId: 1 });
        await progressCol.createIndex({ deviceId: 1, setId: 1 });
        await remaindersCol.createIndex({ subjectId: 1, language: 1 }, { unique: true });
        await batchesCol.createIndex({ id: 1 }, { unique: true });
        await batchesCol.createIndex({ createdAt: -1 });
      } catch (e) {
        // Indexes might already exist
      }

      // 3. Seed default rules if not present
      const categories = [GK_CATEGORIES.INDIA, GK_CATEGORIES.WORLD];
      const languages = ["en", "hi"];

      for (const category of categories) {
        for (const language of languages) {
          const existingRule = await rulesCol.findOne({ category, language });
          if (!existingRule) {
            await rulesCol.insertOne({
              category,
              language,
              ...DEFAULT_GK_RULES,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }
      }

      // 4. Seed initial topics if none exist in gk_topics
      const topicCount = await topicsCol.countDocuments();
      if (topicCount === 0) {
        await topicsCol.insertMany(
          INITIAL_GK_TOPICS.map((t) => ({
            ...t,
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        );
      }

      return { success: true };
    } catch (err) {
      console.error("ensureGkDbInitialized error:", err);
      return { success: false, error: err.message };
    }
  })();

  return initPromise;
}
