import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const exams = await prisma.mockExam.findMany({
      where: { hidden: false },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { papers: true }
        }
      }
    });

    return NextResponse.json(exams);
  } catch (error) {
    console.error("Error fetching mock exams:", error);
    return NextResponse.json({ error: "Failed to fetch exams" }, { status: 500 });
  }
}
