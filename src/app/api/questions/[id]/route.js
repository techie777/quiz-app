import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin || session.user.role !== "master") {
    return NextResponse.json({ error: "Master admin only" }, { status: 403 });
  }

  const { id } = params;
  const body = await request.json();
  const data = {};
  if (body.text !== undefined) data.text = body.text;
  if (body.options !== undefined) data.options = JSON.stringify(body.options);
  if (body.correctAnswer !== undefined) data.correctAnswer = body.correctAnswer;
  if (body.difficulty !== undefined) data.difficulty = body.difficulty;
  if (body.image !== undefined) data.image = body.image || null;

  const question = await prisma.question.update({ where: { id }, data });
  return NextResponse.json({ ...question, options: safeJsonParse(question.options) });
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin || session.user.role !== "master") {
    return NextResponse.json({ error: "Master admin only" }, { status: 403 });
  }

  const { id } = params;
  await prisma.question.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
