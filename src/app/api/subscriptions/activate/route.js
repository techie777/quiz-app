import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongoDb";
import { PRO_PLANS } from "@/lib/monetizationConfig";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { planId, paymentId, orderId, deviceId } = body;

    const plan = PRO_PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ success: false, error: "Invalid plan ID" }, { status: 400 });
    }

    const userId = session?.user?.id || null;
    const identifier = userId ? String(userId) : (deviceId ? String(deviceId) : "guest_user");

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const db = await getDb();

    // 1. Insert subscription
    const subResult = await db.collection("subscriptions").insertOne({
      userId: identifier,
      planId: plan.id,
      planName: plan.name,
      amount: plan.price,
      startDate,
      endDate,
      status: "active",
      source: "razorpay_upi",
      orderId: orderId || `sim_${Date.now()}`,
      paymentId: paymentId || `pay_${Date.now()}`,
      createdAt: new Date(),
    });

    // 2. Insert payment record
    await db.collection("payments").insertOne({
      userId: identifier,
      amount: plan.price,
      currency: "INR",
      paymentId: paymentId || `pay_${Date.now()}`,
      orderId: orderId || `sim_${Date.now()}`,
      type: "subscription",
      status: "completed",
      createdAt: new Date(),
    });

    // 3. Update user if authenticated
    if (userId) {
      try {
        const { ObjectId } = require("mongodb");
        await db.collection("users").updateOne(
          { _id: new ObjectId(userId) },
          {
            $set: {
              isPro: true,
              proExpiresAt: endDate,
              proPlan: plan.id,
            },
          }
        );
      } catch (err) {
        // If not valid objectId, update by string id or email
        await db.collection("users").updateOne(
          { email: session?.user?.email },
          {
            $set: {
              isPro: true,
              proExpiresAt: endDate,
              proPlan: plan.id,
            },
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subResult.insertedId,
        planId: plan.id,
        planName: plan.name,
        expiresAt: endDate.toISOString(),
        isPro: true,
      },
    });
  } catch (err) {
    console.error("Subscription activation error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
