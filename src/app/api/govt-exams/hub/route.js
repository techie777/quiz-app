import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { popularExamsData, examCategories } from "@/lib/govtExamsData";

export async function GET() {
  try {
    // Attempt fetching from Prisma MockExam
    const dbExams = await prisma.mockExam.findMany({
      where: { hidden: false },
      include: {
        category: true,
        _count: { select: { papers: true } }
      }
    });

    let exams = popularExamsData;

    // Merge or prioritize DB exams if available
    if (dbExams && dbExams.length > 0) {
      const dbExamMap = new Map(dbExams.map(e => [e.slug, e]));
      exams = popularExamsData.map(item => {
        const match = dbExamMap.get(item.slug);
        if (match) {
          return {
            ...item,
            testCount: match._count?.papers || item.testCount,
            description: match.description || item.description
          };
        }
        return item;
      });
    }

    return NextResponse.json({
      categories: examCategories,
      exams
    });
  } catch (error) {
    console.error("Error fetching govt exam hub data:", error);
    return NextResponse.json({
      categories: examCategories,
      exams: popularExamsData
    });
  }
}
