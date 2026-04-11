import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
          isPro: true,
          proExpiresAt: true,
          purchasedPasses: true,
          factsReadCount: true,
          tfAnsweredCount: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if Pro has expired
    let isPro = user.isPro;
    if (isPro && user.proExpiresAt && new Date(user.proExpiresAt) < new Date()) {
        isPro = false;
        // Optionally update DB here in background
        await prisma.user.update({
            where: { email: session.user.email },
            data: { isPro: false }
        });
    }

    return NextResponse.json({
        isPro,
        purchasedPasses: user.purchasedPasses,
        factsReadCount: user.factsReadCount,
        tfAnsweredCount: user.tfAnsweredCount
    });

  } catch (error) {
    console.error("Monetization Status API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
