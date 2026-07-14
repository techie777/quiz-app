import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const groups = await prisma.forumGroup.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { topics: { where: { isHidden: false } } }
        }
      }
    });
    return NextResponse.json(groups);
  } catch (error) {
    console.error("Forum Groups Error:", error);
    return NextResponse.json({ error: "Failed to load groups" }, { status: 500 });
  }
}
