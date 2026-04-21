import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  const { paperId } = params;

  try {
    const paper = await prisma.mockPaper.findUnique({
      where: { id: paperId },
      include: {
        exam: true,
        sections: {
          orderBy: { order: 'asc' },
          include: {
            _count: { select: { questions: true } }
          }
        },
        _count: {
          select: { questions: true }
        }
      }
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    return NextResponse.json(paper);
  } catch (error) {
    console.error("Error fetching paper details:", error);
    return NextResponse.json({ error: "Failed to fetch paper" }, { status: 500 });
  }
}
