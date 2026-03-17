import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.json();
  const { categories, questions, categoryId } = body;

  // Mode 1: Full JSON import (array of categories with questions)
  if (categories) {
    for (const cat of categories) {
      const existing = await prisma.category.findUnique({ where: { id: cat.id } });
      if (!existing) {
        const maxSort = await prisma.category.aggregate({ _max: { sortOrder: true } });
        await prisma.category.create({
          data: {
            id: cat.id,
            topic: cat.topic,
            emoji: cat.emoji,
            description: cat.description || "",
            categoryClass: cat.categoryClass || `category-${cat.id}`,
            hidden: !!cat.hidden,
            sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
            parentId: cat.parentId || null,
            showSubCategoriesOnHome: !!cat.showSubCategoriesOnHome,
          },
        });
      }
      if (cat.questions) {
        for (const q of cat.questions) {
          const existingQ = await prisma.question.findUnique({ where: { id: q.id } });
          if (!existingQ) {
            await prisma.question.create({
              data: {
                id: q.id,
                text: q.text,
                options: JSON.stringify(q.options),
                correctAnswer: q.correctAnswer,
                difficulty: q.difficulty || "easy",
                categoryId: cat.id,
              },
            });
          }
        }
      }
    }
    return NextResponse.json({ success: true });
  }

  // Mode 2: Excel-parsed questions into a specific category
  if (questions && categoryId) {
    for (const q of questions) {
      await prisma.question.create({
        data: {
          id: q.id || `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          text: q.text,
          options: JSON.stringify(q.options),
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty || "easy",
          categoryId,
        },
      });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
}
