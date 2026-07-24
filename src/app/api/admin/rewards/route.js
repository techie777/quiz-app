import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminSessionServer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin({ masterOnly: true });
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  try {
    // 1. Fetch recent transactions
    const transactions = await prisma.coinTransaction.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, coinBalance: true }
        }
      }
    });

    // Enrich transactions with Unique User ID
    const enrichedTransactions = transactions.map(t => ({
      ...t,
      displayUserId: `USR-${(t.userId || '').slice(-6).toUpperCase()}`
    }));

    // 2. Fetch KPI stats
    const totalCoinsAggregate = await prisma.user.aggregate({
      _sum: { coinBalance: true, totalCoinsEarned: true },
      _count: { id: true }
    });

    // 3. Fetch coin reward settings
    const settingsRow = await prisma.setting.findUnique({
      where: { key: "coinRewardSettings" }
    });

    const defaultSettings = {
      correctAnswerCoins: 5,
      dailyLoginCoins: 20,
      quizCompletionCoins: 50,
      referralCoins: 100
    };

    const settings = settingsRow ? JSON.parse(settingsRow.value) : defaultSettings;

    return NextResponse.json({
      transactions: enrichedTransactions,
      stats: {
        totalCoinBalance: totalCoinsAggregate._sum.coinBalance || 0,
        totalCoinsEarned: totalCoinsAggregate._sum.totalCoinsEarned || 0,
        totalUsers: totalCoinsAggregate._count.id || 0,
        totalTransactions: transactions.length
      },
      settings
    });
  } catch (error) {
    console.error("Fetch rewards error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  const admin = await requireAdmin({ masterOnly: true });
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  try {
    const body = await request.json();
    const { action, userId, amount, type, description, settings } = body;

    // Action 1: Update Reward Settings
    if (action === "update_settings") {
      await prisma.setting.upsert({
        where: { key: "coinRewardSettings" },
        update: { value: JSON.stringify(settings) },
        create: { key: "coinRewardSettings", value: JSON.stringify(settings) }
      });
      return NextResponse.json({ success: true, message: "Reward settings updated" });
    }

    // Action 2: Manual Coin Grant / Deduction
    if (action === "manual_grant") {
      if (!userId || !amount) {
        return NextResponse.json({ error: "User ID and amount are required" }, { status: 400 });
      }

      // Resolve user by exact ID, unique display ID (USR-XXXXXX), or email
      let targetUser = null;
      if (userId.startsWith("USR-")) {
        const suffix = userId.replace("USR-", "").toLowerCase();
        const allUsers = await prisma.user.findMany({ select: { id: true, coinBalance: true } });
        targetUser = allUsers.find(u => u.id.slice(-6).toLowerCase() === suffix);
      } else {
        targetUser = await prisma.user.findFirst({
          where: {
            OR: [
              { id: userId },
              { email: userId.toLowerCase() }
            ]
          },
          select: { id: true, coinBalance: true }
        });
      }

      if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const coinAmount = parseInt(amount, 10);
      const newBalance = Math.max(0, (targetUser.coinBalance || 0) + coinAmount);

      // Execute transaction and balance update
      await prisma.$transaction([
        prisma.user.update({
          where: { id: targetUser.id },
          data: {
            coinBalance: newBalance,
            totalCoinsEarned: coinAmount > 0 ? { increment: coinAmount } : undefined
          }
        }),
        prisma.coinTransaction.create({
          data: {
            userId: targetUser.id,
            type: type || "ADMIN_ADJUSTMENT",
            amount: coinAmount,
            description: description || "Admin reward adjustment",
          }
        })
      ]);

      return NextResponse.json({ success: true, message: `Successfully updated user coins. New Balance: ${newBalance}` });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Post rewards error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
