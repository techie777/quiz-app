import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryIds = searchParams.get("categories") || searchParams.get("categoryId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    
    const tab = searchParams.get("tab") || "all";
    const q = searchParams.get("q") || "";

    const skip = (page - 1) * limit;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Build Where Clause
    let whereClause = { hidden: false };
    if (categoryIds && categoryIds !== 'all') {
      const catArray = categoryIds.split(",").map(c => c.trim()).filter(Boolean);
      if (catArray.length === 1) {
        whereClause.categoryId = catArray[0];
      } else if (catArray.length > 1) {
        whereClause.categoryId = { in: catArray };
      }
    }
    if (q) {
      whereClause.OR = [
        { statement: { contains: q, mode: 'insensitive' } },
        { statementHi: { contains: q, mode: 'insensitive' } }
      ];
    }

    let selectedIds = [];
    let totalCount = 0;

    if (tab === "daily") {
      // Daily mode: fixed set of 10 for today (same for all users, based on date)
      const todayStr = new Date().toISOString().slice(0, 10);
      const allIdsRaw = await prisma.trueFalseQuestion.findMany({
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
      const allIdsRaw = await prisma.trueFalseQuestion.findMany({
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
      // "all" or default mode
      const rawQuestions = await prisma.trueFalseQuestion.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: { id: true }
      });
      selectedIds = rawQuestions.map(f => f.id);
      totalCount = await prisma.trueFalseQuestion.count({ where: whereClause });
    }

    const rawList = await prisma.trueFalseQuestion.findMany({
      where: { id: { in: selectedIds } },
      include: {
        category: true,
      }
    });

    const sortedList = selectedIds.map(id => rawList.find(q => q.id === id)).filter(Boolean);

    const questions = sortedList.map(q => ({
      id: q.id,
      categoryId: q.categoryId,
      statementEn: q.statement || "",
      statementHi: q.statementHi || q.statement || "",
      answer: q.correctAnswer,
      correctAnswer: q.correctAnswer,
      explanationEn: q.explanation || "",
      explanationHi: q.explanationHi || "",
      illustrationKey: q.illustrationKey || q.category?.slug || q.category?.name?.toLowerCase() || "",
      category: q.category,
      categoryName: q.category?.name || "General",
      categoryNameHi: q.category?.nameHi || "सामान्य",
    }));

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
