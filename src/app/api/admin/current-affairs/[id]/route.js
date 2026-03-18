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

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!requireMaster(session)) {
    return NextResponse.json({ error: "Master admin only" }, { status: 403 });
  }

  const { id } = params;
  const body = await request.json().catch(() => ({}));

  const row = await prisma.setting.findUnique({
    where: { key: "currentAffairs" },
    select: { value: true },
  });
  const all = loadAll(row?.value || "[]");
  const idx = all.findIndex((x) => x.id === id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const next = [...all];
  const current = next[idx];
  const updatedAt = new Date().toISOString();

  const date = body?.date !== undefined ? normalizeString(body.date) : current.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const heading = body?.heading !== undefined ? normalizeString(body.heading) : current.heading;
  const description = body?.description !== undefined ? normalizeString(body.description) : current.description;
  const category = body?.category !== undefined ? normalizeString(body.category) : current.category;
  const image = body?.image !== undefined ? (typeof body.image === "string" ? body.image : "") : current.image;
  const hidden = body?.hidden !== undefined ? !!body.hidden : current.hidden;

  if (!heading) return NextResponse.json({ error: "Heading is required" }, { status: 400 });
  if (!description) return NextResponse.json({ error: "Description is required" }, { status: 400 });

  next[idx] = { ...current, date, heading, description, category, image, hidden, updatedAt };
  await saveAll(next);

  await prisma.adminActivityLog.create({
    data: {
      adminId: session.user.adminId,
      action: "current_affairs_update",
      details: `${id}`,
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!requireMaster(session)) {
    return NextResponse.json({ error: "Master admin only" }, { status: 403 });
  }

  const { id } = params;
  const row = await prisma.setting.findUnique({
    where: { key: "currentAffairs" },
    select: { value: true },
  });
  const all = loadAll(row?.value || "[]");
  const next = all.filter((x) => x.id !== id);
  if (next.length === all.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await saveAll(next);

  await prisma.adminActivityLog.create({
    data: {
      adminId: session.user.adminId,
      action: "current_affairs_delete",
      details: `${id}`,
    },
  });

  return NextResponse.json({ success: true });
}

