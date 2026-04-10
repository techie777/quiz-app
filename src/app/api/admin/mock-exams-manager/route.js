import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const exams = await prisma.mockExam.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        category: true,
        _count: {
          select: { papers: true, sections: true }
        }
      }
    });
    return NextResponse.json(exams);
  } catch (error) {
    console.error("Admin Fetch MockExams Error:", error);
    return NextResponse.json({ error: "Failed to fetch mock exams" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { id, name, slug, emoji, description, sortOrder, hidden, categoryId } = data;

    let exam;
    if (id) {
      exam = await prisma.mockExam.update({
        where: { id },
        data: {
          name, slug, emoji, description, hidden,
          sortOrder: Number(sortOrder),
          categoryId: categoryId || null
        }
      });
    } else {
      exam = await prisma.mockExam.create({
        data: {
          name, slug, emoji, description, hidden,
          sortOrder: Number(sortOrder),
          categoryId: categoryId || null
        }
      });
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error("Admin Save MockExam Error:", error);
    return NextResponse.json({ error: "Failed to save exam" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await prisma.mockExam.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Delete MockExam Error:", error);
    return NextResponse.json({ error: "Failed to delete exam" }, { status: 500 });
  }
}
