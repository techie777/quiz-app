import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    
    const skip = (page - 1) * limit;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Build Where Clause
    let whereClause = { hidden: false };
    if (categoryId && categoryId !== 'all') {
      whereClause.categoryId = categoryId;
    }

    const [questions, totalCount] = await Promise.all([
      prisma.trueFalseQuestion.findMany({
        where: whereClause,
        include: {
          category: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.trueFalseQuestion.count({ where: whereClause })
    ]);

    return NextResponse.json({
      questions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching true/false list:", error);
    return NextResponse.json({ error: "Failed to fetch questions list" }, { status: 500 });
  }
}
