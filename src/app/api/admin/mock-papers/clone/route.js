import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { originalPaperId } = await request.json();
    if (!originalPaperId) return NextResponse.json({ error: "Missing original paper ID" }, { status: 400 });

    const originalPaper = await prisma.mockPaper.findUnique({
      where: { id: originalPaperId },
      include: { sections: true }
    });

    if (!originalPaper) return NextResponse.json({ error: "Original paper not found" }, { status: 404 });

    const newSlug = `${originalPaper.slug}-copy-${Date.now()}`;

    // Create the cloned paper
    const clonedPaper = await prisma.mockPaper.create({
      data: {
        examId: originalPaper.examId,
        title: `${originalPaper.title} (Copy)`,
        slug: newSlug,
        timeLimit: originalPaper.timeLimit,
        totalMarks: originalPaper.totalMarks,
        negativeMarking: originalPaper.negativeMarking,
        positiveMarking: originalPaper.positiveMarking,
        instructionType: originalPaper.instructionType,
        instructions: originalPaper.instructions,
        showSolutions: originalPaper.showSolutions,
        isLive: false, // Cloned exam starts as draft
      }
    });

    // Create associated sections mapped to the cloned paper
    if (originalPaper.sections && originalPaper.sections.length > 0) {
       await prisma.mockSection.createMany({
          data: originalPaper.sections.map(sec => ({
             paperId: clonedPaper.id,
             name: sec.name,
             order: sec.order,
             timeLimit: sec.timeLimit,
             totalMarks: sec.totalMarks,
             totalQuestions: sec.totalQuestions
          }))
       });
    }

    return NextResponse.json({ success: true, clonedPaper });
  } catch (error) {
    console.error("Error cloning Mock Test:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
