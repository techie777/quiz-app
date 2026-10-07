// src/app/api/public-stats/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongoDb";
import { MAIN_CATEGORIES } from "@/lib/mainCategoriesConfig";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();

    // 1. Total real questions from Question collection (matches Admin Dashboard total questions)
    const totalQuestions = await db.collection("Question").countDocuments({
      $or: [
        { status: { $ne: "hidden" } },
        { status: { $exists: false } },
      ],
    });

    // 2. Total active main categories (matches Admin Dashboard main categories)
    const dbMainCatsCount = await db.collection("Category").countDocuments({
      $or: [
        { parentId: null },
        { parentId: { $exists: false } },
        { parentId: "" },
      ],
    }).catch(() => 44);
    const totalCategories = dbMainCatsCount || MAIN_CATEGORIES.length || 44;

    // 3. Total topics count across canonical taxonomy
    let totalTopics = 0;
    MAIN_CATEGORIES.forEach((c) => {
      (c.subcategories || []).forEach((sub) => {
        totalTopics += (sub.topics || []).length || 1;
      });
    });

    // 4. Total playable sets in database
    const [quizSetsCount, gkSetsCount] = await Promise.all([
      db.collection("QuizSet").countDocuments().catch(() => 0),
      db.collection("gk_sets").countDocuments().catch(() => 0),
    ]);
    const totalSets = quizSetsCount + gkSetsCount;

    return NextResponse.json({
      success: true,
      totalQuestions,
      totalCategories,
      totalTopics,
      totalSets,
    });
  } catch (err) {
    console.error("Public stats API error:", err);
    return NextResponse.json({
      success: false,
      totalQuestions: 0,
      totalCategories: MAIN_CATEGORIES.length,
      totalTopics: 100,
      totalSets: 0,
    });
  }
}
