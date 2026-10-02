// src/lib/counts.js
import { getDb } from "./mongoDb";

/**
 * Shared count function across the entire app (Rule 1.6 & A4).
 * Returns real, consistent counts directly from database.
 */
export async function getRealCounts({ category = null, language = null } = {}) {
  const db = await getDb();
  const qCol = db.collection("Question");
  const setsCol = db.collection("gk_sets");
  const topicsCol = db.collection("gk_topics");
  const subjectsCol = db.collection("gk_subjects");

  const qFilter = { status: "published" };
  const sFilter = { status: "published" };

  if (category) {
    qFilter.category = category;
    sFilter.category = category;
  }
  if (language) {
    qFilter.language = language;
    sFilter.language = language;
  }

  const [totalQuestions, totalSets, totalTopics, totalSubjects] = await Promise.all([
    qCol.countDocuments(qFilter),
    setsCol.countDocuments(sFilter),
    topicsCol.countDocuments(category ? { category, active: true } : { active: true }),
    subjectsCol.countDocuments(category ? { category, status: "published" } : { status: "published" }),
  ]);

  return {
    totalQuestions,
    totalSets,
    totalTopics,
    totalSubjects,
    formattedQuestions: totalQuestions.toLocaleString("en-IN"),
    formattedSets: totalSets.toLocaleString("en-IN"),
  };
}
