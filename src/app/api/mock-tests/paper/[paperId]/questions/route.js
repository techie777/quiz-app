import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  const { paperId } = params;

  try {
    const questions = await prisma.mockQuestion.findMany({
      where: { paperId },
      orderBy: [
        { section: { order: 'asc' } },
        { createdAt: 'asc' }
      ],
      include: {
        section: true
      }
    });

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: "No questions found for this paper" }, { status: 404 });
    }

    // Transform string JSON fields back to arrays
    const formattedQuestions = questions.map(q => ({
      ...q,
      options: JSON.parse(q.options || "[]"),
      optionsHi: JSON.parse(q.optionsHi || "[]")
    }));

    return NextResponse.json(formattedQuestions);
  } catch (error) {
    console.error("Error fetching mock questions:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}
