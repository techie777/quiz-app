import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const { orderedIds } = await request.json();
  // Update sortOrder for each category
  const updates = orderedIds.map((id, index) =>
    prisma.category.update({ where: { id }, data: { sortOrder: index } })
  );
  await prisma.$transaction(updates);
  return NextResponse.json({ success: true });
}
