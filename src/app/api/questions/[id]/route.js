import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";
import { requireAdmin } from "@/lib/adminSessionServer";

export const dynamic = "force-dynamic";

export async function PUT(request, { params }) {
  const adminCheck = await requireAdmin({ masterOnly: true });
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  const { id } = params;
  const body = await request.json();
  const data = {};
  if (body.text !== undefined) data.text = body.text;
  if (body.textHi !== undefined) data.textHi = body.textHi;
  if (body.options !== undefined) data.options = JSON.stringify(body.options);
  if (body.optionsHi !== undefined) data.optionsHi = JSON.stringify(body.optionsHi);
  if (body.correctAnswer !== undefined) data.correctAnswer = body.correctAnswer;
  if (body.difficulty !== undefined) data.difficulty = body.difficulty;
  if (body.image !== undefined) data.image = body.image || null;

  const question = await prisma.question.update({ where: { id }, data });
  return NextResponse.json({ 
    ...question, 
    options: safeJsonParse(question.options),
    optionsHi: safeJsonParse(question.optionsHi) || []
  });
}

export async function DELETE(request, { params }) {
  const adminCheck = await requireAdmin({ masterOnly: true });
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  const { id } = params;
  
  // Cascade delete favorites
  await prisma.favourite.deleteMany({ where: { questionId: id } });
  
  await prisma.question.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
