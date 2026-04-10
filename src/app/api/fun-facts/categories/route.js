import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.funFactCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { facts: true },
        },
      },
    });
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error("Error fetching fun fact categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
