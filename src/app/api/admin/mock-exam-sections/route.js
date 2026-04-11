import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');

    if (!examId) {
      return NextResponse.json({ error: "Missing examId" }, { status: 400 });
    }

    const sections = await prisma.mockExamSection.findMany({
      where: { examId },
      orderBy: { sortOrder: 'asc' }
    });
    return NextResponse.json(sections);
  } catch (error) {
    console.error("Admin Fetch MockExamSections Error:", error);
    return NextResponse.json({ error: "Failed to fetch exam sections" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { id, examId, title, content, type, sortOrder } = data;

    if (!examId || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sectionData = {
      title,
      content: content || "",
      type: type || "TEXT",
      sortOrder: parseInt(sortOrder) || 0
    };

    let section;
    if (id) {
      section = await prisma.mockExamSection.update({
        where: { id },
        data: sectionData
      });
    } else {
      section = await prisma.mockExamSection.create({
        data: { examId, ...sectionData }
      });
    }

    return NextResponse.json(section);
  } catch (error) {
    console.error("Admin Save MockExamSection Error:", error);
    return NextResponse.json({ error: "Failed to save exam section" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await prisma.mockExamSection.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Delete MockExamSection Error:", error);
    return NextResponse.json({ error: "Failed to delete exam section" }, { status: 500 });
  }
}
