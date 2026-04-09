import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


const prisma = new PrismaClient();

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { attemptId } = params;

  try {
    const attempt = await prisma.mockAttempt.findUnique({
      where: { id: attemptId },
      include: {
        paper: {
           include: { 
             questions: true,
             exam: true
           }
        }
      }
    });

    if (!attempt || attempt.userId !== session.user.id) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    // Prepare response
    const result = {
        id: attempt.id,
        paperTitle: attempt.paper.title,
        examName: attempt.paper.exam.name,
        score: attempt.score,
        totalMarks: attempt.paper.totalMarks,
        correctCount: attempt.correctCount,
        wrongCount: attempt.wrongCount,
        attemptedCount: attempt.attemptedCount,
        totalQuestions: attempt.paper.questions.length,
        timeLeft: attempt.timeLeft,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
        showSolutions: attempt.paper.showSolutions,
        // Only send keys if showSolutions is true
        questions: attempt.paper.showSolutions ? attempt.paper.questions.map(q => ({
            id: q.id,
            text: q.text,
            textHi: q.textHi,
            options: JSON.parse(q.options || "[]"),
            optionsHi: JSON.parse(q.optionsHi || "[]"),
            correctAnswer: q.answer,
            userAnswer: JSON.parse(attempt.answersJson || "{}")[q.id]?.option,
            explanation: q.explanation,
            explanationHi: q.explanationHi
        })) : []
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching attempt results:", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
