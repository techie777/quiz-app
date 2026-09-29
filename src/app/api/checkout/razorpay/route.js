import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PRO_PLANS } from "@/lib/monetizationConfig";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { planId, type = "subscription", customAmount } = body;

    let amount = 0;
    let plan = null;

    if (type === "subscription") {
      plan = PRO_PLANS.find((p) => p.id === planId);
      if (!plan) {
        return NextResponse.json({ success: false, error: "Invalid plan" }, { status: 400 });
      }
      amount = plan.price;
    } else if (type === "donation") {
      amount = Number(customAmount) || 49;
      if (amount < 1) {
        return NextResponse.json({ success: false, error: "Invalid donation amount" }, { status: 400 });
      }
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_mock_quizweb";

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        amount: amount * 100, // In paise
        currency: "INR",
        planId: plan?.id || null,
        type,
      },
      key: keyId,
      user: {
        name: session?.user?.name || "QuizWeb Learner",
        email: session?.user?.email || "guest@quizweb.in",
      },
    });
  } catch (err) {
    console.error("Razorpay order creation error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
