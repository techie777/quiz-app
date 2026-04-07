import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { chapterId, score, maxScore, timeSpent, details } = await req.json();

    // 1. Create the detailed attempt log
    const attempt = await prisma.chapterAttempt.create({
      data: {
        userId: session.user.id,
        chapterId,
        score,
        maxScore,
        timeSpent,
        details
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
                bestScore: Math.max(existingProgress.bestScore, score),
                lastScore: score,
                lastAttemptAt: new Date()
            }
        });
    } else {
        await prisma.schoolProgress.create({
            data: {
                userId: session.user.id,
                chapterId,
                attempts: 1,
                bestScore: score,
                lastScore: score,
                lastAttemptAt: new Date()
            }
        });
    }

    return NextResponse.json({ success: true, attemptId: attempt.id });
  } catch (error) {
    console.error('Save School Attempt Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
