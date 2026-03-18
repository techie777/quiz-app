import { NextResponse } from "next/server";
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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = normalizeString(searchParams.get("date"));
  const month = normalizeString(searchParams.get("month"));
  const category = normalizeString(searchParams.get("category"));
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(500, Math.max(6, parseInt(searchParams.get("pageSize") || "10", 10) || 10));

  const row = await prisma.setting.findUnique({
    where: { key: "currentAffairs" },
    select: { value: true },
  });

  const all = loadAll(row?.value || "[]");
  const publicItems = all.filter((x) => !x.hidden);

  const filtered = publicItems.filter((x) => {
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

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  const categories = Array.from(
    new Set(publicItems.map((x) => x.category).filter(Boolean).map((c) => c.trim()))
  ).sort((a, b) => a.localeCompare(b));

  const months = Array.from(
    new Set(publicItems.map((x) => x.date.slice(0, 7)).filter((m) => /^\d{4}-\d{2}$/.test(m)))
  ).sort((a, b) => b.localeCompare(a));

  return NextResponse.json({ items, total, page, pageSize, categories, months });
}
