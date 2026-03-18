import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

function toIdList(raw) {
  const parsed = safeJsonParse(raw, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.map((x) => String(x || "").trim()).filter(Boolean);
}

function loadCurrentAffairsList(raw) {
  const parsed = safeJsonParse(raw, []);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((x) => ({
      id: String(x?.id || "").trim(),
      date: String(x?.date || "").trim(),
      category: String(x?.category || "").trim(),
      heading: String(x?.heading || "").trim(),
      description: String(x?.description || "").trim(),
      image: typeof x?.image === "string" ? x.image : "",
      hidden: !!x?.hidden,
      createdAt: x?.createdAt ? new Date(x.createdAt).toISOString() : null,
      updatedAt: x?.updatedAt ? new Date(x.updatedAt).toISOString() : null,
    }))
    .filter((x) => x.id && x.date && x.heading);
}

async function getUserId(session) {
  if (!session?.user?.id || session.user.isAdmin) return null;
  return session.user.id;
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  const userId = await getUserId(session);
  if (!userId) return NextResponse.json({ ids: [], items: [] }, { status: 200 });

  const { searchParams } = new URL(request.url);
  const idsOnly = searchParams.get("ids") === "1";

  const favRow = await prisma.setting.findUnique({
    where: { key: `userCAFavourites:${userId}` },
    select: { value: true },
  });
  const ids = toIdList(favRow?.value || "[]");
  if (idsOnly) return NextResponse.json({ ids }, { status: 200 });

  const caRow = await prisma.setting.findUnique({
    where: { key: "currentAffairs" },
    select: { value: true },
  });
  const list = loadCurrentAffairsList(caRow?.value || "[]");
  const idSet = new Set(ids);
  const items = list.filter((x) => idSet.has(x.id));

  items.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    const at = a.createdAt || "";
    const bt = b.createdAt || "";
    return bt.localeCompare(at);
  });

  return NextResponse.json({ ids, items }, { status: 200 });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  const userId = await getUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const currentAffairId = String(body?.currentAffairId || "").trim();
  if (!currentAffairId) return NextResponse.json({ error: "currentAffairId required" }, { status: 400 });

  const favRow = await prisma.setting.findUnique({
    where: { key: `userCAFavourites:${userId}` },
    select: { value: true },
  });
  const ids = toIdList(favRow?.value || "[]");
  const set = new Set(ids);

  let favourited = false;
  if (set.has(currentAffairId)) {
    set.delete(currentAffairId);
    favourited = false;
  } else {
    set.add(currentAffairId);
    favourited = true;
  }

  await prisma.setting.upsert({
    where: { key: `userCAFavourites:${userId}` },
    update: { value: JSON.stringify(Array.from(set)) },
    create: { key: `userCAFavourites:${userId}`, value: JSON.stringify(Array.from(set)) },
  });

  return NextResponse.json({ favourited }, { status: 200 });
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  const userId = await getUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const currentAffairId = String(body?.currentAffairId || "").trim();
  if (!currentAffairId) return NextResponse.json({ error: "currentAffairId required" }, { status: 400 });

  const favRow = await prisma.setting.findUnique({
    where: { key: `userCAFavourites:${userId}` },
    select: { value: true },
  });
  const ids = toIdList(favRow?.value || "[]");
  const next = ids.filter((id) => id !== currentAffairId);

  await prisma.setting.upsert({
    where: { key: `userCAFavourites:${userId}` },
    update: { value: JSON.stringify(next) },
    create: { key: `userCAFavourites:${userId}`, value: JSON.stringify(next) },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}

