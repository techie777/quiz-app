import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const attemptId = '69d80ac8e85a7c28d67e9906';
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
        questions: attempt.paper.showSolutions ? attempt.paper.questions.map(q => ({
            id: q.id,
            text: q.text,
            options: JSON.parse(q.options || "[]"),
            correctAnswer: q.answer,
            userAnswer: JSON.parse(attempt.answersJson || "{}")[q.id]?.option,
            explanation: q.explanation
        })) : []
    };
    console.log(JSON.stringify(result, null, 2));
}
run().finally(() => prisma.$disconnect());
