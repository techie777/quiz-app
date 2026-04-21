import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // ── ATTEMPT RECORDING ──
    const score = (correctCount * paper.positiveMarking) - (wrongCount * paper.negativeMarking);

    // Find if there was an in-progress attempt to finish
    const existingAttempt = await prisma.mockAttempt.findFirst({
      where: {
        userId: session.user.id,
        paperId,
        status: "IN_PROGRESS"
      },
      orderBy: { updatedAt: "desc" }
    });

    let attempt;
    if (existingAttempt) {
      console.log(`✅ [SUBMIT] Finalizing existing attempt: ${existingAttempt.id}`);
      attempt = await prisma.mockAttempt.update({
        where: { id: existingAttempt.id },
        data: {
          answersJson,
          status: "COMPLETED",
          timeLeft,
          score,
          correctCount,
          wrongCount,
          attemptedCount,
          completedAt: new Date(),
          updatedAt: new Date()
        }
      });
    } else {
      console.log(`✅ [SUBMIT] No in-progress attempt found. Creating new COMPLETED record.`);
      attempt = await prisma.mockAttempt.create({
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
    }

    if (!attempt || !attempt.id) {
       throw new Error("Failed to generate attempt ID from database recording layer.");
    }

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
    console.error("❌ [SUBMIT] Fatal Error:", error);
    return NextResponse.json({ 
        error: "Submission failed in the final recording phase.", 
        details: error.message 
    }, { status: 500 });
  }
}
