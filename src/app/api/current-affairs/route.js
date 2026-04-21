import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

function normalizeString(v) {
  return String(v || "").trim();
}

async function ensureMigrated() {
  const row = await prisma.setting.findUnique({
    where: { key: "currentAffairs" },
  });
  if (!row) return;

  const items = safeJsonParse(row.value, []);
  if (Array.isArray(items) && items.length > 0) {
    // Migration: insert into CurrentAffair table
    for (const it of items) {
      if (!it.heading || !it.date) continue;
      await prisma.currentAffair.create({
        data: {
          date: normalizeString(it.date),
          category: normalizeString(it.category) || "General",
          heading: normalizeString(it.heading),
          description: normalizeString(it.description),
          image: typeof it.image === "string" ? it.image : "",
          hidden: !!it.hidden,
          createdAt: it.createdAt ? new Date(it.createdAt) : new Date(),
          updatedAt: it.updatedAt ? new Date(it.updatedAt) : new Date(),
        },
      }).catch(err => console.error("Migration error for item:", it.id, err));
    }
  }

  // Delete the old setting to mark migration as done
  await prisma.setting.delete({ where: { key: "currentAffairs" } }).catch(() => {});
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const dateStr = normalizeString(searchParams.get("date"));
  const month = normalizeString(searchParams.get("month"));
  const category = normalizeString(searchParams.get("category"));
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(500, Math.max(6, parseInt(searchParams.get("pageSize") || "10", 10) || 10));
  const fallback = searchParams.get("fallback") === "true";

  try {
    await ensureMigrated();

    let where = { hidden: false };
    if (category && category !== "all") {
      where.category = { equals: category, mode: "insensitive" };
    }

    let items = [];
    let total = 0;
    let targetDate = dateStr;

    // Logic: If a specific date is requested and fallback is enabled, 
    // and no items are found for that date, find the latest available date.
    if (dateStr) {
      where.date = { lte: dateStr }; // Use "less than or equal" for infinite scroll back in time
      
      // Check if we need to fallback to the latest date if searching for today and no data found
      const countForTarget = await prisma.currentAffair.count({ where: { ...where, date: dateStr } });
      
      if (countForTarget === 0 && page === 1 && fallback) {
        const latestItem = await prisma.currentAffair.findFirst({
          where: { hidden: false },
          orderBy: { date: "desc" },
          select: { date: true }
        });
        
        if (latestItem) {
          targetDate = latestItem.date;
          where.date = { lte: targetDate };
        }
      }

      items = await prisma.currentAffair.findMany({
        where,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      total = await prisma.currentAffair.count({ where });
    } else if (month) {
      where.date = { startsWith: `${month}-` };
      items = await prisma.currentAffair.findMany({
        where,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      total = await prisma.currentAffair.count({ where });
    } else {
      // General list (Infinite Scroll case or overview)
      items = await prisma.currentAffair.findMany({
        where,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      total = await prisma.currentAffair.count({ where });
    }

    // Faster metadata fetch
    const categories = Array.from(new Set((await prisma.currentAffair.findMany({
      where: { hidden: false },
      select: { category: true },
      distinct: ['category']
    })).map(x => x.category).filter(Boolean))).sort();

    const months = Array.from(new Set((await prisma.currentAffair.findMany({
      where: { hidden: false },
      select: { date: true },
    })).map(x => x.date.slice(0, 7)).filter(m => /^\d{4}-\d{2}$/.test(m)))).sort((a, b) => b.localeCompare(a));

    return NextResponse.json({ 
      items, 
      total, 
      page, 
      pageSize, 
      categories, 
      months,
      date: targetDate 
    });
  } catch (error) {
    console.error("Current affairs API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
