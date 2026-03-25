import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { id } = params;
  const category = await prisma.category.findUnique({
    where: { id },
    include: { questions: true },
  });
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    ...category,
    questions: category.questions.map((q) => ({ ...q, options: safeJsonParse(q.options) })),
  });
}

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin || session.user.role !== "master") {
    return NextResponse.json({ error: "Master admin only" }, { status: 403 });
  }

  const { id } = params;
  const body = await request.json();
  
  console.log('PUT request body:', body);
  
  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(body.topic !== undefined && { topic: body.topic }),
      ...(body.emoji !== undefined && { emoji: body.emoji }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.categoryClass !== undefined && { categoryClass: body.categoryClass }),
      ...(body.hidden !== undefined && { hidden: body.hidden }),
      ...(body.image !== undefined && { image: body.image || null }),
      ...(body.parentId !== undefined && { parentId: body.parentId || null }),
      ...(body.showSubCategoriesOnHome !== undefined && { showSubCategoriesOnHome: !!body.showSubCategoriesOnHome }),
      ...(body.storyText !== undefined && { storyText: body.storyText || null }),
      ...(body.storyImage !== undefined && { storyImage: body.storyImage || null }),
      ...(body.originalLang !== undefined && { originalLang: body.originalLang || "en" }),
      ...(body.isTrending !== undefined && { isTrending: !!body.isTrending }),
      ...(body.chips !== undefined && { chips: Array.isArray(body.chips) ? JSON.stringify(body.chips) : "[]" }),
    },
  });
  
  return NextResponse.json({
    ...category,
    chips: safeJsonParse(category.chips) || [],
  });
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin || session.user.role !== "master") {
    return NextResponse.json({ error: "Master admin only" }, { status: 403 });
  }

  const { id } = params;
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
