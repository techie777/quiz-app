import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSchoolSeed } from "@/lib/schoolSeed";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSchoolSeed();

  const chapterId = params.chapterId;
  const chapter = await prisma.schoolChapter.findUnique({
    where: { id: chapterId },
    select: {
      id: true,
      title: true,
      sortOrder: true,
      subject: {
        select: {
          id: true,
          name: true,
          slug: true,
          class: { select: { number: true, board: { select: { id: true, name: true } } } },
        },
      },
      questions: {
        orderBy: { createdAt: "asc" },
        select: { id: true, type: true, prompt: true, options: true },
      },
      progress: {
        where: { userId: session.user.id },
        select: { attempts: true, bestScore: true, lastScore: true, lastAttemptAt: true },
      },
    },
  });

  if (!chapter) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    chapter: {
      id: chapter.id,
      title: chapter.title,
      sortOrder: chapter.sortOrder,
      subject: chapter.subject,
    },
    progress: chapter.progress[0] || null,
    questions: chapter.questions.map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      options: safeJsonParse(q.options) || [],
    })),
  });
}

