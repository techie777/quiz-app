import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");

  try {
    if (!prisma.userProgress) {
      console.warn("[API/Progress] UserProgress model not found in Prisma Client. Did you run prisma generate?");
      return NextResponse.json([]); // Return empty array to keep UI stable
    }

    const progress = await prisma.userProgress.findMany({
      where: {
        userId: session.user.id,
        ...(categoryId && { categoryId }),
      },
      orderBy: { setIndex: 'asc' }
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error("[API/Progress] GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { categoryId, setIndex, progress, isComplete, lastQuestionIndex, answers } = body;

    if (!categoryId || setIndex === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const answersJson = JSON.stringify(answers || []);
    
    // Each correct answer gives 10 Global Intelligence Points!
    const pointScore = (answers || []).reduce((sum, a) => sum + (a.isCorrect ? 10 : 0), 0);

    // Award coins for correct answers
    const correctCount = (answers || []).filter(a => a.isCorrect).length;
    let coinBalance = null;
    let coinsEarned = 0;

    if (correctCount > 0) {
      try {
        // Get user's Pro status
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { isPro: true, coinBalance: true, totalCoinsEarned: true },
        });

        if (user) {
          // 1 coin for regular users, 4 coins for Pro users per correct answer
          const coinsPerCorrect = user.isPro ? 4 : 1;
          coinsEarned = correctCount * coinsPerCorrect;

          // Create coin transaction
          await prisma.coinTransaction.create({
            data: {
              userId: session.user.id,
              type: "CORRECT_ANSWER",
              amount: coinsEarned,
              description: `${correctCount} correct answer${correctCount > 1 ? 's' : ''} (+${coinsEarned} coins)`,
              metadata: JSON.stringify({ categoryId, setIndex, correctCount, isPro: user.isPro }),
            },
          });

          // Update user balance
          const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
              coinBalance: user.coinBalance + coinsEarned,
              totalCoinsEarned: user.totalCoinsEarned + coinsEarned,
            },
          });

          coinBalance = updatedUser.coinBalance;
        }
      } catch (coinError) {
        console.error("[API/Progress] Coin awarding error:", coinError);
        // Don't fail the progress save if coin awarding fails
      }
    }

    const updatedProgress = await prisma.userProgress.upsert({
      where: {
        userId_categoryId_setIndex: {
          userId: session.user.id,
          categoryId,
          setIndex,
        },
      },
      update: {
        progress,
        score: pointScore,
        isComplete: isComplete === true,
        lastQuestionIndex,
        answersJson,
      },
      create: {
        userId: session.user.id,
        categoryId,
        setIndex,
        progress,
        score: pointScore,
        isComplete: isComplete === true,
        lastQuestionIndex,
        answersJson,
      },
    });

    return NextResponse.json({
      ...updatedProgress,
      coinBalance,
      coinsEarned,
    });
  } catch (error) {
    console.error("[API/Progress] POST Error:", error);
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}
