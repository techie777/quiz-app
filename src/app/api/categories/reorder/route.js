import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminSessionServer";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const adminCheck = await requireAdmin({ masterOnly: true });
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  const { orderedIds } = await request.json();
  // Update sortOrder for each category
  const updates = orderedIds.map((id, index) =>
    prisma.category.update({ where: { id }, data: { sortOrder: index } })
  );
  await prisma.$transaction(updates);
  if (globalThis.__CATEGORY_CACHE__) globalThis.__CATEGORY_CACHE__.clear();
  if (globalThis.__ADMIN_SETS_CACHE__) globalThis.__ADMIN_SETS_CACHE__.clear();
  return NextResponse.json({ success: true });
}
