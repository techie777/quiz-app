import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sectionName = searchParams.get("sectionName");
  const limit = parseInt(searchParams.get("limit") || "20");
  const difficulty = searchParams.get("difficulty") || "all";

  if (!sectionName) {
    return NextResponse.json({ error: "sectionName is required" }, { status: 400 });
  }

  try {
    // 1. Find the section and its subsections
    const section = await prisma.section.findFirst({
      where: { 
        name: sectionName,
        isVisible: true
      },
      include: {
        subSections: {
          where: { isVisible: true }
        }
      }
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // 2. Extract all quiz IDs (Category IDs) from the subsections
    const quizIds = section.subSections.flatMap(ss => ss.quizIds || []);

    if (quizIds.length === 0) {
      return NextResponse.json({ questions: [] });
    }

    // 3. Build the question filter
    const whereClause = {
      categoryId: { in: quizIds }
    };

    if (difficulty !== "all") {
      whereClause.difficulty = difficulty.toLowerCase();
    }

    // 4. Fetch questions
    // Note: Due to Prisma's MongoDB driver limitations for large random sampling,
    // we fetch a larger pool then shuffle in-memory for accuracy and performance.
    const questionPool = await prisma.question.findMany({
      where: whereClause,
      select: {
        id: true,
        text: true,
        options: true,
        correctAnswer: true,
        difficulty: true,
        image: true,
        categoryId: true,
        category: {
          select: {
            topic: true
          }
        }
      },
      take: Math.max(limit * 3, 100) // Get a decent pool to randomize from
    });

    // 5. Shuffle and limit
    const shuffled = questionPool
      .map(q => ({
        ...q,
        // Ensure options are parsed if they are stored as JSON strings
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        // Add a sort key for shuffling
        sort: Math.random()
      }))
      .sort((a, b) => a.sort - b.sort)
      .slice(0, limit);

    return NextResponse.json({
      sectionName: section.name,
      totalAvailable: questionPool.length,
      questions: shuffled
    });

  } catch (error) {
    console.error("Mega Mix API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
