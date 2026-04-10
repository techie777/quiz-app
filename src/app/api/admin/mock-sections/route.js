import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const paperId = searchParams.get('paperId');

    if (!paperId) {
      return NextResponse.json({ error: "Missing paperId" }, { status: 400 });
    }

    const sections = await prisma.mockSection.findMany({
      where: { paperId },
      orderBy: { order: 'asc' }
    });
    return NextResponse.json(sections);
  } catch (error) {
    console.error("Admin Fetch MockSections Error:", error);
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { id, paperId, name, order, timeLimit, totalMarks, totalQuestions } = data;

    if (!paperId || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sectionData = {
      name,
      order: parseInt(order) || 0,
      timeLimit: parseInt(timeLimit) || 0,
      totalMarks: parseFloat(totalMarks) || 0,
      totalQuestions: parseInt(totalQuestions) || 0
    };

    let section;
    if (id) {
      section = await prisma.mockSection.update({
        where: { id },
        data: sectionData
      });
    } else {
      section = await prisma.mockSection.create({
        data: { paperId, ...sectionData }
      });
    }

    return NextResponse.json(section);
  } catch (error) {
    console.error("Admin Save MockSection Error:", error);
    return NextResponse.json({ error: "Failed to save section" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await prisma.mockSection.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Delete MockSection Error:", error);
    return NextResponse.json({ error: "Failed to delete section" }, { status: 500 });
  }
}
