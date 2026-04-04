import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || 0;
    const skip = parseInt(searchParams.get("skip")) || 0;
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "default";
    const difficulty = searchParams.get("difficulty") || "all";
    const qCount = searchParams.get("questionCount") || "all";
    const chipsParam = searchParams.get("chips") || "";

    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.isAdmin;

    // Build the "where" clause for Prisma
    let where = {};
    const andConditions = [];

    if (!isAdmin) {
      where.hidden = false;
      // Only top-level categories for home page display if they are requesting paginated lists
      // Handle Prisma MongoDB limitation where missing fields need isSet: false
      if (limit > 0) {
         andConditions.push({
           OR: [
             { parentId: null },
             { parentId: { isSet: false } }
           ]
         });
      }
    }

    if (search) {
      andConditions.push({
        OR: [
          { topic: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ]
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    if (difficulty !== "all") {
      where.questions = {
        some: { difficulty: difficulty },
      };
    }

    if (qCount !== "all") {
      switch (qCount) {
        case "small":
          // Prisma doesn't directly support count in where, 
          // so we'll have to handle it if we want it fully server-side, 
          // but for simplicity, we'll keep it basic for now.
          break;
        case "medium":
          break;
        case "large":
          break;
      }
    }

    if (chipsParam) {
      const activeChips = chipsParam.split(",");
      // Since chips is a stringified JSON array in MongoDB via Prisma, 
      // we'll use "contains" if we can, but string matches are tricky.
      // For now, keep it simple.
    }

    // Determine ordering
    let orderBy = { sortOrder: "asc" };
    if (sortBy === "alphabetical") orderBy = { topic: "asc" };
    if (sortBy === "newest") orderBy = { updatedAt: "desc" };
    if (sortBy === "popular") {
      // popular would normally be based on attempts, but we'll use question count as a proxy
      // since that's what the frontend was doing.
    }

    // Get total count for pagination
    const total = await prisma.category.count({ where });

    // Fetch categories with optional limit and skip
    const categories = await prisma.category.findMany({
      where,
      include: { 
        questions: true 
      },
      orderBy,
      ...(limit > 0 ? { take: limit } : {}),
      ...(skip > 0 ? { skip: skip } : {}),
    });

    console.log(`[API] Fetching ${categories.length} categories (total: ${total})...`);
    
    // Explicitly map all fields to ensure they are returned correctly
    const result = categories.map((cat) => ({
      id: cat.id,
      topic: cat.topic,
      emoji: cat.emoji,
      description: cat.description,
      categoryClass: cat.categoryClass,
      hidden: cat.hidden,
      image: cat.image,
      storyText: cat.storyText,
      storyImage: cat.storyImage,
      originalLang: cat.originalLang,
      isTrending: cat.isTrending,
      chips: safeJsonParse(cat.chips) || [],
      sortOrder: cat.sortOrder,
      parentId: cat.parentId,
      showSubCategoriesOnHome: cat.showSubCategoriesOnHome,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
      questionCount: cat.questions?.length || 0,
      questions: cat.questions.map(q => ({
        ...q,
        options: safeJsonParse(q.options) || []
      })),
    }));
    
    return NextResponse.json({ categories: result, total });
  } catch (error) {
    console.error("Categories GET error:", error);
    // Return empty array on error to prevent breaking frontend
    return NextResponse.json({ categories: [], total: 0 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin || session.user.role !== "master") {
    return NextResponse.json({ error: "Master admin only" }, { status: 403 });
  }

  console.log("[API/categories] POST request received");
  try {
    const body = await request.json();
    console.log("[API/categories] Request body topic:", body.topic);
    const { topic, emoji, description, categoryClass, hidden, image, parentId, showSubCategoriesOnHome, storyText, storyImage, originalLang, isTrending, chips } = body;
    
    if (!topic) {
      console.warn("[API/categories] Missing topic");
      return NextResponse.json({ error: "topic is required" }, { status: 400 });
    }

    const emojiStr = emoji || "";

    const maxSort = await prisma.category.aggregate({ _max: { sortOrder: true } });
    console.log("[API/categories] maxSort:", maxSort._max.sortOrder);

    const category = await prisma.category.create({
      data: {
        topic,
        emoji: emojiStr,
        description: description || "",
        categoryClass: categoryClass || `category-${topic.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`,
        hidden: !!hidden,
        image: image || null,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
        parentId: parentId || null,
        showSubCategoriesOnHome: !!showSubCategoriesOnHome,
        storyText: storyText || null,
        storyImage: storyImage || null,
        originalLang: originalLang || "en",
        isTrending: !!isTrending,
        chips: Array.isArray(chips) ? JSON.stringify(chips) : "[]",
      },
    });
    
    console.log("[API/categories] Category created successfully:", category.id);

    const normalized = {
      ...category,
      chips: safeJsonParse(category.chips) || [],
    };
    return NextResponse.json(normalized, { status: 201 });
  } catch (error) {
    console.error("[API/categories] POST error:", error);
    return NextResponse.json({ error: "Failed to create category: " + error.message }, { status: 500 });
  }
}
