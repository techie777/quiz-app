// src/app/api/admin/gk/topics/route.js
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

    const topicsCol = db.collection("gk_topics");
    const topics = await topicsCol.find({ category }).sort({ order: 1 }).toArray();

    // Aggregate question counts per topic and difficulty
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

    const countsAgg = await questionCol
      .aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: { topicId: "$topicId", difficulty: { $toLower: "$difficulty" } },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const topicStatsMap = new Map();
    countsAgg.forEach((item) => {
      const topicId = item._id?.topicId;
      if (!topicId) return;
      if (!topicStatsMap.has(topicId)) {
        topicStatsMap.set(topicId, { easy: 0, medium: 0, hard: 0, expert: 0, total: 0 });
      }
      const stats = topicStatsMap.get(topicId);
      const diff = item._id.difficulty;
      if (stats[diff] !== undefined) {
        stats[diff] += item.count;
      }
      stats.total += item.count;
    });

    // Count sets per topic
    const setsCol = db.collection("gk_sets");
    const setCountsAgg = await setsCol
      .aggregate([
        { $match: { category, language, scope: "topic" } },
        { $group: { _id: "$topicId", count: { $sum: 1 } } },
      ])
      .toArray();

    const setCountsMap = new Map();
    setCountsAgg.forEach((s) => {
      if (s._id) setCountsMap.set(String(s._id), s.count);
    });

    const enrichedTopics = topics.map((t) => {
      const stats = topicStatsMap.get(t.id) || { easy: 0, medium: 0, hard: 0, expert: 0, total: 0 };
      const setsCount = setCountsMap.get(t.id) || 0;
      return {
        ...t,
        stats,
        setsCount,
        questionCount: stats.total,
      };
    });

    return NextResponse.json({ topics: enrichedTopics });
  } catch (err) {
    console.error("GK Topics GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  await ensureGkDbInitialized();
  const db = await getDb();
  const topicsCol = db.collection("gk_topics");

  try {
    const body = await req.json();
    const { action } = body;

    // ── REORDER TOPICS ──
    if (action === "reorder") {
      const { items } = body; // Array of { id, order }
      if (!Array.isArray(items)) {
        return NextResponse.json({ error: "Invalid items array" }, { status: 400 });
      }

      for (const item of items) {
        if (item.id && typeof item.order === "number") {
          await topicsCol.updateOne({ id: item.id }, { $set: { order: item.order, updatedAt: new Date() } });
        }
      }
      return NextResponse.json({ success: true, message: "Order updated successfully" });
    }

    // ── PIN SELECTED TOPICS TO HOME (Phase 5B.4) ──
    if (action === "pin_home") {
      const { topicIds, showOnHome = true } = body;
      if (!Array.isArray(topicIds)) {
        return NextResponse.json({ error: "Invalid topicIds" }, { status: 400 });
      }

      await topicsCol.updateMany(
        { id: { $in: topicIds } },
        { $set: { showOnHome: Boolean(showOnHome), updatedAt: new Date() } }
      );
      return NextResponse.json({ success: true, message: "Updated home pin status" });
    }

    // ── UPDATE SINGLE TOPIC ──
    if (action === "update") {
      const { id, updates } = body;
      if (!id || !updates) {
        return NextResponse.json({ error: "Missing id or updates" }, { status: 400 });
      }

      const allowedFields = [
        "name",
        "nameHi",
        "icon",
        "tint",
        "order",
        "weight",
        "active",
        "showOnHome",
        "homeOrder",
      ];
      const sanitized = {};
      allowedFields.forEach((f) => {
        if (updates[f] !== undefined) sanitized[f] = updates[f];
      });
      sanitized.updatedAt = new Date();

      await topicsCol.updateOne({ id }, { $set: sanitized });
      return NextResponse.json({ success: true, message: "Topic updated" });
    }

    // ── BULK ADD / CSV IMPORT TOPICS ──
    if (action === "bulk_add" || action === "csv_import") {
      const { topics: newTopics, category = GK_CATEGORIES.INDIA } = body;
      if (!Array.isArray(newTopics) || newTopics.length === 0) {
        return NextResponse.json({ error: "No topics provided" }, { status: 400 });
      }

      const highestOrder = await topicsCol
        .find({ category })
        .sort({ order: -1 })
        .limit(1)
        .toArray();
      let nextOrder = highestOrder.length > 0 ? (highestOrder[0].order || 0) + 1 : 1;

      let addedCount = 0;
      for (const t of newTopics) {
        const name = typeof t === "string" ? t.trim() : (t.name || "").trim();
        if (!name) continue;

        const nameHi = typeof t === "object" && t.nameHi ? t.nameHi.trim() : name;
        const icon = typeof t === "object" && t.icon ? t.icon : "📚";
        const tint = typeof t === "object" && t.tint ? t.tint : "#F8FAFC";
        const weight = typeof t === "object" && t.weight !== undefined ? Number(t.weight) : 1;

        const slug = name
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .slice(0, 50);

        const doc = {
          id: `topic_${slug}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
          category,
          name,
          nameHi,
          icon,
          tint,
          order: nextOrder++,
          weight: Math.max(1, weight),
          active: true,
          showOnHome: false,
          homeOrder: 99,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await topicsCol.insertOne(doc);
        addedCount++;
      }

      return NextResponse.json({ success: true, addedCount });
    }

    // ── DELETE TOPIC ──
    if (action === "delete") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "Missing topic id" }, { status: 400 });

      await topicsCol.deleteOne({ id });
      return NextResponse.json({ success: true, message: "Topic deleted" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("GK Topics POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
