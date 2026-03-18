import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

function normalizeString(v) {
  return String(v || "").trim();
}

function loadAll(itemsRaw) {
  const list = safeJsonParse(itemsRaw, []);
  if (!Array.isArray(list)) return [];
  return list
    .map((x) => ({
      id: normalizeString(x?.id),
      date: normalizeString(x?.date),
      category: normalizeString(x?.category),
      heading: normalizeString(x?.heading),
      description: normalizeString(x?.description),
      image: typeof x?.image === "string" ? x.image : "",
      hidden: !!x?.hidden,
      createdAt: x?.createdAt ? new Date(x.createdAt).toISOString() : null,
      updatedAt: x?.updatedAt ? new Date(x.updatedAt).toISOString() : null,
    }))
    .filter((x) => x.id && x.date && x.heading);
}

async function saveAll(list) {
  await prisma.setting.upsert({
    where: { key: "currentAffairs" },
    update: { value: JSON.stringify(list) },
    create: { key: "currentAffairs", value: JSON.stringify(list) },
  });
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

  const { searchParams } = new URL(request.url);
  const date = normalizeString(searchParams.get("date"));
  const month = normalizeString(searchParams.get("month"));
  const category = normalizeString(searchParams.get("category"));

  const row = await prisma.setting.findUnique({
    where: { key: "currentAffairs" },
    select: { value: true },
  });

  const all = loadAll(row?.value || "[]");
  const filtered = all.filter((x) => {
    if (date && x.date !== date) return false;
    if (!date && month && !x.date.startsWith(`${month}-`)) return false;
    if (category && category !== "all" && x.category.toLowerCase() !== category.toLowerCase()) return false;
    return true;
  });

  filtered.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    const at = a.createdAt || "";
    const bt = b.createdAt || "";
    return bt.localeCompare(at);
  });

  const categories = Array.from(new Set(all.map((x) => x.category).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const months = Array.from(new Set(all.map((x) => x.date.slice(0, 7)).filter((m) => /^\d{4}-\d{2}$/.test(m)))).sort((a, b) => b.localeCompare(a));

  return NextResponse.json({ items: filtered, categories, months });
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
  const category = normalizeString(body?.category);
  const image = typeof body?.image === "string" ? body.image : "";
  const hidden = !!body?.hidden;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  if (!heading) return NextResponse.json({ error: "Heading is required" }, { status: 400 });
  if (!description) return NextResponse.json({ error: "Description is required" }, { status: 400 });

  const row = await prisma.setting.findUnique({
    where: { key: "currentAffairs" },
    select: { value: true },
  });
  const all = loadAll(row?.value || "[]");

  const now = new Date().toISOString();
  const id = `ca_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const next = [
    ...all,
    { id, date, category, heading, description, image, hidden, createdAt: now, updatedAt: now },
  ];
  await saveAll(next);

  await prisma.adminActivityLog.create({
    data: {
      adminId: session.user.adminId,
      action: "current_affairs_create",
      details: `${date} ${heading}`,
    },
  });

  return NextResponse.json({ id }, { status: 201 });
}
