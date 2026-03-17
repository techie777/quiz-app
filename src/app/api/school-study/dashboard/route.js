import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSchoolSeed } from "@/lib/schoolSeed";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSchoolSeed();

  const progress = await prisma.schoolProgress.findMany({
    where: { userId: session.user.id },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      attempts: true,
      bestScore: true,
      lastScore: true,
      lastAttemptAt: true,
      chapter: {
        select: {
          id: true,
          title: true,
          subject: {
            select: {
              id: true,
              name: true,
              slug: true,
              class: { select: { number: true, board: { select: { id: true, name: true } } } },
            },
          },
          _count: { select: { questions: true } },
        },
      },
    },
  });

  return NextResponse.json({
    progress: progress.map((p) => ({
      attempts: p.attempts,
      bestScore: p.bestScore,
      lastScore: p.lastScore,
      lastAttemptAt: p.lastAttemptAt,
      chapter: {
        id: p.chapter.id,
        title: p.chapter.title,
        questionCount: p.chapter._count.questions,
        subject: p.chapter.subject,
      },
    })),
  });
}

