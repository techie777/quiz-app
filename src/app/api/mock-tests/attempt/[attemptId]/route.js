import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Prepare response with comprehensive fallbacks
    let questions = [];
    try {
        if (attempt.paper?.showSolutions) {
            const parsedAnswers = JSON.parse(attempt.answersJson || "{}");
            questions = (attempt.paper.questions || []).map(q => {
                let options = [];
                let optionsHi = [];
                try {
                    options = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []);
                } catch (pe) { console.warn(`Option parse error for Q ${q.id}:`, pe); }

                try {
                    optionsHi = typeof q.optionsHi === 'string' ? JSON.parse(q.optionsHi) : (q.optionsHi || []);
                } catch (pe) { console.warn(`Hindi option parse error for Q ${q.id}:`, pe); }

                return {
                    id: q.id,
                    text: q.text,
                    textHi: q.textHi,
                    options,
                    optionsHi,
                    correctAnswer: q.answer,
                    userAnswer: parsedAnswers[q.id]?.option,
                    explanation: q.explanation,
                    explanationHi: q.explanationHi
                };
            });
        }
    } catch (qe) {
        console.error("Critical error mapping questions for result view:", qe);
    }

    const result = {
        id: attempt.id,
        paperTitle: attempt.paper?.title || "Mock Paper",
        examName: attempt.paper?.exam?.name || "Mock Exam",
        score: attempt.score || 0,
        totalMarks: attempt.paper?.totalMarks || 100,
        correctCount: attempt.correctCount || 0,
        wrongCount: attempt.wrongCount || 0,
        attemptedCount: attempt.attemptedCount || 0,
        totalQuestions: attempt.paper?.questions?.length || 0,
        timeLeft: attempt.timeLeft || 0,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
        showSolutions: attempt.paper?.showSolutions || false,
        questions
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching attempt results:", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
