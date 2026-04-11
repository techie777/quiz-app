import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const categories = await prisma.trueFalseCategory.findMany({
      where: { hidden: false },
      include: {
        _count: {
          select: {
            questions: {
              where: { hidden: false }
            }
          }
        }
      },
      orderBy: { sortOrder: "asc" }
    });

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error("True/False categories GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
