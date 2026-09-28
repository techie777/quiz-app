import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongoDb";
import { getTaxonomyCategories } from "@/lib/taxonomy";
import { requireAdmin } from "@/lib/adminSessionServer";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    const db = await getDb();
    const categories = await getTaxonomyCategories({ includeTopics: true });

    // Aggregate counts by category_id and difficulty_level
    const categoryDifficultyAggregation = await db.collection("Question").aggregate([
      {
        $group: {
          _id: {
            categoryId: "$category_id",
            difficulty: "$difficulty_level",
          },
          count: { $sum: 1 },
        },
      },
    ]).toArray();

    // Map counts
    const countMap = {}; // `${catId}:${difficulty}` -> count
    for (const item of categoryDifficultyAggregation) {
      const catId = item._id.categoryId ? item._id.categoryId.toString() : "uncategorized";
      const diff = item._id.difficulty || 1;
      countMap[`${catId}:${diff}`] = item.count;
    }

    const matrix = categories.map((cat) => {
      const catId = cat.id;
      const easy = countMap[`${catId}:1`] || 0;
      const medium = countMap[`${catId}:2`] || 0;
      const hard = countMap[`${catId}:3`] || 0;
      const total = easy + medium + hard;

      return {
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        nameHi: cat.nameHi,
        icon: cat.icon,
        easy,
        medium,
        hard,
        total,
        isUnderTarget: total < 15,
      };
    });

    // Uncategorized check
    const uncategorizedEasy = countMap["uncategorized:1"] || 0;
    const uncategorizedMedium = countMap["uncategorized:2"] || 0;
    const uncategorizedHard = countMap["uncategorized:3"] || 0;
    const uncategorizedTotal = uncategorizedEasy + uncategorizedMedium + uncategorizedHard;

    if (uncategorizedTotal > 0) {
      matrix.push({
        id: "uncategorized",
        slug: "uncategorized",
        name: "Uncategorized",
        nameHi: "अवर्गीकृत",
        icon: "folder",
        easy: uncategorizedEasy,
        medium: uncategorizedMedium,
        hard: uncategorizedHard,
        total: uncategorizedTotal,
        isUnderTarget: false,
      });
    }

    return NextResponse.json({
      success: true,
      matrix,
    });
  } catch (error) {
    console.error("GET /api/admin/questions/bank/coverage-matrix error:", error);
    return NextResponse.json({ error: "Failed to generate coverage matrix" }, { status: 500 });
  }
}
