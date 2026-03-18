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
    return NextResponse.json([], { status: 200 });
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
