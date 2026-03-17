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

    if (!type) {
      return NextResponse.json({ error: "type required" }, { status: 400 });
    }

    const daily = await prisma.dailyQuiz.findUnique({
      where: { type_date: { type, date } },
    });

    if (!daily) {
      return NextResponse.json({ type, date, daily: null });
    }

    const ids = safeJsonParse(daily.questionIds) || [];
    const rawQuestions = ids.length
      ? await prisma.question.findMany({
          where: { id: { in: ids } },
        })
      : [];

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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("DailyQuiz GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin || session.user.role !== "master") {
    return NextResponse.json({ error: "Master admin only" }, { status: 403 });
  }

  const body = await request.json();
  const type = String(body.type || "").trim();
  const date = String(body.date || "").trim() || getToday();
  const categoryId = String(body.categoryId || "").trim();
  const questionIds = Array.isArray(body.questionIds) ? body.questionIds : [];

  if (!type || !categoryId) {
    return NextResponse.json({ error: "type and categoryId required" }, { status: 400 });
  }

  const normalizedIds = questionIds
    .map((x) => String(x || "").trim())
    .filter(Boolean);

  const saved = await prisma.dailyQuiz.upsert({
    where: { type_date: { type, date } },
    update: { categoryId, questionIds: JSON.stringify(normalizedIds) },
    create: { type, date, categoryId, questionIds: JSON.stringify(normalizedIds) },
  });

  await prisma.adminActivityLog.create({
    data: {
      adminId: session.user.adminId,
      action: "upsert_daily_quiz",
      details: `${type} ${date} (${normalizedIds.length} questions)`,
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
}

