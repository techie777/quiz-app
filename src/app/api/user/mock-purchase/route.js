import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, mockCategoryId } = await request.json();

    if (type === "pro") {
        // Unlock Pro for 1 month
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await prisma.user.update({
            where: { email: session.user.email },
            data: { 
                isPro: true,
                proExpiresAt: expiresAt
            }
        });

        return NextResponse.json({ success: true, message: "Pro membership unlocked!" });
    }

    if (type === "mockpass" && mockCategoryId) {
        // Unlock specific mock category
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { purchasedPasses: true }
        });

        if (!user.purchasedPasses.includes(mockCategoryId)) {
            await prisma.user.update({
                where: { email: session.user.email },
                data: {
                    purchasedPasses: {
                        push: mockCategoryId
                    }
                }
            });
        }

        return NextResponse.json({ success: true, message: "Mock Pass Unlocked!" });
    }

    return NextResponse.json({ error: "Invalid purchase type" }, { status: 400 });

  } catch (error) {
    console.error("Mock Purchase API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
