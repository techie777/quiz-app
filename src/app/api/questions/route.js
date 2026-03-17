import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");
  const where = {};
  if (categoryId) where.categoryId = categoryId;

  const questions = await prisma.question.findMany({ where, include: { category: true } });
  return NextResponse.json(
    questions.map((q) => ({ ...q, options: safeJsonParse(q.options) }))
  );
}

export async function POST(request) {
  const body = await request.json();
  const { id, text, options, correctAnswer, difficulty, image, categoryId } = body;
  const question = await prisma.question.create({
    data: {
      id: id || `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text,
      options: JSON.stringify(options),
      correctAnswer,
      difficulty: difficulty || "easy",
      image: image || null,
      categoryId,
    },
  });
  return NextResponse.json({ ...question, options: safeJsonParse(question.options) }, { status: 201 });
}
