import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeQuestions(questions) {
  return questions.map((q) => ({
    id: q.id,
    text: q.text,
    options: safeJsonParse(q.options),
    correctAnswer: q.correctAnswer,
    difficulty: q.difficulty,
    image: q.image,
    categoryId: q.categoryId,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
  }));
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const date = url.searchParams.get("date") || getToday();
    
    console.log(`[API/DailyQuiz] GET called for Type: ${type}, Date: ${date}`);

    if (!type) {
      return NextResponse.json({ error: "type required" }, { status: 400 });
    }

    const daily = await prisma.dailyQuiz.findUnique({
      where: { type_date: { type, date } },
    });

    if (!daily) {
      console.log(`[API/DailyQuiz] No entry found for ${type} on ${date}`);
      return NextResponse.json({ type, date, daily: null, questions: [] });
    }

    const ids = (safeJsonParse(daily.questionIds) || []).filter(id => typeof id === 'string' && id.length === 24);
    console.log(`[API/DailyQuiz] Found entry. Valid Question IDs count: ${ids.length}`);
    
    const rawQuestions = ids.length
      ? await prisma.question.findMany({
          where: { id: { in: ids } },
        })
      : [];

    console.log(`[API/DailyQuiz] Fetched ${rawQuestions.length} questions from DB`);

    const byId = new Map(rawQuestions.map((q) => [q.id, q]));
    const ordered = ids.map((id) => byId.get(id)).filter(Boolean);

    const category = await prisma.category.findUnique({
      where: { id: daily.categoryId },
      select: {
        id: true,
        topic: true,
        emoji: true,
        description: true,
        storyText: true,
        storyImage: true,
        originalLang: true,
        isTrending: true,
        hidden: true,
        chips: true,
      },
    });

    const responseData = {
      type,
      date,
      daily: {
        id: daily.id,
        type: daily.type,
        date: daily.date,
        categoryId: daily.categoryId,
        questionIds: ids,
        createdAt: daily.createdAt,
        updatedAt: daily.updatedAt,
      },
      category: category
        ? { ...category, chips: safeJsonParse(category.chips) || [] }
        : null,
      questions: normalizeQuestions(ordered),
    };

    console.log(`[API/DailyQuiz] Returning ${responseData.questions.length} questions`);
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[API/DailyQuiz] GET error:", error);
    return NextResponse.json({ error: "Failed to load daily quiz" }, { status: 500 });
  }
}

export async function PUT(request) {
  console.log("[API/DailyQuiz] PUT request received");
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin || session.user.role !== "master") {
    return NextResponse.json({ error: "Master admin only" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const type = String(body.type || "").trim();
    const date = String(body.date || "").trim() || getToday();
    const categoryId = String(body.categoryId || "").trim();
    const questionIds = Array.isArray(body.questionIds) ? body.questionIds : [];

    if (!type || !categoryId) {
      return NextResponse.json({ error: "type and categoryId required" }, { status: 400 });
    }

    // Filter to ensure only valid existing IDs are saved
    const providedIds = questionIds
      .map((x) => String(x || "").trim())
      .filter(id => id.length === 24);
    
    const existingQuestions = await prisma.question.findMany({
      where: { id: { in: providedIds } },
      select: { id: true }
    });
    const existingIds = existingQuestions.map(q => q.id);
    
    console.log(`[API/DailyQuiz] Saving ${existingIds.length} existing IDs out of ${providedIds.length} provided.`);

    const saved = await prisma.dailyQuiz.upsert({
      where: { type_date: { type, date } },
      update: { categoryId, questionIds: JSON.stringify(existingIds) },
      create: { type, date, categoryId, questionIds: JSON.stringify(existingIds) },
    });

    await prisma.adminActivityLog.create({
      data: {
        adminId: session.user.adminId,
        action: "upsert_daily_quiz",
        details: `${type} ${date} (${existingIds.length} questions)`,
      },
    });

    return NextResponse.json({
      id: saved.id,
      type: saved.type,
      date: saved.date,
      categoryId: saved.categoryId,
      questionIds: safeJsonParse(saved.questionIds) || [],
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    });
  } catch (error) {
    console.error("[API/DailyQuiz] PUT error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

