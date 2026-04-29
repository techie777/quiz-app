import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { safeJsonParse } from "@/lib/utils";
import { requireAdmin, getAdminFromRequest } from "@/lib/adminSessionServer";
import { enforceRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const rl = enforceRateLimit(rateLimitKey(request, "api:categories:get"), { windowMs: 60_000, max: 120 });
    if (!rl.ok) return rateLimitResponse(rl.retryAfterSeconds);

    const { searchParams } = new URL(request.url);
    const limitRaw = parseInt(searchParams.get("limit")) || 0;
    const skip = Math.max(parseInt(searchParams.get("skip")) || 0, 0);
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "default";
    const difficulty = searchParams.get("difficulty") || "all";
    const qCount = searchParams.get("questionCount") || "all";
    const chipsParam = searchParams.get("chips") || "";
    const personalized = searchParams.get("personalized") === "true";
    const showAll = searchParams.get("showAll") === "true";

    const admin = await getAdminFromRequest();
    const isAdmin = !!admin;

    let userInterests = [];
    if (personalized && !isAdmin) {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { interestedCategories: true }
        });
        userInterests = user?.interestedCategories || [];
      }
    }


    // Build the "where" clause for Prisma
    let where = {};
    const andConditions = [];

    // Admin view should still permit filtering by id and parentId.
    const parentIdParam = searchParams.get("parentId");
    const idParam = searchParams.get("id");

    if (idParam) {
      andConditions.push({ id: idParam });
    } else if (parentIdParam) {
      andConditions.push({ parentId: parentIdParam });
    }

    if (!isAdmin) {
      where.hidden = false;
      
      // If no specific parent or ID is requested, only show top-level categories
      // Unless we are in personalized mode or 'showAll' is requested
      if (!idParam && !parentIdParam && limitRaw > 0 && !personalized && !showAll) {
        andConditions.push({
          OR: [
            { parentId: null },
            { parentId: { isSet: false } },
            { showSubCategoriesOnHome: true }
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

    if (chipsParam) {
      const activeChips = chipsParam
        .split(",")
        .map((c) => String(c || "").trim())
        .filter(Boolean);
      if (activeChips.length > 0) {
        // `chips` is stored as a JSON string in Mongo; match `"ChipName"` to reduce false positives.
        andConditions.push({
          OR: activeChips.map((chip) => ({
            chips: { contains: `"${chip}"`, mode: "insensitive" },
          })),
        });
      }
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    if (personalized) {
      if (userInterests.length > 0) {
        where.id = { in: userInterests };
      } else {
        // Return nothing if personalized is requested but no interests are set
        where.id = { in: ["_none_"] }; 
      }
    }



    if (difficulty !== "all") {
      where.questions = {
        some: { difficulty: difficulty },
      };
    }

    // Determine ordering
    let orderBy = [];
    if (sortBy === "alphabetical") {
      orderBy = [{ topic: "asc" }, { sortOrder: "asc" }, { id: "asc" }];
    } else if (sortBy === "newest") {
      orderBy = [{ updatedAt: "desc" }, { sortOrder: "asc" }, { id: "asc" }];
    } else {
      // Default: sortOrder ASC, with topic and ID as stable fallbacks
      orderBy = [{ sortOrder: "asc" }, { topic: "asc" }, { id: "asc" }];
    }

    const needsInMemoryFilteringOrSorting = qCount !== "all" || sortBy === "popular";
    const limit = limitRaw > 0 ? Math.min(limitRaw, 60) : 0;

    const includeQuestions = searchParams.get("full") === "true";

    // Fetch categories
    const categories = await prisma.category.findMany({
      where,
      include: {
        _count: {
          select: { questions: true }
        },
        subCategories: {
          select: {
            _count: {
              select: { questions: true }
            }
          }
        },
        ...(includeQuestions ? { questions: true } : {})
      },
      orderBy,
      ...(needsInMemoryFilteringOrSorting || limit === 0 ? {} : (limit > 0 ? { take: limit } : {})),
      ...(needsInMemoryFilteringOrSorting || limit === 0 ? {} : (skip > 0 ? { skip: skip } : {})),
    });

    let filteredCategories = categories;

    // Question count filter (in-memory; Prisma Mongo relation count filters are limited)
    if (qCount !== "all") {
      filteredCategories = filteredCategories.filter((cat) => {
        const count = cat._count?.questions || 0;
        if (qCount === "small") return count >= 1 && count <= 10;
        if (qCount === "medium") return count >= 11 && count <= 25;
        if (qCount === "large") return count >= 26;
        return true;
      });
    }

    // "Popular" sort (proxy: more questions => more content)
    if (sortBy === "popular") {
      filteredCategories = [...filteredCategories].sort((a, b) => {
        const ac = a._count?.questions || 0;
        const bc = b._count?.questions || 0;
        if (bc !== ac) return bc - ac;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      });
    }

    const total = needsInMemoryFilteringOrSorting
      ? filteredCategories.length
      : await prisma.category.count({ where });

    // Apply pagination after in-memory filters when needed
    const paginatedCategories =
      needsInMemoryFilteringOrSorting && limit > 0
        ? filteredCategories.slice(skip, skip + limit)
        : filteredCategories;

    console.log(`[API] Fetching ${paginatedCategories.length} categories (total: ${total})...`);
    
    // Fetch difficulty breakdowns for the paginated set
    const categoryIds = paginatedCategories.map(c => c.id);
    const difficultyGroups = await prisma.question.groupBy({
      by: ['categoryId', 'difficulty'],
      where: { categoryId: { in: categoryIds } },
      _count: true
    });

    const difficultyMap = {};
    difficultyGroups.forEach(group => {
      if (!difficultyMap[group.categoryId]) {
        difficultyMap[group.categoryId] = { easy: 0, medium: 0, hard: 0 };
      }
      const diff = group.difficulty?.toLowerCase() || 'easy';
      if (difficultyMap[group.categoryId].hasOwnProperty(diff)) {
        difficultyMap[group.categoryId][diff] = group._count;
      }
    });

    // Explicitly map all fields to ensure they are returned correctly
    const result = paginatedCategories.map((cat) => ({
      id: cat.id,
      topic: cat.topic,
      topicHi: cat.topicHi,
      slug: cat.slug,
      emoji: cat.emoji,
      description: cat.description,
      descriptionHi: cat.descriptionHi,
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
      questionCount: (cat._count?.questions || 0) + (cat.subCategories?.reduce((acc, sub) => acc + (sub._count?.questions || 0), 0) || 0),
      difficultyStats: difficultyMap[cat.id] || { easy: 0, medium: 0, hard: 0 },
      questions: includeQuestions ? (cat.questions || []).map(q => ({
        ...q,
        options: safeJsonParse(q.options) || []
      })) : [],
    }));
    
    return NextResponse.json({ categories: result, total });
  } catch (error) {
    console.error("Categories GET error:", error);
    // Return empty array on error to prevent breaking frontend
    return NextResponse.json({ categories: [], total: 0 });
  }
}

export async function POST(request) {
  const adminCheck = await requireAdmin({ masterOnly: true });
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
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

    const slug = body.slug || topic.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

    const category = await prisma.category.create({
      data: {
        topic,
        slug,
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
