import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSchoolSeed } from "@/lib/schoolSeed";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSchoolSeed();

  const subjectId = params.subjectId;
  const subject = await prisma.schoolSubject.findUnique({
    where: { id: subjectId },
    select: {
      id: true,
      name: true,
      slug: true,
      class: { select: { number: true, board: { select: { id: true, name: true } } } },
    },
  });
  if (!subject) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const chapters = await prisma.schoolChapter.findMany({
    where: { subjectId },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      title: true,
      sortOrder: true,
      _count: { select: { questions: true } },
      progress: {
        where: { userId: session.user.id },
        select: { attempts: true, bestScore: true, lastScore: true, lastAttemptAt: true },
      },
    },
  });

  return NextResponse.json({
    subject,
    chapters: chapters.map((c) => ({
      id: c.id,
      title: c.title,
      sortOrder: c.sortOrder,
      questionCount: c._count.questions,
      progress: c.progress[0] || null,
    })),
  });
}

