import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: { questions: true },
      orderBy: { sortOrder: "asc" },
    });
    
    console.log(`[API] Fetching ${categories.length} categories...`);
    if (categories.length > 0) {
      console.log(`[API] Sample storyText for ${categories[0].topic}:`, categories[0].storyText ? "Present" : "Missing");
    }
    
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
      questions: cat.questions.map((q) => ({
        id: q.id,
        text: q.text,
        options: safeJsonParse(q.options),
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty,
        image: q.image,
        categoryId: q.categoryId,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      })),
    }));
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Categories GET error:", error);
    
    // Fallback data when database is unavailable
    const fallbackCategories = [
      {
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
      {
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
      {
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
      {
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
      {
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
    ];
    
    console.log("[API] Returning fallback categories due to database error");
    return NextResponse.json(fallbackCategories);
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
    
    if (!topic || !emoji) {
      console.warn("[API/categories] Missing topic or emoji");
      return NextResponse.json({ error: "topic and emoji are required" }, { status: 400 });
    }

    const maxSort = await prisma.category.aggregate({ _max: { sortOrder: true } });
    console.log("[API/categories] maxSort:", maxSort._max.sortOrder);

    const category = await prisma.category.create({
      data: {
        topic,
        emoji,
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
