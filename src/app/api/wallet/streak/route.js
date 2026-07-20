import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let streak = await prisma.dailyStreak.findUnique({
      where: { userId: user.id },
    });

    if (!streak) {
      streak = await prisma.dailyStreak.create({
        data: { userId: user.id, streakCount: 0 },
      });
    }

    return NextResponse.json(streak);
  } catch (error) {
    console.error("Streak fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
