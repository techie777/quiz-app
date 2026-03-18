import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin || session.user.role !== "master") {
    return NextResponse.json({ error: "Master admin only" }, { status: 403 });
  }

  const { orderedIds } = await request.json();
  // Update sortOrder for each category
  const updates = orderedIds.map((id, index) =>
    prisma.category.update({ where: { id }, data: { sortOrder: index } })
  );
  await prisma.$transaction(updates);
  return NextResponse.json({ success: true });
}
