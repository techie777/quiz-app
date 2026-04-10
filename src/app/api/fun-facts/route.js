import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const omitFactId = searchParams.get("omitFactId");
    
    const whereClause = {
      hidden: false,
      ...(categoryId && { categoryId }),
      ...(omitFactId && { id: { not: omitFactId } }),
    };

    const count = await prisma.funFact.count({ where: whereClause });
    if (count === 0) {
      // If we fall back because of omitFactId, retry without omit
      if (omitFactId) {
        const anyCount = await prisma.funFact.count({ where: { hidden: false, categoryId: categoryId || undefined } });
        if (anyCount > 0) {
          const skip = Math.floor(Math.random() * anyCount);
          const fact = await prisma.funFact.findFirst({
            where: { hidden: false, categoryId: categoryId || undefined },
            skip,
            include: { category: true }
          });
          return NextResponse.json({ fact }, { status: 200 });
        }
      }
      return NextResponse.json({ fact: null, message: "No facts found" }, { status: 404 });
    }

    const skip = Math.floor(Math.random() * count);
    const fact = await prisma.funFact.findFirst({
      where: whereClause,
      skip,
      include: { category: true }
    });

    if (fact) {
      await prisma.funFact.update({
        where: { id: fact.id },
        data: { views: { increment: 1 } }
      });
    }

    return NextResponse.json({ fact }, { status: 200 });
  } catch (error) {
    console.error("Error fetching fun fact:", error);
    return NextResponse.json({ error: "Failed to fetch fact" }, { status: 500 });
  }
}
