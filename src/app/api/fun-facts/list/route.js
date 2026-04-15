import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryIds = searchParams.get("categories");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const tab = searchParams.get("tab") || "all"; // all, trending, daily, favorites
    const q = searchParams.get("q") || "";
    
    const skip = (page - 1) * limit;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Build Where Clause
    let whereClause = { hidden: false };

    // Search query
    if (q) {
      whereClause.OR = [
        { description: { contains: q, mode: 'insensitive' } },
        { descriptionHi: { contains: q, mode: 'insensitive' } }
      ];
    }

    // Category filter
    if (categoryIds) {
      const catArray = categoryIds.split(",");
      whereClause.categoryId = { in: catArray };
    }

    // Tabs filter
    let orderBy = { createdAt: "desc" };
    if (tab === "daily") {
      whereClause.isDaily = true;
    } else if (tab === "favorites") {
      if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      whereClause.favorites = { some: { userId } };
    } else if (tab === "trending") {
      orderBy = { views: "desc" };
    } else if (tab === "random" || tab === "all") {
      // Both the explicit 'Random' tab AND the default 'All' feed should be thoroughly mixed
      const allIds = await prisma.funFact.findMany({ select: { id: true }, where: whereClause });
      if (allIds.length > 0) {
         const shuffled = allIds.sort(() => 0.5 - Math.random());
         const selectedIds = shuffled.slice(0, limit).map(x => x.id);
         whereClause.id = { in: selectedIds };
      }
    }

    // Backup the pristine unconstrained whereClause to count total accurately
    const countWhereClause = { ...whereClause };
    if (tab === "random" || tab === "all") delete countWhereClause.id;

    const querySkip = (tab === "random" || tab === "all") ? 0 : skip;

    const [rawFacts, totalCount] = await Promise.all([
      prisma.funFact.findMany({
        where: whereClause,
        include: { 
          category: true,
          _count: {
            select: { likes: true, comments: true }
          },
          ...(userId && {
            likes: { where: { userId }, select: { id: true } },
            favorites: { where: { userId }, select: { id: true } }
          })
        },
        orderBy,
        skip: querySkip,
        take: limit,
      }),
      prisma.funFact.count({ where: countWhereClause })
    ]);

    // Map the results to flatten user interaction flags
    const facts = rawFacts.map(fact => {
      const hasLiked = userId ? fact.likes.length > 0 : false;
      const hasFavorited = userId ? fact.favorites.length > 0 : false;
      const { likes, favorites, ...rest } = fact;
      return {
        ...rest,
        hasLiked,
        hasFavorited
      };
    });

    return NextResponse.json({ 
      facts, 
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching fun facts list:", error);
    return NextResponse.json({ error: "Failed to fetch facts list" }, { status: 500 });
  }
}

