import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSchoolSeed } from "@/lib/schoolSeed";

export const dynamic = "force-dynamic";

function normalize(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSchoolSeed();

  const chapterId = params.chapterId;
  const body = await request.json();
  const answers = Array.isArray(body.answers) ? body.answers : [];

  const questions = await prisma.schoolQuestion.findMany({
    where: { chapterId },
    select: { id: true, type: true, answer: true },
  });
  if (questions.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const answerMap = new Map(
    answers
      .map((a) => [String(a?.questionId || ""), a?.response])
      .filter(([id]) => id)
  );

  let score = 0;
  for (const q of questions) {
    const userResp = answerMap.get(q.id);
    if (q.type === "fill_blank") {
      if (normalize(userResp) === normalize(q.answer)) score += 1;
    } else {
      if (String(userResp || "") === q.answer) score += 1;
    }
  }

  const total = questions.length;
  const now = new Date();

  const prev = await prisma.schoolProgress.findUnique({
    where: { userId_chapterId: { userId: session.user.id, chapterId } },
    select: { attempts: true, bestScore: true },
  });

  const attempts = (prev?.attempts || 0) + 1;
  const bestScore = Math.max(prev?.bestScore || 0, score);

  await prisma.schoolProgress.upsert({
    where: { userId_chapterId: { userId: session.user.id, chapterId } },
    update: { attempts, lastScore: score, bestScore, lastAttemptAt: now },
    create: { userId: session.user.id, chapterId, attempts, lastScore: score, bestScore, lastAttemptAt: now },
  });

  return NextResponse.json({ score, total, attempts, bestScore });
}
