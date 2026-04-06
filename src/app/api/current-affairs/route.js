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
  const date = normalizeString(searchParams.get("date"));
  const month = normalizeString(searchParams.get("month"));
  const category = normalizeString(searchParams.get("category"));
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(500, Math.max(6, parseInt(searchParams.get("pageSize") || "10", 10) || 10));

  try {
    // Run migration check once per request or similar (low overhead if setting is gone)
    await ensureMigrated();

    const where = { hidden: false };
    if (date) {
      where.date = date;
    } else if (month) {
      where.date = { startsWith: `${month}-` };
    }
    if (category && category !== "all") {
      where.category = { equals: category, mode: "insensitive" };
    }

    const [items, total] = await Promise.all([
      prisma.currentAffair.findMany({
        where,
        orderBy: [
          { date: "desc" },
          { createdAt: "desc" }
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.currentAffair.count({ where }),
    ]);

    // Get unique categories and months for filters from public items only
    const allPublicItems = await prisma.currentAffair.findMany({
      where: { hidden: false },
      select: { category: true, date: true }
    });
    
    const categories = Array.from(new Set(allPublicItems.map(x => x.category).filter(Boolean))).sort();
    const months = Array.from(new Set(allPublicItems.map(x => x.date.slice(0, 7)).filter(m => /^\d{4}-\d{2}$/.test(m)))).sort((a, b) => b.localeCompare(a));

    return NextResponse.json({ items, total, page, pageSize, categories, months });
  } catch (error) {
    console.error("Current affairs API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
