import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const paperId = searchParams.get('paperId');
    const sectionId = searchParams.get('sectionId');

    if (!paperId) {
      return NextResponse.json({ error: "Missing paperId" }, { status: 400 });
    }

    const where = { paperId };
    if (sectionId) where.sectionId = sectionId;

    const questions = await prisma.mockQuestion.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        section: true
      }
    });
    return NextResponse.json(questions);
  } catch (error) {
    console.error("Admin Fetch MockQuestions Error:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { 
      id, paperId, sectionId, text, textHi, 
      options, optionsHi, answer, explanation, 
      explanationHi, image, type, difficulty, sortOrder
    } = data;

    if (!paperId || !text || answer === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const questionData = {
      paperId,
      sectionId: sectionId || null,
      text,
      textHi: textHi || null,
      options: typeof options === 'string' ? options : JSON.stringify(options || []),
      optionsHi: typeof optionsHi === 'string' ? optionsHi : JSON.stringify(optionsHi || []),
      answer: parseInt(answer),
      explanation: explanation || null,
      explanationHi: explanationHi || null,
      image: image || null,
      type: type || "MCQ",
      difficulty: difficulty || "Medium",
      sortOrder: parseInt(sortOrder) || 0
    };

    let question;
    if (id) {
      question = await prisma.mockQuestion.update({
        where: { id },
        data: questionData
      });
    } else {
      question = await prisma.mockQuestion.create({
        data: questionData
      });
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error("Admin Save MockQuestion Error:", error);
    return NextResponse.json({ error: error.message || "Failed to save question" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await prisma.mockQuestion.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Delete MockQuestion Error:", error);
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
