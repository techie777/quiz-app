// src/app/api/gk/home/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongoDb";
import { GK_CATEGORIES } from "@/lib/gkData";
import { ensureGkDbInitialized } from "@/lib/gkDbInit";

export const dynamic = "force-dynamic";

export async function GET(req) {
  await ensureGkDbInitialized();
  const db = await getDb();

  try {
    const { searchParams } = new URL(req.url);
    const language = searchParams.get("language") || "en";

    const topicsCol = db.collection("gk_topics");
    const setsCol = db.collection("gk_sets");
    const questionCol = db.collection("Question");

    // Published sets counts per topic
    const topicSetsAgg = await setsCol
      .aggregate([
        { $match: { scope: "topic", status: "published" } },
        { $group: { _id: "$topicId", count: { $sum: 1 } } },
      ])
      .toArray();

    const topicSetCounts = new Map();
    topicSetsAgg.forEach((s) => {
      if (s._id) topicSetCounts.set(String(s._id), s.count);
    });

    // Published questions counts per topic
    const topicQAgg = await questionCol
      .aggregate([
        { $match: { masterCategory: "GK", status: "published" } },
        { $group: { _id: "$topicId", count: { $sum: 1 } } },
      ])
      .toArray();

    const topicQCounts = new Map();
    topicQAgg.forEach((q) => {
      if (q._id) topicQCounts.set(String(q._id), q.count);
    });

    // Active topics
    const allTopics = await topicsCol.find({ active: true }).sort({ homeOrder: 1, order: 1 }).toArray();

    // Total counts for India GK and World GK
    let indiaQCount = 0;
    let worldQCount = 0;
    let indiaSetsCount = 0;
    let worldSetsCount = 0;

    const formattedTopics = allTopics.map((t) => {
      const setsCount = topicSetCounts.get(t.id) || 0;
      const questionCount = topicQCounts.get(t.id) || setsCount * 20;

      if (t.category === GK_CATEGORIES.INDIA) {
        indiaQCount += questionCount;
        indiaSetsCount += setsCount;
      } else {
        worldQCount += questionCount;
        worldSetsCount += setsCount;
      }

      return {
        id: t.id,
        category: t.category,
        categorySlug: t.category === GK_CATEGORIES.INDIA ? "india" : "world",
        name: t.name,
        nameHi: t.nameHi || t.name,
        icon: t.icon || "📚",
        tint: t.tint || "#F8FAFC",
        showOnHome: Boolean(t.showOnHome),
        homeOrder: t.homeOrder || 99,
        setsCount,
        questionCount,
        isGkTopic: true,
      };
    });

    // Pinned topics for home: showOnHome == true and has questions (max 6)
    const pinnedTopics = formattedTopics
      .filter((t) => t.showOnHome && t.questionCount > 0)
      .slice(0, 6);

    return NextResponse.json({
      parentTiles: [
        {
          id: "gk-parent-india",
          isGkParent: true,
          category: GK_CATEGORIES.INDIA,
          categorySlug: "india",
          topic: "India GK",
          topicHi: "भारत सामान्य ज्ञान",
          emoji: "🏛️",
          questionCount: indiaQCount,
          setsCount: indiaSetsCount,
          badge: "GK",
        },
        {
          id: "gk-parent-world",
          isGkParent: true,
          category: GK_CATEGORIES.WORLD,
          categorySlug: "world",
          topic: "World GK",
          topicHi: "विश्व सामान्य ज्ञान",
          emoji: "🌍",
          questionCount: worldQCount,
          setsCount: worldSetsCount,
          badge: "GK",
        },
      ],
      pinnedTopics,
      allTopics: formattedTopics,
    });
  } catch (err) {
    console.error("GK Home API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
