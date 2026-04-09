import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  const { examId } = params;

  try {
    const exam = await prisma.mockExam.findUnique({
      where: { id: examId },
      include: {
        papers: {
          where: { isLive: true },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            timeLimit: true,
            totalMarks: true,
            positiveMarking: true,
            negativeMarking: true,
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

    return NextResponse.json(exam);
  } catch (error) {
    console.error("Error fetching exam papers:", error);
    return NextResponse.json({ error: "Failed to fetch papers" }, { status: 500 });
  }
}
