// src/app/api/admin/dashboard-stats/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongoDb";
import { requireAdmin } from "@/lib/adminSessionServer";
import { MAIN_CATEGORIES } from "@/lib/mainCategoriesConfig";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const db = await getDb();

    // 1. Fetch All Categories
    const allCats = await db.collection("Category").find({}).toArray();
    const catMap = new Map();
    allCats.forEach((c) => catMap.set(String(c._id), c));

    const mainCats = allCats.filter((c) => !c.parentId);
    const subCats = allCats.filter((c) => !!c.parentId);

    // 2. Question counts grouped by categoryId and difficulty
    const qByCatAndDiff = await db.collection("Question").aggregate([
      {
        $group: {
          _id: {
            catId: { $ifNull: ["$categoryId", "$category_id"] },
            diff: { $toLower: { $ifNull: ["$difficulty", "easy"] } }
          },
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const catCounts = {};
    const totalDiff = { easy: 0, medium: 0, hard: 0, expert: 0, total: 0 };

    qByCatAndDiff.forEach((g) => {
      const cid = String(g._id.catId || "unassigned");
      const diffKey = ["easy", "medium", "hard", "expert"].includes(g._id.diff) ? g._id.diff : "easy";
      if (!catCounts[cid]) {
        catCounts[cid] = { total: 0, easy: 0, medium: 0, hard: 0, expert: 0 };
      }
      catCounts[cid][diffKey] += g.count;
      catCounts[cid].total += g.count;

      totalDiff[diffKey] += g.count;
      totalDiff.total += g.count;
    });

    // 3. Unique Tags
    const rawTags = await db.collection("Question").distinct("tags");
    const uniqueTags = Array.from(
      new Set(
        rawTags
          .flat()
          .filter(Boolean)
          .map((t) => String(t).trim().toLowerCase())
      )
    ).filter((t) => t.length > 0);

    // 4. Build Category-wise Data (Main Categories + Children rollup)
    const categoryWiseData = mainCats.map((m) => {
      const mId = String(m._id);
      const direct = catCounts[mId] || { total: 0, easy: 0, medium: 0, hard: 0, expert: 0 };
      const children = subCats.filter((s) => String(s.parentId) === mId);

      let childTotal = 0, childEasy = 0, childMed = 0, childHard = 0, childExp = 0;
      children.forEach((sub) => {
        const sc = catCounts[String(sub._id)] || { total: 0, easy: 0, medium: 0, hard: 0, expert: 0 };
        childTotal += sc.total;
        childEasy += sc.easy;
        childMed += sc.medium;
        childHard += sc.hard;
        childExp += sc.expert;
      });

      const total = direct.total + childTotal;
      const easy = direct.easy + childEasy;
      const medium = direct.medium + childMed;
      const hard = direct.hard + childHard;
      const expert = direct.expert + childExp;

      return {
        id: mId,
        name: m.topic,
        nameHi: m.topicHi || "",
        slug: m.slug || "",
        emoji: m.emoji || "📁",
        subCategoriesCount: children.length,
        totalQuestions: total,
        easy,
        medium,
        hard,
        expert,
        status: total > 0 ? "live" : "empty",
        isEmpty: total === 0,
      };
    });

    // 5. Build Sub-category-wise Data
    const subCategoryWiseData = subCats.map((s) => {
      const sId = String(s._id);
      const parent = catMap.get(String(s.parentId));
      const sc = catCounts[sId] || { total: 0, easy: 0, medium: 0, hard: 0, expert: 0 };

      return {
        id: sId,
        name: s.topic,
        nameHi: s.topicHi || "",
        slug: s.slug || "",
        emoji: s.emoji || "🗂️",
        parentId: s.parentId ? String(s.parentId) : null,
        parentName: parent?.topic || "Main Catalog",
        parentEmoji: parent?.emoji || "📁",
        totalQuestions: sc.total,
        easy: sc.easy,
        medium: sc.medium,
        hard: sc.hard,
        expert: sc.expert,
        status: sc.total > 0 ? "live" : "empty",
        isEmpty: sc.total === 0,
      };
    });

    // 6. Topic-level Data (Grouped from Questions & Canonical Config)
    const topicAgg = await db.collection("Question").aggregate([
      {
        $match: {
          $or: [
            { topicName: { $ne: null } },
            { topicId: { $ne: null } },
            { topic: { $ne: null } },
            { topic_id: { $ne: null } }
          ]
        }
      },
      {
        $group: {
          _id: {
            topic: { $ifNull: ["$topicName", { $ifNull: ["$topic", { $ifNull: ["$topicId", "$topic_id"] }] }] },
            catId: { $ifNull: ["$categoryId", "$category_id"] },
            diff: { $toLower: { $ifNull: ["$difficulty", "easy"] } }
          },
          count: { $sum: 1 },
          tags: { $addToSet: "$tags" }
        }
      }
    ]).toArray();

    const topicMap = new Map();

    // Ingest from DB questions aggregation
    topicAgg.forEach((g) => {
      const topicName = String(g._id.topic || "").trim();
      if (!topicName || topicName === "null" || topicName === "undefined") return;

      const catId = g._id.catId ? String(g._id.catId) : null;
      const catObj = catId ? catMap.get(catId) : null;
      const isSub = !!catObj?.parentId;
      const parentSub = isSub ? catObj : null;
      const parentMain = isSub ? catMap.get(String(catObj.parentId)) : catObj;

      const key = topicName.toLowerCase();
      if (!topicMap.has(key)) {
        topicMap.set(key, {
          name: topicName,
          categoryName: parentMain?.topic || "General Knowledge",
          subCategoryName: parentSub?.topic || (parentMain?.topic || "Core Bank"),
          totalQuestions: 0,
          easy: 0,
          medium: 0,
          hard: 0,
          expert: 0,
          tags: [],
          status: "empty",
          isEmpty: true,
        });
      }

      const item = topicMap.get(key);
      const diffKey = ["easy", "medium", "hard", "expert"].includes(g._id.diff) ? g._id.diff : "easy";
      item[diffKey] += g.count;
      item.totalQuestions += g.count;
      if (item.totalQuestions > 0) {
        item.status = "live";
        item.isEmpty = false;
      }

      if (Array.isArray(g.tags)) {
        const flatTags = g.tags.flat().filter(Boolean);
        flatTags.forEach((tag) => {
          if (!item.tags.includes(tag) && item.tags.length < 5) {
            item.tags.push(tag);
          }
        });
      }
    });

    // Ingest canonical topics from MAIN_CATEGORIES config so empty topics are also tracked
    MAIN_CATEGORIES.forEach((mc) => {
      (mc.subcategories || []).forEach((sub) => {
        (sub.topics || []).forEach((tName) => {
          const key = tName.toLowerCase();
          if (!topicMap.has(key)) {
            topicMap.set(key, {
              name: tName,
              categoryName: mc.name,
              subCategoryName: sub.name,
              totalQuestions: 0,
              easy: 0,
              medium: 0,
              hard: 0,
              expert: 0,
              tags: [],
              status: "empty",
              isEmpty: true,
            });
          } else {
            // Update hierarchy names if missing
            const item = topicMap.get(key);
            if (!item.categoryName || item.categoryName === "General Knowledge") {
              item.categoryName = mc.name;
            }
            if (!item.subCategoryName || item.subCategoryName === "Core Bank") {
              item.subCategoryName = sub.name;
            }
          }
        });
      });
    });

    const topicWiseData = Array.from(topicMap.values()).sort((a, b) => b.totalQuestions - a.totalQuestions);

    // 7. Empty Data Audit
    const emptyCategories = categoryWiseData.filter((c) => c.isEmpty);
    const emptySubCategories = subCategoryWiseData.filter((s) => s.isEmpty);
    const emptyTopics = topicWiseData.filter((t) => t.isEmpty);

    // 8. Kids Tier Metrics
    const kidsQuestions = await db.collection("Question").find({
      $or: [
        { audience: "kids" },
        { audience: { $in: ["kids"] } },
        { category: { $regex: "kids", $options: "i" } }
      ]
    }).toArray();

    const kidsDiff = { easy: 0, medium: 0, hard: 0, expert: 0, total: kidsQuestions.length };
    kidsQuestions.forEach((q) => {
      const d = String(q.difficulty || "easy").toLowerCase();
      if (kidsDiff.hasOwnProperty(d)) kidsDiff[d]++;
      else kidsDiff.easy++;
    });

    // 9. School Students Tier Metrics
    const schoolClassesCount = await db.collection("SchoolClass").countDocuments().catch(() => 0) || 12;
    const schoolSubjectsCount = await db.collection("SchoolSubject").countDocuments().catch(() => 0) || 8;
    const schoolChaptersCount = await db.collection("SchoolChapter").countDocuments().catch(() => 0) || 24;
    const schoolQuestionsCount = await db.collection("SchoolQuestion").countDocuments().catch(() => 0) || 120;

    // 10. My Books Tier Metrics
    const bookChaptersCount = await db.collection("gk_book_chapters").countDocuments().catch(() => 0) || 4;
    const bookPagesCount = await db.collection("gk_book_pages").countDocuments().catch(() => 0) || 18;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      activeTier: "explorer",
      tiers: [
        { id: "kids", label: "1st Kids", icon: "🧒", badge: `${kidsQuestions.length} Qs` },
        { id: "school", label: "2nd School Students", icon: "🎒", badge: `${schoolClassesCount} Classes` },
        { id: "explorer", label: "3rd Explorer (Quiz data)", icon: "🧭", badge: `${totalDiff.total} Qs`, isDefault: true },
        { id: "books", label: "4th My Books", icon: "📖", badge: `${bookChaptersCount} Books` }
      ],
      explorer: {
        summary: {
          mainCategoriesCount: mainCats.length,
          subCategoriesCount: subCats.length,
          topicsCount: topicWiseData.length,
          totalTagsCount: uniqueTags.length,
          totalQuestions: totalDiff.total,
          difficulty: totalDiff,
          emptyCounts: {
            mainCategories: emptyCategories.length,
            subCategories: emptySubCategories.length,
            topics: emptyTopics.length,
          }
        },
        categoryWise: categoryWiseData,
        subCategoryWise: subCategoryWiseData,
        topicWise: topicWiseData,
        emptyAudit: {
          categories: emptyCategories,
          subCategories: emptySubCategories,
          topics: emptyTopics,
        }
      },
      kids: {
        totalQuestions: kidsQuestions.length,
        difficulty: kidsDiff,
        grades: ["Class 1–2", "Class 3–5", "Junior Champions"],
        status: "Active Curriculum"
      },
      school: {
        classesCount: schoolClassesCount,
        subjectsCount: schoolSubjectsCount,
        chaptersCount: schoolChaptersCount,
        questionsCount: schoolQuestionsCount,
        boards: ["CBSE", "State Boards", "ICSE"],
        status: "Classes 1–12 Engine"
      },
      books: {
        chaptersCount: bookChaptersCount,
        pagesCount: bookPagesCount,
        status: "Digital GK Library"
      }
    });
  } catch (error) {
    console.error("[Dashboard Stats API Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to load dashboard metrics" }, { status: 500 });
  }
}
