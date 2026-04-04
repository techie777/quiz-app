import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin || session.user.role !== "master") {
    return NextResponse.json({ error: "Master admin only" }, { status: 403 });
  }

  // Log to monitoring service in production
  try {
    const body = await request.json();
    const { categories, questions, categoryId } = body;

    // Mode 1: Full JSON import (array of categories with questions)
    if (categories) {
      // Log to monitoring service in production
      for (const cat of categories) {
        // Find existing category by ID (if 24-char) or Topic
        const catId = (cat.id && cat.id.length === 24) ? cat.id : undefined;
        let existing = null;
        if (catId) {
          existing = await prisma.category.findUnique({ where: { id: catId } });
        } else {
          existing = await prisma.category.findFirst({ where: { topic: cat.topic } });
        }

        let targetCatId = existing?.id;

        if (!existing) {
          const maxSort = await prisma.category.aggregate({ _max: { sortOrder: true } });
          const newCat = await prisma.category.create({
            data: {
              topic: cat.topic,
              emoji: cat.emoji || "❓",
              description: cat.description || "",
              categoryClass: cat.categoryClass || `category-${cat.topic.toLowerCase().replace(/\s+/g, "-")}`,
              hidden: !!cat.hidden,
              sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
              parentId: cat.parentId || null,
              showSubCategoriesOnHome: !!cat.showSubCategoriesOnHome,
            },
          });
          targetCatId = newCat.id;
          // Log to monitoring service in production
        }

        if (cat.questions && cat.questions.length > 0) {
          await prisma.question.createMany({
            data: cat.questions.map((q) => ({
              text: q.text,
              options: JSON.stringify(q.options),
              correctAnswer: q.correctAnswer,
              difficulty: q.difficulty || "easy",
              categoryId: targetCatId,
            })),
          });
        }
      }
      return NextResponse.json({ success: true });
    }

    // Mode 2: Excel-parsed questions into a specific category
    if (questions && questions.length > 0 && categoryId) {
      await prisma.question.createMany({
        data: questions.map((q) => ({
          text: q.text,
          options: JSON.stringify(q.options),
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty || "easy",
          categoryId: categoryId,
        })),
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  } catch (err) {
    console.error("[BulkAPI] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
