import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  const { examId } = params;

  try {
    const exam = await prisma.mockExam.findUnique({
      where: { id: examId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            isPaid: true,
            price: true
          }
        },
        sections: {
          orderBy: { sortOrder: 'asc' }
        },
        papers: {
          where: { isLive: true },
          orderBy: [
            { year: 'desc' },
            { createdAt: 'desc' }
          ],
          select: {
            id: true,
            title: true,
            slug: true,
            timeLimit: true,
            totalMarks: true,
            positiveMarking: true,
            negativeMarking: true,
            paperType: true,
            year: true,
            _count: {
              select: { questions: true }
            }
          }
        }
      }
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam category not found" }, { status: 404 });
    }

    // Fetch linked categories if any
    let linkedQuizzes = [];
    if (exam.quizCategoryIds && exam.quizCategoryIds.length > 0) {
      linkedQuizzes = await prisma.category.findMany({
        where: { id: { in: exam.quizCategoryIds } },
        select: {
          id: true,
          topic: true,
          emoji: true,
          description: true,
          _count: { select: { questions: true } }
        }
      });
    }

    return NextResponse.json({ ...exam, linkedQuizzes });
  } catch (error) {
    console.error("Error fetching exam papers:", error);
    return NextResponse.json({ error: "Failed to fetch papers" }, { status: 500 });
  }
}
