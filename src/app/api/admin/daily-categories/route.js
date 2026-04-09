import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminSessionServer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DAILY_CATEGORIES = [
  {
    id: "65f1a2b3c4d5e6f7a8b9c0d9", // Valid 24-char hex
    topic: "Quiz of the day",
    emoji: "🌟",
    description: "Daily curated quiz",
    categoryClass: "category-quiz-of-the-day",
  },
  {
    id: "65f1a2b3c4d5e6f7a8b9c0e1", // Valid 24-char hex
    topic: "Daily current affairs",
    emoji: "🗞️",
    description: "Daily current affairs quiz",
    categoryClass: "category-daily-current-affairs",
  },
];

export async function POST() {
  const admin = await requireAdmin({ masterOnly: true });
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const maxSort = await prisma.category.aggregate({ _max: { sortOrder: true } });
  let nextSort = (maxSort._max.sortOrder ?? -1) + 1;

  const createdOrUpdated = [];
  for (const cat of DAILY_CATEGORIES) {
    const existing = await prisma.category.findUnique({ where: { id: cat.id } });
    if (existing) {
      const updated = await prisma.category.update({
        where: { id: cat.id },
        data: {
          topic: cat.topic,
          emoji: cat.emoji,
          description: cat.description,
          categoryClass: cat.categoryClass,
          hidden: false,
        },
      });
      createdOrUpdated.push(updated.id);
    } else {
      const created = await prisma.category.create({
        data: {
          id: cat.id,
          topic: cat.topic,
          emoji: cat.emoji,
          description: cat.description,
          categoryClass: cat.categoryClass,
          hidden: false,
          sortOrder: nextSort++,
          showSubCategoriesOnHome: false,
          originalLang: "en",
          isTrending: false,
          chips: "[]",
        },
      });
      createdOrUpdated.push(created.id);
    }
  }

  await prisma.adminActivityLog.create({
    data: {
      adminId: admin.admin.id,
      action: "ensure_daily_categories",
      details: createdOrUpdated.join(", "),
    },
  });

  return NextResponse.json({ success: true, ids: createdOrUpdated });
}

