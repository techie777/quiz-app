import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get("count")) || 10;
    const categoriesParam = searchParams.get("categories") || "";

    const categoryIds = categoriesParam
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    let questions = [];

    // If preferred categories were provided, try to fetch questions from them first
    if (categoryIds.length > 0) {
      try {
        questions = await prisma.question.findMany({
          where: {
            OR: [
              { categoryId: { in: categoryIds } },
              { category: { slug: { in: categoryIds }, hidden: false } },
            ],
          },
          take: count * 3,
        });
      } catch (e) {
        console.warn("Preferred categories query error:", e);
      }
    }

    // If not enough questions from preferred categories, fetch from any visible categories
    if (questions.length < count) {
      try {
        const moreQuestions = await prisma.question.findMany({
          where: {
            category: {
              hidden: false,
            },
          },
          take: count * 4,
        });

        const seenIds = new Set(questions.map((q) => q.id));
        for (const q of moreQuestions) {
          if (!seenIds.has(q.id)) {
            questions.push(q);
            seenIds.add(q.id);
          }
        }
      } catch (e) {
        console.warn("General questions query error:", e);
      }
    }

    // Fallback if DB is empty or questions not found
    if (questions.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No questions available",
      }, { status: 404 });
    }

    // Shuffle and pick exact count
    const shuffled = questions.sort(() => 0.5 - Math.random()).slice(0, count);

    const formatted = shuffled.map((q) => ({
      ...q,
      options: safeJsonParse(q.options),
      optionsHi: safeJsonParse(q.optionsHi) || [],
    }));

    return NextResponse.json({
      success: true,
      questions: formatted,
      count: formatted.length,
    });
  } catch (error) {
    console.error("Quick play error:", error);
    return NextResponse.json({ error: "Failed to generate quick quiz" }, { status: 500 });
  }
}
