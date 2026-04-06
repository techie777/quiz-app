import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

function requireMaster(session) {
  return !!session?.user?.isAdmin && session.user.role === "master";
}

function requireAnyAdmin(session) {
  return !!session?.user?.isAdmin;
}

function hasCurrentAffairsAccess(session) {
  if (!requireAnyAdmin(session)) return false;
  if (session.user.role === "master") return true;
  const raw = session.user.permissions;
  if (raw && typeof raw === "object") return raw.currentAffairs !== false;
  if (typeof raw !== "string" || !raw.trim()) return true;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.currentAffairs !== false;
  } catch {
    return true;
  }
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!hasCurrentAffairsAccess(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Run migration check once per request or similar (low overhead if setting is gone)
  await ensureMigrated();

  const { searchParams } = new URL(request.url);
  const date = normalizeString(searchParams.get("date"));
  const month = normalizeString(searchParams.get("month"));
  const category = normalizeString(searchParams.get("category"));

  const where = {};
  if (date) {
    where.date = date;
  } else if (month) {
    where.date = { startsWith: `${month}-` };
  }
  if (category && category !== "all") {
    where.category = { equals: category, mode: "insensitive" };
  }

  const items = await prisma.currentAffair.findMany({
    where,
    orderBy: [
      { date: "desc" },
      { createdAt: "desc" }
    ],
  });

  // Get unique categories and months for filters
  const allItems = await prisma.currentAffair.findMany({
    select: { category: true, date: true }
  });
  
  const categories = Array.from(new Set(allItems.map(x => x.category).filter(Boolean))).sort();
  const months = Array.from(new Set(allItems.map(x => x.date.slice(0, 7)).filter(m => /^\d{4}-\d{2}$/.test(m)))).sort((a, b) => b.localeCompare(a));

  return NextResponse.json({ items, categories, months });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!requireMaster(session)) {
    return NextResponse.json({ error: "Master admin only" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const date = normalizeString(body?.date);
  const heading = normalizeString(body?.heading);
  const description = normalizeString(body?.description);
  const category = normalizeString(body?.category) || "General";
  const image = typeof body?.image === "string" ? body.image : "";
  const hidden = !!body?.hidden;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  if (!heading) return NextResponse.json({ error: "Heading is required" }, { status: 400 });
  if (!description) return NextResponse.json({ error: "Description is required" }, { status: 400 });

  const item = await prisma.currentAffair.create({
    data: { date, category, heading, description, image, hidden },
  });

  await prisma.adminActivityLog.create({
    data: {
      adminId: session.user.adminId,
      action: "current_affairs_create",
      details: `${date} ${heading}`,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
