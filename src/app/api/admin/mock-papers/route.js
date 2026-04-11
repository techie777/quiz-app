import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');

    const where = {};
    if (examId) where.examId = examId;

    const papers = await prisma.mockPaper.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        exam: true,
        _count: {
          select: { questions: true, sections: true }
        }
      }
    });
    return NextResponse.json(papers);
  } catch (error) {
    console.error("Admin Fetch MockPapers Error:", error);
    return NextResponse.json({ error: "Failed to fetch mock papers" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { 
      id, examId, title, slug, timeLimit, totalMarks, 
      negativeMarking, positiveMarking, instructionType, 
      instructions, isLive, showSolutions, paperType, year, sortOrder
    } = data;

    if (!examId || !title || !slug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const paperData = {
      examId,
      title,
      slug,
      timeLimit: parseInt(timeLimit) || 60,
      totalMarks: parseInt(totalMarks) || 100,
      negativeMarking: parseFloat(negativeMarking) || 0.25,
      positiveMarking: parseFloat(positiveMarking) || 1.0,
      instructionType: instructionType || "TCS",
      instructions: instructions || "",
      isLive: !!isLive,
      showSolutions: !!showSolutions,
      paperType: paperType || "MOCK",
      year: parseInt(year) || 2025,
      sortOrder: parseInt(sortOrder) || 0
    };

    let paper;
    if (id) {
      paper = await prisma.mockPaper.update({
        where: { id },
        data: paperData
      });
    } else {
      paper = await prisma.mockPaper.create({
        data: paperData
      });
    }

    return NextResponse.json(paper);
  } catch (error) {
    console.error("Admin Save MockPaper Error:", error);
    return NextResponse.json({ error: error.message || "Failed to save mock paper" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await prisma.mockPaper.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Delete MockPaper Error:", error);
    return NextResponse.json({ error: "Failed to delete mock paper" }, { status: 500 });
  }
}
