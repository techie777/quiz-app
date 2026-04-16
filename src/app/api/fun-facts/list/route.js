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

    const excludeId = searchParams.get("excludeId");
    const excludeImg = searchParams.get("excludeImg") === "true";

    // Build Where Clause
    let whereClause = { hidden: false };
    if (excludeId) whereClause.id = { not: excludeId };

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

    // Determine sort for text-based fallback
    let orderBy = { createdAt: "desc" };
    if (tab === "trending") orderBy = { views: "desc" };

    // STABLE RANDOM SHUFFLE: Use a seed for shuffling. 
    const { searchParams: sParams } = new URL(request.url);
    const customSeed = sParams.get("seed");
    const activeSeed = customSeed || new Date().toISOString().slice(0, 13);
    
    // Fetch all non-hidden IDs
    const allIdsRaw = await prisma.funFact.findMany({
      where: whereClause,
      select: { id: true, categoryId: true }
    });

    // Helper to generate seeded random number
    const seededRandom = (seedStr) => {
        let hash = 0;
        for (let i = 0; i < seedStr.length; i++) {
            hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
            hash |= 0;
        }
        // Pseudo-random generator based on hash
        const x = Math.sin(hash++) * 10000;
        return x - Math.floor(x);
    };

    // Global Seeded Fisher-Yates Shuffle
    let combinedIds = allIdsRaw.map(f => f.id);
    const seedVal = activeSeed.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    
    const shuffle = (array, seed) => {
        let m = array.length, t, i;
        let s = seed;
        while (m) {
            // LCG based shuffle
            s = (s * 9301 + 49297) % 233280;
            i = Math.floor((s / 233280) * m--);
            t = array[m];
            array[m] = array[i];
            array[i] = t;
        }
        return array;
    };

    combinedIds = shuffle(combinedIds, seedVal);

    // Apply pagination
    const selectedIds = combinedIds.slice(skip, skip + limit);
    const totalCount = combinedIds.length;
    
    // Restore the final filter for the paginated fetch
    const finalWhere = { id: { in: selectedIds } };

    const rawFacts = await prisma.funFact.findMany({
      where: finalWhere,
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
    });

    // CRITICAL: Prisma does not maintain order of 'in' clause, so we sort manually here
    const sortedFacts = selectedIds.map(id => rawFacts.find(f => f.id === id)).filter(Boolean);

    // Map the results to flatten user interaction flags
    const facts = sortedFacts.map(fact => {
      const hasLiked = userId ? fact.likes.length > 0 : false;
      const hasFavorited = userId ? fact.favorites.length > 0 : false;
      const { likes, favorites, ...rest } = fact;
      return {
        ...rest,
        hasLiked,
        hasFavorited
      };
    });

    return new Response(JSON.stringify({
      facts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error("Error fetching fun facts list:", error);
    return NextResponse.json({ error: "Failed to fetch facts list" }, { status: 500 });
  }
}

