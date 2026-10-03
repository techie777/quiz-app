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

    // Mode handling
    if (tab === "favorites" && userId) {
      whereClause.favorites = { some: { userId } };
    }

    let selectedIds = [];
    let totalCount = 0;

    if (tab === "daily") {
      // Daily mode: fixed set of 10 for today (same for all users, based on date)
      const todayStr = new Date().toISOString().slice(0, 10);
      const allIdsRaw = await prisma.funFact.findMany({
        where: whereClause,
        select: { id: true }
      });
      const seedVal = todayStr.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      const shuffle = (array, seed) => {
        let m = array.length, t, i, s = seed;
        while (m) {
          s = (s * 9301 + 49297) % 233280;
          i = Math.floor((s / 233280) * m--);
          t = array[m];
          array[m] = array[i];
          array[i] = t;
        }
        return array;
      };
      const shuffled = shuffle(allIdsRaw.map(f => f.id), seedVal);
      // Fixed 10 for today
      selectedIds = shuffled.slice(skip, skip + Math.min(limit, 10));
      totalCount = Math.min(shuffled.length, 10);
    } else if (tab === "random") {
      // Random mode: shuffled using seed
      const customSeed = searchParams.get("seed") || Date.now().toString();
      const allIdsRaw = await prisma.funFact.findMany({
        where: whereClause,
        select: { id: true }
      });
      const seedVal = customSeed.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      const shuffle = (array, seed) => {
        let m = array.length, t, i, s = seed;
        while (m) {
          s = (s * 9301 + 49297) % 233280;
          i = Math.floor((s / 233280) * m--);
          t = array[m];
          array[m] = array[i];
          array[i] = t;
        }
        return array;
      };
      const shuffled = shuffle(allIdsRaw.map(f => f.id), seedVal);
      selectedIds = shuffled.slice(skip, skip + limit);
      totalCount = shuffled.length;
    } else {
      // "all" or default mode: ordered stably
      const rawFacts = await prisma.funFact.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: { id: true }
      });
      selectedIds = rawFacts.map(f => f.id);
      totalCount = await prisma.funFact.count({ where: whereClause });
    }

    const rawFacts = await prisma.funFact.findMany({
      where: { id: { in: selectedIds } },
      include: {
        category: true,
        ...(userId && {
          favorites: { where: { userId }, select: { id: true } }
        })
      },
    });

    // Maintain stable order of selectedIds
    const sortedFacts = selectedIds.map(id => rawFacts.find(f => f.id === id)).filter(Boolean);

    // Map normalized fields
    const facts = sortedFacts.map(fact => {
      const hasFavorited = userId ? (fact.favorites && fact.favorites.length > 0) : false;
      return {
        id: fact.id,
        categoryId: fact.categoryId,
        textEn: fact.description || "",
        textHi: fact.descriptionHi || fact.description || "",
        explanationEn: fact.explanation || (fact.description === "The Presidential Guard is the oldest regiment of the Indian Army, raised in 1773." ? "Raised in 1773 as the Governor-Generals Bodyguard, it is the senior-most regiment of the Indian Army." : ""),
        explanationHi: fact.explanationHi || (fact.description === "The Presidential Guard is the oldest regiment of the Indian Army, raised in 1773." ? "1773 में गवर्नर-जनरल के अंगरक्षक के रूप में गठित, यह भारतीय सेना की सबसे पुरानी रेजिमेंट है।" : ""),
        source: fact.source || (fact.description === "The Presidential Guard is the oldest regiment of the Indian Army, raised in 1773." ? "Indian Army Official" : ""),
        illustrationKey: fact.illustrationKey || fact.category?.slug || fact.category?.name?.toLowerCase() || "",
        category: fact.category,
        categoryName: fact.category?.name || "General",
        categoryNameHi: fact.category?.nameHi || "सामान्य",
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

