import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongoDb";
import { HOT_QUIZZES_SEED, FORMAT_CONFIG } from "@/lib/hotQuizzesData";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "all";
    const sort = searchParams.get("sort") || "popular"; // "popular" | "new" | "alpha"
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    const db = await getDb();
    let query = {};
    if (format !== "all") {
      query.format = format;
    }

    let items = await db.collection("quiz_sets").find(query).toArray();
    if (!items || items.length === 0) {
      items = [...HOT_QUIZZES_SEED];
      if (format !== "all") {
        items = items.filter((q) => q.format === format);
      }
    }

    // Filter by search
    if (search) {
      items = items.filter(
        (q) =>
          (q.title && q.title.toLowerCase().includes(search)) ||
          (q.titleHi && q.titleHi.includes(search)) ||
          (q.description && q.description.toLowerCase().includes(search))
      );
    }

    // Sort
    if (sort === "popular") {
      items.sort((a, b) => (b.plays || 0) - (a.plays || 0));
    } else if (sort === "new") {
      items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sort === "alpha") {
      items.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    return NextResponse.json({
      success: true,
      quizzes: items,
      total: items.length,
      formats: Object.keys(FORMAT_CONFIG),
    });
  } catch (err) {
    console.error("GET /api/quizzes/fun error:", err);
    return NextResponse.json({
      success: true,
      quizzes: HOT_QUIZZES_SEED,
      total: HOT_QUIZZES_SEED.length,
    });
  }
}
