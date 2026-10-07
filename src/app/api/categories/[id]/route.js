import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";
import { requireAdmin } from "@/lib/adminSessionServer";

export const dynamic = "force-dynamic";

import { getMainCategoryBySlug } from "@/lib/mainCategoriesConfig";
import { getCategoryGroup, getCategoryCardImageUrl } from "@/lib/categoryCardImages";

// In-memory cache for category data (TTL: 120s for ultra-fast sub-millisecond responses)
const SERVER_CATEGORY_CACHE = globalThis.__CATEGORY_CACHE__ || (globalThis.__CATEGORY_CACHE__ = new Map());
const CACHE_TTL_MS = 15 * 1000;

export async function GET(request, { params }) {
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const metaOnly = searchParams.get("metaOnly") === "true";
  const refresh = searchParams.get("refresh") === "true";
  const cacheKey = `${id}:${metaOnly}`;

  // Serve from cache if fresh (< 15s) and not explicit refresh
  const cached = SERVER_CATEGORY_CACHE.get(cacheKey);
  if (!refresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Cache": "HIT",
      },
    });
  }
  
  try {
    let db = null;
    let ObjectId = null;
    try {
      const mongoModule = await import("@/lib/mongoDb");
      const mongoDriver = await import("mongodb");
      db = await mongoModule.getDb();
      ObjectId = mongoDriver.ObjectId;
    } catch (dbErr) {
      console.warn("Native Mongo driver unavailable, using Prisma:", dbErr.message);
    }

    // Determine if we should search by ID or Slug
    const isObjectId = id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
    const catObjId = (isObjectId && ObjectId) ? new ObjectId(id) : null;
    
    // Resolve any potential database aliases for canonical categories
    const candidateSlugs = [id];
    if (id === "indian-history") candidateSlugs.push("india-history", "history-gk", "history");
    if (id === "indian-geography") candidateSlugs.push("india-geography");
    if (id === "indian-kingdoms") candidateSlugs.push("indian-kingdom-gk", "gulam-vansh");
    if (id === "human-body") candidateSlugs.push("biology-gk", "life-sciences-biology");
    if (id === "amazing-facts") candidateSlugs.push("fun-viral-quiz", "static-gk-trivia");
    if (id === "animals-nature") candidateSlugs.push("animals-wildlife", "animals-birds");
    if (id === "business-economy") candidateSlugs.push("money-business", "economy-gk");
    if (id === "reasoning-brain-games") candidateSlugs.push("brain-riddles", "logical-analytical-reasoning");
    if (id === "space-astronomy") candidateSlugs.push("space-universe");
    if (id === "food-cuisine") candidateSlugs.push("food");
    if (id === "indian-states-uts") candidateSlugs.push("indian-states-gk");
    if (id === "religion-spirituality") candidateSlugs.push("religious-gk");
    if (id === "science") candidateSlugs.push("general-science", "physics-gk", "chemistry-gk");

    let category = await prisma.category.findFirst({
      where: isObjectId 
        ? { OR: [{ id }, { slug: { in: candidateSlugs } }] } 
        : { slug: { in: candidateSlugs } },
      include: { 
        questions: metaOnly ? { select: { id: true } } : true 
      },
    });

    // Native MongoDB fallback if Prisma did not find category
    if (!category && db) {
      const normalizedTopic = id.replace(/-/g, ' ');
      const rawCat = await db.collection("Category").findOne({
        $or: [
          ...(catObjId ? [{ _id: catObjId }] : []),
          { slug: id },
          { slug: id.toLowerCase() },
          { topic: { $regex: new RegExp(`^${normalizedTopic}$`, 'i') } },
        ]
      });
      if (rawCat) {
        category = {
          ...rawCat,
          id: rawCat._id.toString(),
        };
      }
    }
    
    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    let subCategories = await prisma.category.findMany({
      where: { parentId: category.id, hidden: false },
      orderBy: { sortOrder: "asc" }
    });

    const activeCatObjId = (ObjectId && ObjectId.isValid(category.id)) ? new ObjectId(category.id) : null;

    // If Prisma found none or partial, also check MongoDB natively with ObjectId and String
    if (subCategories.length === 0 && db) {
      const rawSubs = await db.collection("Category").find({
        $or: [
          { parentId: category.id },
          ...(activeCatObjId ? [{ parentId: activeCatObjId }] : []),
        ],
        hidden: { $ne: true }
      }).sort({ sortOrder: 1, sort_order: 1, topic: 1 }).toArray();

      if (rawSubs.length > 0) {
        subCategories = rawSubs.map(s => ({
          ...s,
          id: s._id.toString(),
        }));
      }
    }

    let allQuestions = [];
    let totalQuestionCount = 0;

    const subCatObjIds = (ObjectId ? subCategories.map(sc => (ObjectId.isValid(sc.id) ? new ObjectId(sc.id) : null)).filter(Boolean) : []);
    const allTargetIds = [
      activeCatObjId,
      category.id,
      ...subCatObjIds,
      ...subCategories.map(sc => sc.id)
    ].filter(Boolean);

    const matchQuery = {
      $or: [
        { categoryId: { $in: allTargetIds } },
        { category_id: { $in: allTargetIds } },
      ]
    };

    if (db) {
      if (metaOnly) {
        totalQuestionCount = await db.collection("Question").countDocuments(matchQuery);
      } else {
        const rawQs = await db.collection("Question").find(matchQuery, {
          projection: {
            _id: 1,
            text: 1,
            text_en: 1,
            text_hi: 1,
            textHi: 1,
            options: 1,
            options_list: 1,
            optionsHi: 1,
            correctAnswer: 1,
            correct: 1,
            correct_index: 1,
            difficulty: 1,
            difficulty_level: 1,
            tags: 1,
            topic: 1,
            topicName: 1,
            subCategory: 1,
            subject: 1,
            subjectName: 1,
            explanation: 1,
            explanation_hi: 1,
            explanationHi: 1,
            hindiExplanation: 1,
            explanation_en: 1,
            explanationEn: 1,
            englishExplanation: 1,
            language: 1,
            createdAt: 1,
          }
        }).toArray();

        allQuestions = rawQs.map(q => {
        let opts = [];
        if (Array.isArray(q.options_list) && q.options_list.length > 0) {
          opts = q.options_list;
        } else if (Array.isArray(q.options)) {
          opts = q.options;
        } else if (typeof q.options === 'string') {
          opts = safeJsonParse(q.options) || [];
        }

        let optsHi = [];
        if (Array.isArray(q.optionsHi)) {
          optsHi = q.optionsHi;
        } else if (typeof q.optionsHi === 'string') {
          optsHi = safeJsonParse(q.optionsHi) || [];
        }

        const correctIdx = typeof q.correct === 'number'
          ? q.correct
          : (typeof q.correct_index === 'number' ? q.correct_index : 0);

        const hindiExp = q.hindiExplanation || q.explanationHi || q.explanation_hi || (q.explanation && /[\u0900-\u097F]/.test(q.explanation) ? q.explanation : "") || "";
        const englishExp = q.englishExplanation || q.explanationEn || q.explanation_en || (!/[\u0900-\u097F]/.test(q.explanation || "") ? q.explanation : "") || "";
        const defaultExp = q.explanation || hindiExp || englishExp || "";

        return {
          id: q._id.toString(),
          _id: q._id.toString(),
          text: q.text || q.text_en || "",
          textHi: q.textHi || q.text_hi || null,
          options: opts,
          optionsHi: optsHi,
          correctAnswer: q.correctAnswer || (opts[correctIdx] || ""),
          correct: correctIdx,
          correctIndex: correctIdx,
          correct_index: correctIdx,
          difficulty: q.difficulty || (q.difficulty_level === 3 ? "hard" : q.difficulty_level === 2 ? "medium" : "easy"),
          tags: Array.isArray(q.tags) ? q.tags : [],
          topic: q.topic || q.topicName || "",
          subCategory: q.subCategory || q.subject || q.subjectName || "",
          explanation: defaultExp,
          explanationHi: hindiExp || defaultExp,
          explanation_hi: hindiExp || defaultExp,
          hindiExplanation: hindiExp || defaultExp,
          explanationEn: englishExp || defaultExp,
          explanation_en: englishExp || defaultExp,
          englishExplanation: englishExp || defaultExp,
          language: q.language || (hindiExp ? "hi" : "en"),
          createdAt: q.createdAt || null,
        };
      });

        totalQuestionCount = allQuestions.length;
      }
    } else {
      // Robust Prisma fallback
      const targetCatIdsStr = allTargetIds.map(id => id ? id.toString() : "").filter(Boolean);
      const rawQs = await prisma.question.findMany({
        where: {
          categoryId: { in: targetCatIdsStr },
        },
      });
      allQuestions = rawQs.map(q => ({
        id: q.id,
        text: q.text || "",
        textHi: q.textHi || null,
        options: safeJsonParse(q.options) || [],
        optionsHi: safeJsonParse(q.optionsHi) || [],
        correctAnswer: q.correctAnswer || "",
        correct: 0,
        difficulty: q.difficulty || "easy",
        tags: Array.isArray(q.tags) ? q.tags : [],
        topic: q.topic || "",
        subCategory: q.subCategory || "",
        explanation: q.explanation || q.explanationHi || "",
        explanationHi: q.explanationHi || q.explanation || "",
        explanation_hi: q.explanationHi || q.explanation || "",
        hindiExplanation: q.explanationHi || q.explanation || "",
        createdAt: q.createdAt || null,
      }));
      totalQuestionCount = allQuestions.length;
    }

    // Fetch persisted QuizSet documents for this category if native db is available
    let quizSets = [];
    if (db) {
      try {
        const allTargetIdsStr = allTargetIds.map(id => id ? id.toString() : "").filter(Boolean);
        const rawSets = await db.collection("QuizSet").find(
          {
            $or: [
              { categoryId: { $in: allTargetIds } },
              { categoryId: { $in: allTargetIdsStr } },
              { category_id: { $in: allTargetIds } },
              { category_id: { $in: allTargetIdsStr } },
              { topicId: { $in: allTargetIds } },
              { topicId: { $in: allTargetIdsStr } },
              { topic_id: { $in: allTargetIds } },
              { topic_id: { $in: allTargetIdsStr } },
            ]
          },
          {
            projection: {
              _id: 1,
              setIndex: 1,
              title: 1,
              titleHi: 1,
              status: 1,
              createdAt: 1,
              updatedAt: 1,
            }
          }
        ).sort({ setIndex: 1 }).toArray();

        quizSets = rawSets.map(s => ({
          id: s._id.toString(),
          setIndex: s.setIndex,
          title: s.title,
          titleHi: s.titleHi,
          status: s.status,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        }));
      } catch (setErr) {
        console.warn("Could not load QuizSet metadata:", setErr.message);
      }
    }

    const mainCategoryConfig = getMainCategoryBySlug(category.slug);
    const subCatCount = subCategories.length;
    let computedTopicsCount = 0;
    if (subCatCount > 0) {
      const totalChipsCount = subCategories.reduce((acc, sc) => {
        const chips = safeJsonParse(sc.chips) || [];
        return acc + (chips.length > 0 ? chips.length : 10);
      }, 0);
      computedTopicsCount = totalChipsCount;
    } else if (totalQuestionCount > 0) {
      computedTopicsCount = Math.max(1, Math.min(100, Math.ceil(totalQuestionCount / 10) * 10));
    } else {
      computedTopicsCount = 0;
    }

    const currentStatus = category.status || (totalQuestionCount > 0 ? "live" : "coming_soon");
    const currentGroup = category.group || getCategoryGroup(category.slug);
    const imageUrl = category.image_url || category.image || getCategoryCardImageUrl(category);
    
    const responseData = {
      ...category,
      image_url: imageUrl,
      group: currentGroup,
      status: currentStatus,
      sort_order: category.sort_order ?? category.sortOrder ?? 0,
      topics_count: computedTopicsCount,
      questionCount: totalQuestionCount,
      mainCategoryConfig: mainCategoryConfig || null,
      questions: allQuestions,
      quizSets,
      subCategories: subCategories.map(sc => ({
        ...sc,
        chips: safeJsonParse(sc.chips) || []
      })),
    };

    // Cache the processed lightweight response
    SERVER_CATEGORY_CACHE.set(cacheKey, { data: responseData, timestamp: Date.now() });

    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("Category GET error:", error);
    
    // Fallback category data when database is unavailable
    const fallbackCategories = {
      "fallback-1": {
        id: "fallback-1",
        topic: "Science",
        emoji: "🔬",
        description: "Test your knowledge of physics, chemistry, biology, and more!",
        categoryClass: "category-science",
        hidden: false,
        image: null,
        storyText: null,
        storyImage: null,
        originalLang: "en",
        isTrending: true,
        chips: ["Science", "Education"],
        sortOrder: 1,
        parentId: null,
        showSubCategoriesOnHome: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        questions: [
          {
            id: "q1",
            text: "What is the chemical symbol for water?",
            options: ["H2O", "CO2", "O2", "N2"],
            correctAnswer: "H2O",
            difficulty: "easy",
            image: null,
            categoryId: "fallback-1",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "q2", 
            text: "What planet is known as the Red Planet?",
            options: ["Earth", "Mars", "Jupiter", "Venus"],
            correctAnswer: "Mars",
            difficulty: "easy",
            image: null,
            categoryId: "fallback-1",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ]
      },
      "fallback-2": {
        id: "fallback-2",
        topic: "History",
        emoji: "📚",
        description: "Explore historical events, famous personalities, and ancient civilizations!",
        categoryClass: "category-history",
        hidden: false,
        image: null,
        storyText: null,
        storyImage: null,
        originalLang: "en",
        isTrending: false,
        chips: ["History", "Education"],
        sortOrder: 2,
        parentId: null,
        showSubCategoriesOnHome: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        questions: [
          {
            id: "q3",
            text: "In which year did World War II end?",
            options: ["1943", "1944", "1945", "1946"],
            correctAnswer: "1945",
            difficulty: "medium",
            image: null,
            categoryId: "fallback-2",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ]
      },
      "fallback-3": {
        id: "fallback-3",
        topic: "General Knowledge",
        emoji: "🧠",
        description: "Challenge yourself with questions from various fields!",
        categoryClass: "category-gk",
        hidden: false,
        image: null,
        storyText: null,
        storyImage: null,
        originalLang: "en",
        isTrending: true,
        chips: ["GK", "Quick 5 Min"],
        sortOrder: 3,
        parentId: null,
        showSubCategoriesOnHome: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        questions: [
          {
            id: "q4",
            text: "What is the capital of France?",
            options: ["London", "Berlin", "Paris", "Madrid"],
            correctAnswer: "Paris",
            difficulty: "easy",
            image: null,
            categoryId: "fallback-3",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ]
      },
      "fallback-4": {
        id: "fallback-4",
        topic: "Mathematics",
        emoji: "🔢",
        description: "Test your mathematical skills with arithmetic, algebra, and geometry!",
        categoryClass: "category-math",
        hidden: false,
        image: null,
        storyText: null,
        storyImage: null,
        originalLang: "en",
        isTrending: false,
        chips: ["Math", "Education"],
        sortOrder: 4,
        parentId: null,
        showSubCategoriesOnHome: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        questions: [
          {
            id: "q5",
            text: "What is 15 × 8?",
            options: ["120", "125", "130", "135"],
            correctAnswer: "120",
            difficulty: "easy",
            image: null,
            categoryId: "fallback-4",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ]
      },
      "fallback-5": {
        id: "fallback-5",
        topic: "Sports",
        emoji: "⚽",
        description: "Questions about various sports, athletes, and sporting events!",
        categoryClass: "category-sports",
        hidden: false,
        image: null,
        storyText: null,
        storyImage: null,
        originalLang: "en",
        isTrending: false,
        chips: ["Sports", "Quick 5 Min"],
        sortOrder: 5,
        parentId: null,
        showSubCategoriesOnHome: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        questions: [
          {
            id: "q6",
            text: "How many players are on a standard soccer team?",
            options: ["9", "10", "11", "12"],
            correctAnswer: "11",
            difficulty: "easy",
            image: null,
            categoryId: "fallback-5",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ]
      }
    };
    
    const fallbackCategory = fallbackCategories[id];
    if (fallbackCategory) {
      console.log(`[API] Returning fallback category ${id} due to database error`);
      return NextResponse.json(fallbackCategory);
    }
    
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PUT(request, { params }) {
  const adminCheck = await requireAdmin({ masterOnly: true });
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  const { id } = params;
  const body = await request.json();
  
  console.log('PUT request body:', body);
  
  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(body.topic !== undefined && { topic: body.topic }),
      ...(body.topicHi !== undefined && { topicHi: body.topicHi }),
      ...(body.slug !== undefined && { slug: body.slug }),
      ...(body.emoji !== undefined && { emoji: body.emoji }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.descriptionHi !== undefined && { descriptionHi: body.descriptionHi }),
      ...(body.categoryClass !== undefined && { categoryClass: body.categoryClass }),
      ...(body.hidden !== undefined && { hidden: body.hidden }),
      ...(body.image !== undefined && { image: body.image || null }),
      ...((body.image_url !== undefined || body.imageUrl !== undefined) && { image_url: body.image_url || body.imageUrl || null }),
      ...(body.group !== undefined && { group: body.group }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.sort_order !== undefined && { sort_order: Number(body.sort_order), sortOrder: Number(body.sort_order) }),
      ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder), sort_order: Number(body.sortOrder) }),
      ...(body.parentId !== undefined && { parentId: body.parentId || null }),
      ...(body.showSubCategoriesOnHome !== undefined && { showSubCategoriesOnHome: !!body.showSubCategoriesOnHome }),
      ...(body.storyText !== undefined && { storyText: body.storyText || null }),
      ...(body.storyImage !== undefined && { storyImage: body.storyImage || null }),
      ...(body.originalLang !== undefined && { originalLang: body.originalLang || "en" }),
      ...(body.isTrending !== undefined && { isTrending: !!body.isTrending }),
      ...(body.chips !== undefined && { chips: Array.isArray(body.chips) ? JSON.stringify(body.chips) : "[]" }),
    },
  });
  
  // Invalidate in-memory caches across the server immediately
  if (globalThis.__CATEGORY_CACHE__) globalThis.__CATEGORY_CACHE__.clear();
  if (globalThis.__ADMIN_SETS_CACHE__) globalThis.__ADMIN_SETS_CACHE__.clear();

  return NextResponse.json({
    ...category,
    image_url: category.image_url || category.image || getCategoryCardImageUrl(category),
    group: category.group || getCategoryGroup(category.slug),
    status: category.status || "coming_soon",
    sort_order: category.sort_order ?? category.sortOrder ?? 0,
    chips: safeJsonParse(category.chips) || [],
  });
}

export async function DELETE(request, { params }) {
  const adminCheck = await requireAdmin({ masterOnly: true });
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  const { id } = params;
  
  // Cascade delete all favorites for questions in this category
  await prisma.favourite.deleteMany({
    where: {
      question: {
        categoryId: id
      }
    }
  });

  // Cascade delete questions first
  await prisma.question.deleteMany({ where: { categoryId: id } });
  
  // Delete the category
  await prisma.category.delete({ where: { id } });

  // Invalidate in-memory caches across the server immediately
  if (globalThis.__CATEGORY_CACHE__) globalThis.__CATEGORY_CACHE__.clear();
  if (globalThis.__ADMIN_SETS_CACHE__) globalThis.__ADMIN_SETS_CACHE__.clear();

  return NextResponse.json({ success: true });
}
