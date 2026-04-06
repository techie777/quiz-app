import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function normalizeString(v) {
  return String(v || "").trim();
}

function requireMaster(session) {
  return !!session?.user?.isAdmin && session.user.role === "master";
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!requireMaster(session)) {
    return NextResponse.json({ error: "Master admin only" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const date = normalizeString(body?.date);
  const category = normalizeString(body?.category) || "General";
  const items = body?.items;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "No items provided" }, { status: 400 });
  }

  const createdItems = [];
  const errors = [];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const heading = normalizeString(it.heading);
    const description = normalizeString(it.description);

    if (!heading || !description) {
      errors.push(`Row ${i + 1}: Heading and Description are required`);
      continue;
    }

    try {
      const newItem = await prisma.currentAffair.create({
        data: {
          date,
          category,
          heading,
          description,
          hidden: false,
        },
      });
      createdItems.push(newItem);
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err.message}`);
    }
  }

  await prisma.adminActivityLog.create({
    data: {
      adminId: session.user.adminId,
      action: "current_affairs_bulk_upload",
      details: `Uploaded ${createdItems.length} items for ${date} in ${category}`,
    },
  });

  return NextResponse.json({
    success: true,
    count: createdItems.length,
    errors: errors.length > 0 ? errors : null,
  });
}
