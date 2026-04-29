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

    // 4. Fetch all matching IDs to ensure a truly random selection from the entire pool
    const allMatchingQuestions = await prisma.question.findMany({
      where: whereClause,
      select: { id: true }
    });

    if (allMatchingQuestions.length === 0) {
      return NextResponse.json({ questions: [] });
    }

    // 5. Randomly select unique IDs from the pool
    // We shuffle the entire ID list and take the requested limit
    const shuffledIds = allMatchingQuestions
      .map(q => q.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);

    // 6. Fetch full data for the selected random IDs
    const questionPool = await prisma.question.findMany({
      where: {
        id: { in: shuffledIds }
      },
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
      }
    });

    // 7. Map and ensure final shuffle (since findMany with 'in' might return them in ID order)
    const finalQuestions = questionPool
      .map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
      }))
      .sort(() => Math.random() - 0.5);

    return NextResponse.json({
      sectionName: section.name,
      totalAvailable: allMatchingQuestions.length,
      questions: finalQuestions
    });

  } catch (error) {
    console.error("Mega Mix API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
