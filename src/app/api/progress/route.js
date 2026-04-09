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
        isComplete: isComplete === true,
        lastQuestionIndex,
        answersJson,
      },
      create: {
        userId: session.user.id,
        categoryId,
        setIndex,
        progress,
        isComplete: isComplete === true,
        lastQuestionIndex,
        answersJson,
      },
    });

    return NextResponse.json(updatedProgress);
  } catch (error) {
    console.error("[API/Progress] POST Error:", error);
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}
