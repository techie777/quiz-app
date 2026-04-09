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

async function getUserId(session) {
  if (!session?.user?.id || session.user.isAdmin) return null;
  return session.user.id;
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = await getUserId(session);
    if (!userId) return NextResponse.json({ ids: [] }, { status: 200 });

    const { searchParams } = new URL(request.url);
    const idsOnly = searchParams.get("ids") === "1";

    const row = await prisma.setting.findUnique({
      where: { key: `userCategoryFavourites:${userId}` },
      select: { value: true },
    });

    const ids = toIdList(row?.value || "[]");
    if (idsOnly) return NextResponse.json({ ids }, { status: 200 });

    return NextResponse.json({ ids }, { status: 200 });
  } catch (error) {
    console.error("Category favourites GET error:", error);
    return NextResponse.json({ ids: [] }, { status: 200 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = await getUserId(session);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const categoryId = String(body?.categoryId || "").trim();
    if (!categoryId) return NextResponse.json({ error: "categoryId required" }, { status: 400 });

    const row = await prisma.setting.findUnique({
      where: { key: `userCategoryFavourites:${userId}` },
      select: { value: true },
    });

    const ids = toIdList(row?.value || "[]");
    const set = new Set(ids);

    let favourited = false;
    if (set.has(categoryId)) {
      set.delete(categoryId);
      favourited = false;
    } else {
      set.add(categoryId);
      favourited = true;
    }

    await prisma.setting.upsert({
      where: { key: `userCategoryFavourites:${userId}` },
      update: { value: JSON.stringify(Array.from(set)) },
      create: { key: `userCategoryFavourites:${userId}`, value: JSON.stringify(Array.from(set)) },
    });

    return NextResponse.json({ favourited }, { status: 200 });
  } catch (error) {
    console.error("Category favourites POST error:", error);
    return NextResponse.json({ error: "Failed to toggle favourite" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = await getUserId(session);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const categoryId = String(body?.categoryId || "").trim();
    if (!categoryId) return NextResponse.json({ error: "categoryId required" }, { status: 400 });

    const row = await prisma.setting.findUnique({
      where: { key: `userCategoryFavourites:${userId}` },
      select: { value: true },
    });

    const ids = toIdList(row?.value || "[]");
    const next = ids.filter((id) => id !== categoryId);

    await prisma.setting.upsert({
      where: { key: `userCategoryFavourites:${userId}` },
      update: { value: JSON.stringify(next) },
      create: { key: `userCategoryFavourites:${userId}`, value: JSON.stringify(next) },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Category favourites DELETE error:", error);
    return NextResponse.json({ error: "Failed to remove favourite" }, { status: 500 });
  }
}

