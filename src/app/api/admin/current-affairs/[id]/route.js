import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminSessionServer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function normalizeString(v) {
  return String(v || "").trim();
}

export async function PUT(request, { params }) {
  const admin = await requireAdmin({ masterOnly: true });
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const { id } = params;
  if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  
  const data = {};
  if (body.date !== undefined) {
    const d = normalizeString(body.date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    data.date = d;
  }
  if (body.heading !== undefined) {
    const h = normalizeString(body.heading);
    if (!h) return NextResponse.json({ error: "Heading is required" }, { status: 400 });
    data.heading = h;
  }
  if (body.description !== undefined) {
    const desc = normalizeString(body.description);
    if (!desc) return NextResponse.json({ error: "Description is required" }, { status: 400 });
    data.description = desc;
  }
  if (body.category !== undefined) data.category = normalizeString(body.category) || "General";
  if (body.image !== undefined) data.image = typeof body.image === "string" ? body.image : "";
  if (body.hidden !== undefined) data.hidden = !!body.hidden;

  try {
    const item = await prisma.currentAffair.update({
      where: { id },
      data,
    });

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.admin.id,
        action: "current_affairs_update",
        details: `${id}`,
      },
    });

    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: "Update failed or item not found" }, { status: 404 });
  }
}

export async function DELETE(request, { params }) {
  const admin = await requireAdmin({ masterOnly: true });
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const { id } = params;
  if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

  try {
    await prisma.currentAffair.delete({
      where: { id },
    });

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.admin.id,
        action: "current_affairs_delete",
        details: `${id}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Delete failed or item not found" }, { status: 404 });
  }
}

