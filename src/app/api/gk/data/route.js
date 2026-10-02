// src/app/api/gk/data/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongoDb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { GK_CATEGORIES } from "@/lib/gkData";
import { ensureGkDbInitialized } from "@/lib/gkDbInit";

export const dynamic = "force-dynamic";

export async function GET(req) {
  await ensureGkDbInitialized();
  const db = await getDb();

  try {
    const { searchParams } = new URL(req.url);
    let category = searchParams.get("category") || GK_CATEGORIES.INDIA;
    if (category.toLowerCase() === "india" || category.toLowerCase() === "india-gk") {
      category = GK_CATEGORIES.INDIA;
    } else if (category.toLowerCase() === "world" || category.toLowerCase() === "world-gk") {
      category = GK_CATEGORIES.WORLD;
    }
    const language = searchParams.get("language") || "en";
    const deviceId = req.headers.get("x-device-id") || searchParams.get("deviceId") || "";

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    // 1. Fetch Published Master Sets (Play All)
    const setsCol = db.collection("gk_sets");
    const masterSets = await setsCol
      .find({
        category,
        language,
        scope: "master",
        status: "published",
      })
      .sort({ number: 1 })
      .toArray();

    // 2. Fetch Active Topics in Admin Order
    const topicsCol = db.collection("gk_topics");
    const topics = await topicsCol
      .find({ category, active: true })
      .sort({ order: 1 })
      .toArray();

    // Category matching variants (e.g. "India GK", "India")
    const categoryFilter =
      category === GK_CATEGORIES.WORLD
        ? { $in: [GK_CATEGORIES.WORLD, "World GK", "World", "world-gk", "world"] }
        : { $in: [GK_CATEGORIES.INDIA, "India GK", "India", "india-gk", "india"] };

    // 3. Aggregate question counts and published sets counts per topic
    const topicSetsAgg = await setsCol
      .aggregate([
        { $match: { category: categoryFilter, language, status: "published" } },
        { $group: { _id: "$topicId", count: { $sum: 1 } } },
      ])
      .toArray();

    const topicSetCounts = new Map();
    topicSetsAgg.forEach((s) => {
      if (s._id) topicSetCounts.set(String(s._id), s.count);
    });

    const questionCol = db.collection("Question");
    const topicQAgg = await questionCol
      .aggregate([
        {
          $match: {
            $or: [
              { category: categoryFilter },
              { masterCategory: "GK" },
            ],
            status: { $ne: "hidden" },
          },
        },
        { $group: { _id: "$topicId", count: { $sum: 1 } } },
      ])
      .toArray();

    const topicQCounts = new Map();
    topicQAgg.forEach((q) => {
      if (q._id) topicQCounts.set(String(q._id), q.count);
    });

    // 4. Fetch User GkProgress
    const progressCol = db.collection("gk_progress");
    const userProgressFilter = userId
      ? { $or: [{ userId }, { deviceId: deviceId || "none" }] }
      : { deviceId: deviceId || "none" };

    const userProgressDocs = await progressCol.find(userProgressFilter).toArray();
    const progressMap = new Map();
    userProgressDocs.forEach((p) => {
      progressMap.set(p.setId, p);
    });

    // Determine Master Pointer (next uncompleted set number)
    let masterPointer = 1;
    let completedMasterSets = 0;

    const enrichedMasterSets = masterSets.map((s) => {
      const p = progressMap.get(s.id);
      const isCompleted = p?.completedAt || (p?.bestScore !== undefined && p.bestScore >= 0);
      if (isCompleted) {
        completedMasterSets++;
      }
      return {
        id: s.id,
        number: s.number,
        phase: s.phase,
        mix: s.mix,
        tags: s.tags || [],
        questionCount: (s.questionIds || []).length || 20,
        stars: p?.stars || 0,
        bestScore: p?.bestScore || 0,
        attempts: p?.attempts || 0,
        completed: Boolean(isCompleted),
      };
    });

    // First uncompleted set is the masterPointer
    const nextUnplayed = enrichedMasterSets.find((s) => !s.completed);
    masterPointer = nextUnplayed ? nextUnplayed.number : (enrichedMasterSets.length > 0 ? enrichedMasterSets[enrichedMasterSets.length - 1].number : 1);

    // Enrich topics with progress
    const enrichedTopics = topics.map((t) => {
      const setsCount = topicSetCounts.get(t.id) || 0;
      const questionCount = topicQCounts.get(t.id) || setsCount * 20;

      // Count completed sets for this topic
      let completedSets = 0;
      userProgressDocs.forEach((p) => {
        if (p.topicId === t.id && (p.completedAt || p.bestScore !== undefined)) {
          completedSets++;
        }
      });

      return {
        id: t.id,
        name: t.name,
        nameHi: t.nameHi || t.name,
        icon: t.icon || "📚",
        tint: t.tint || "#F8FAFC",
        order: t.order || 1,
        showOnHome: Boolean(t.showOnHome),
        homeOrder: t.homeOrder || 99,
        setsCount,
        questionCount,
        completedSets,
      };
    });

    // Overall category stats
    const totalPublishedSets = enrichedMasterSets.length + Array.from(topicSetCounts.values()).reduce((a, b) => a + b, 0);
    const totalPublishedQuestions = Array.from(topicQCounts.values()).reduce((a, b) => a + b, 0);

    return NextResponse.json({
      category,
      language,
      masterPointer,
      completedMasterSets,
      totalMasterSets: enrichedMasterSets.length,
      masterSets: enrichedMasterSets,
      topics: enrichedTopics,
      stats: {
        totalSets: totalPublishedSets,
        totalQuestions: totalPublishedQuestions,
      },
    });
  } catch (err) {
    console.error("GK Data API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
