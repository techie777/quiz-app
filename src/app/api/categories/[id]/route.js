import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";
import { requireAdmin } from "@/lib/adminSessionServer";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const metaOnly = searchParams.get("metaOnly") === "true";
  
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { 
        questions: metaOnly ? { select: { id: true } } : true 
      },
    });
    
    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    const subCategories = await prisma.category.findMany({
      where: { parentId: id, hidden: false },
      orderBy: { sortOrder: "asc" }
    });
    
    const responseData = {
      ...category,
      questionCount: category.questions.length,
      questions: metaOnly 
        ? [] // Return empty if metaOnly, we already have the count
        : category.questions.map((q) => ({ ...q, options: safeJsonParse(q.options) })),
      subCategories: subCategories.map(sc => ({
        ...sc,
        chips: safeJsonParse(sc.chips) || []
      })),
    };

    return NextResponse.json(responseData);
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
      ...(body.emoji !== undefined && { emoji: body.emoji }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.categoryClass !== undefined && { categoryClass: body.categoryClass }),
      ...(body.hidden !== undefined && { hidden: body.hidden }),
      ...(body.image !== undefined && { image: body.image || null }),
      ...(body.parentId !== undefined && { parentId: body.parentId || null }),
      ...(body.showSubCategoriesOnHome !== undefined && { showSubCategoriesOnHome: !!body.showSubCategoriesOnHome }),
      ...(body.storyText !== undefined && { storyText: body.storyText || null }),
      ...(body.storyImage !== undefined && { storyImage: body.storyImage || null }),
      ...(body.originalLang !== undefined && { originalLang: body.originalLang || "en" }),
      ...(body.isTrending !== undefined && { isTrending: !!body.isTrending }),
      ...(body.chips !== undefined && { chips: Array.isArray(body.chips) ? JSON.stringify(body.chips) : "[]" }),
    },
  });
  
  return NextResponse.json({
    ...category,
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
  return NextResponse.json({ success: true });
}
