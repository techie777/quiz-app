// src/app/api/admin/gk/overview/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongoDb";
import { requireAdmin } from "@/lib/adminSessionServer";
import { GK_CATEGORIES } from "@/lib/gkData";
import { ensureGkDbInitialized } from "@/lib/gkDbInit";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  await ensureGkDbInitialized();
  const db = await getDb();

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || GK_CATEGORIES.INDIA;
    const language = searchParams.get("language") || "en";

    // 1. Total Topics
    const topicsCol = db.collection("gk_topics");
    const topics = await topicsCol.find({ category }).toArray();
    const topicCount = topics.length;

    // 2. Total Published Sets
    const setsCol = db.collection("gk_sets");
    const sets = await setsCol.find({ category, language }).toArray();
    const setCount = sets.length;

    // 3. Questions breakdown by difficulty
    const questionCol = db.collection("Question");
    const matchFilter = {
      $or: [
        { category },
        { masterCategory: "GK", categoryName: category },
      ],
    };
    if (language) {
      matchFilter.language = language;
    }

    const diffCounts = await questionCol
      .aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: { $toLower: "$difficulty" },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const difficultyBreakdown = {
      easy: 0,
      medium: 0,
      hard: 0,
      expert: 0,
      total: 0,
    };

    diffCounts.forEach((d) => {
      const k = String(d._id || "").toLowerCase();
      if (difficultyBreakdown[k] !== undefined) {
        difficultyBreakdown[k] = d.count;
      }
      difficultyBreakdown.total += d.count;
    });

    // 4. Questions assigned to sets
    const assignedQuestionIds = new Set();
    sets.forEach((s) => {
      if (Array.isArray(s.questionIds)) {
        s.questionIds.forEach((id) => assignedQuestionIds.add(String(id)));
      }
    });

    const unassignedCount = Math.max(0, difficultyBreakdown.total - assignedQuestionIds.size);

    // 5. Topic warnings (topics with < 20 questions or heavy imbalance)
    const topicAgg = await questionCol
      .aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: "$topicId",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const topicCountsMap = new Map();
    topicAgg.forEach((t) => {
      if (t._id) topicCountsMap.set(String(t._id), t.count);
    });

    const warnings = [];
    topics.forEach((t) => {
      const qCount = topicCountsMap.get(String(t.id)) || 0;
      if (qCount === 0) {
        warnings.push({
          type: "empty_topic",
          topicId: t.id,
          topicName: t.name,
          message: `Topic '${t.name}' has 0 questions in ${language.toUpperCase()}.`,
        });
      } else if (qCount < 20) {
        warnings.push({
          type: "low_questions",
          topicId: t.id,
          topicName: t.name,
          message: `Topic '${t.name}' has only ${qCount} questions (need at least 20 for a full set).`,
        });
      }
    });

    return NextResponse.json({
      category,
      language,
      totals: {
        topics: topicCount,
        sets: setCount,
        questions: difficultyBreakdown.total,
        unassigned: unassignedCount,
      },
      difficultyBreakdown,
      warnings,
    });
  } catch (err) {
    console.error("GK Overview error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
