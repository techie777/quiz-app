import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSchoolSeed } from "@/lib/schoolSeed";
import { enforceRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const rl = enforceRateLimit(rateLimitKey(request, "api:school:dashboard:get"), { windowMs: 60_000, max: 20 });
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSeconds);

  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSchoolSeed();

  const userId = session.user.id;

  const [allChapters, progressRows, attempts] = await Promise.all([
    prisma.schoolChapter.findMany({
      orderBy: [{ subject: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      select: {
        id: true,
        title: true,
        sortOrder: true,
        subject: {
          select: {
            id: true,
            name: true,
            slug: true,
            class: { select: { number: true, board: { select: { slug: true, name: true } } } },
          },
        },
        _count: { select: { questions: true } },
      },
    }),
    prisma.schoolProgress.findMany({
      where: { userId },
      orderBy: [{ updatedAt: "desc" }],
      select: { chapterId: true, attempts: true, bestScore: true, lastScore: true, lastAttemptAt: true },
    }),
    prisma.chapterAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, chapterId: true, score: true, maxScore: true, timeSpent: true, details: true, createdAt: true },
    }),
  ]);

  const progressByChapter = new Map(progressRows.map((p) => [p.chapterId, p]));
  const attemptedChapterIds = new Set(progressRows.filter((p) => (p.attempts || 0) > 0).map((p) => p.chapterId));

  const completedChapters = attemptedChapterIds.size;
  const totalChapters = allChapters.length;
  const pendingChapters = Math.max(0, totalChapters - completedChapters);

  const totalCorrect = attempts.reduce((acc, a) => acc + (a.score || 0), 0);
  const totalQuestions = attempts.reduce((acc, a) => acc + (a.maxScore || 0), 0);
  const avgScorePct = totalQuestions > 0 ? Number(((totalCorrect / totalQuestions) * 100).toFixed(1)) : 0;

  const totalTimeSeconds = attempts.reduce((acc, a) => acc + (a.timeSpent || 0), 0);

  const completionPie = [
    { name: "Completed", value: completedChapters },
    { name: "Pending", value: pendingChapters },
  ];

  // Quiz type performance from attempt.details JSON
  const quizTypePerf = {};
  for (const a of attempts) {
    let parsed = {};
    try {
      parsed = JSON.parse(a.details || "{}");
    } catch {
      parsed = {};
    }
    const breakdown = parsed?.breakdown && typeof parsed.breakdown === "object" ? parsed.breakdown : {};
    for (const [type, row] of Object.entries(breakdown)) {
      const correct = Number(row?.correct || 0);
      const total = Number(row?.total || 0);
      quizTypePerf[type] = quizTypePerf[type] || { correct: 0, total: 0 };
      quizTypePerf[type].correct += correct;
      quizTypePerf[type].total += total;
    }
  }

  // Subject strengths/weaknesses from attempts (better than SchoolProgress bestScore alone)
  const chapterToSubject = new Map(allChapters.map((c) => [c.id, c.subject]));
  const subjectPerf = {};
  for (const a of attempts) {
    const subj = chapterToSubject.get(a.chapterId);
    if (!subj) continue;
    const key = `${subj.class.board.slug}|${subj.class.number}|${subj.slug}`;
    subjectPerf[key] = subjectPerf[key] || {
      subjectName: subj.name,
      boardName: subj.class.board.name,
      boardSlug: subj.class.board.slug,
      classNumber: subj.class.number,
      subjectSlug: subj.slug,
      correct: 0,
      total: 0,
    };
    subjectPerf[key].correct += a.score || 0;
    subjectPerf[key].total += a.maxScore || 0;
  }
  const subjectRows = Object.values(subjectPerf).map((s) => ({
    ...s,
    pct: s.total > 0 ? Number(((s.correct / s.total) * 100).toFixed(1)) : 0,
  }));
  subjectRows.sort((a, b) => b.pct - a.pct);
  const strengths = subjectRows.filter((s) => s.total > 0 && s.pct >= 80).slice(0, 5);
  const weaknesses = subjectRows.filter((s) => s.total > 0 && s.pct <= 50).slice(0, 5);

  const subjectBar = subjectRows
    .slice(0, 10)
    .map((s) => ({ name: s.subjectName, pct: s.pct, total: s.total, correct: s.correct }));

  const typePie = Object.entries(quizTypePerf).map(([type, row]) => ({
    name: String(type).replaceAll("_", " ").toUpperCase(),
    value: Number(row?.total || 0),
    correct: Number(row?.correct || 0),
  }));

  // Score trend over time (last 14 days, based on attempt createdAt)
  const byDay = new Map();
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, { day: key, avgPct: 0, attempts: 0 });
  }
  for (const a of attempts) {
    const day = new Date(a.createdAt).toISOString().slice(0, 10);
    const row = byDay.get(day);
    if (!row) continue;
    const pct = a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0;
    row.avgPct += pct;
    row.attempts += 1;
  }
  const trend = Array.from(byDay.values()).map((r) => ({
    day: r.day.slice(5),
    avgPct: r.attempts > 0 ? Number((r.avgPct / r.attempts).toFixed(1)) : 0,
    attempts: r.attempts,
  }));

  const recentAttempts = attempts.slice(0, 10).map((a) => {
    const ch = allChapters.find((c) => c.id === a.chapterId);
    const subj = ch?.subject;
    const href = subj
      ? `/school-study/${subj.class.board.slug}/${subj.class.number}/${subj.slug}/${a.chapterId}`
      : `/school-study/practice/${a.chapterId}`;
    return {
      id: a.id,
      score: a.score,
      maxScore: a.maxScore,
      timeSpent: a.timeSpent,
      createdAt: a.createdAt,
      chapter: ch ? { id: ch.id, title: ch.title } : { id: a.chapterId, title: "Chapter" },
      href,
    };
  });

  const resume = recentAttempts[0] ? { href: recentAttempts[0].href, title: recentAttempts[0].chapter.title } : null;

  const chapters = allChapters.map((c) => {
    const p = progressByChapter.get(c.id) || null;
    return {
      id: c.id,
      title: c.title,
      questionCount: c._count.questions,
      subject: c.subject,
      progress: p
        ? { attempts: p.attempts, bestScore: p.bestScore, lastScore: p.lastScore, lastAttemptAt: p.lastAttemptAt }
        : null,
      href: `/school-study/${c.subject.class.board.slug}/${c.subject.class.number}/${c.subject.slug}/${c.id}`,
    };
  });

  return NextResponse.json({
    totals: { totalChapters, completedChapters, pendingChapters },
    avgScorePct,
    totalTimeSeconds,
    charts: { completionPie, typePie, subjectBar, trend },
    quizTypePerf,
    strengths,
    weaknesses,
    resume,
    recentAttempts,
    chapters,
  });
}

