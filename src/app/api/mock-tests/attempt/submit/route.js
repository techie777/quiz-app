import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


const prisma = new PrismaClient();

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { paperId, answersJson, timeLeft } = await request.json();
  console.log(`📝 [SUBMIT] Attempt received for Paper: ${paperId} by User: ${session.user.id}`);
  
  try {
    const paper = await prisma.mockPaper.findUnique({
      where: { id: paperId },
      include: { questions: true }
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const userAnswers = JSON.parse(answersJson || "{}");
    let correctCount = 0;
    let wrongCount = 0;
    let attemptedCount = 0;

    paper.questions.forEach(q => {
      const uAns = userAnswers[q.id];
      if (uAns && uAns.option !== undefined) {
        attemptedCount++;
        if (parseInt(uAns.option) === q.answer) {
          correctCount++;
        } else {
          wrongCount++;
        }
      }
    });

    const score = (correctCount * paper.positiveMarking) - (wrongCount * paper.negativeMarking);

    const attempt = await prisma.mockAttempt.create({
      data: {
        userId: session.user.id,
        paperId,
        answersJson,
        status: "COMPLETED",
        timeLeft,
        score,
        correctCount,
        wrongCount,
        attemptedCount,
        completedAt: new Date()
      }
    });

    return NextResponse.json({
        id: attempt.id,
        score,
        correctCount,
        wrongCount,
        attemptedCount,
        totalQuestions: paper.questions.length,
        totalMarks: paper.totalMarks
    });
  } catch (error) {
    console.error("Error submitting mock test:", error);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
