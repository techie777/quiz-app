import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const isAuthedUser = Boolean(session?.user?.id) && !session.user.isAdmin;

    const { chapterId, score, maxScore, timeSpent, details } = await req.json();
    if (!chapterId) {
      return NextResponse.json({ success: false, message: "chapterId is required" }, { status: 400 });
    }

    // Validate chapter exists and align maxScore to real question count.
    const chapter = await prisma.schoolChapter.findUnique({
      where: { id: chapterId },
      select: { id: true, _count: { select: { questions: true } } },
    });
    if (!chapter) {
      return NextResponse.json({ success: false, message: "Chapter not found" }, { status: 404 });
    }
    const trueMaxScore = chapter._count.questions || 0;

    // Guest gating: first 2 completed attempts globally are free, then sign-in required.
    if (!isAuthedUser) {
      const jar = await cookies();
      const raw = jar.get("ss_free_attempts")?.value || "0";
      const used = Math.max(0, Math.min(999, Number.parseInt(raw, 10) || 0));
      if (used >= 2) {
        return NextResponse.json(
          { success: false, code: "SIGNIN_REQUIRED", message: "Sign in for free to continue learning." },
          { status: 401 }
        );
      }

      const nextUsed = used + 1;
      const res = NextResponse.json({
        success: true,
        guest: true,
        remainingFreeAttempts: Math.max(0, 2 - nextUsed),
        maxScore: trueMaxScore,
        score: Number(score) || 0,
      });
      res.cookies.set("ss_free_attempts", String(nextUsed), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return res;
    }

    // 1. Create the detailed attempt log
    const attempt = await prisma.chapterAttempt.create({
      data: {
        userId: session.user.id,
        chapterId,
        score: Number(score) || 0,
        maxScore: trueMaxScore,
        timeSpent: Number(timeSpent) || 0,
        details: details != null ? String(details) : "{}",
      }
    });

    // 2. Update the aggregate Progress for the dashboard
    const existingProgress = await prisma.schoolProgress.findUnique({
      where: {
        userId_chapterId: {
          userId: session.user.id,
          chapterId
        }
      }
    });

    if (existingProgress) {
        await prisma.schoolProgress.update({
            where: { id: existingProgress.id },
            data: {
                attempts: { increment: 1 },
                bestScore: Math.max(existingProgress.bestScore, Number(score) || 0),
                lastScore: Number(score) || 0,
                lastAttemptAt: new Date()
            }
        });
    } else {
        await prisma.schoolProgress.create({
            data: {
                userId: session.user.id,
                chapterId,
                attempts: 1,
                bestScore: Number(score) || 0,
                lastScore: Number(score) || 0,
                lastAttemptAt: new Date()
            }
        });
    }

    return NextResponse.json({ success: true, attemptId: attempt.id, maxScore: trueMaxScore });
  } catch (error) {
    console.error('Save School Attempt Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
