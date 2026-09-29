import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongoDb";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;
    const headerDeviceId = req.headers.get("x-device-id");
    const identifier = userId ? String(userId) : (headerDeviceId ? String(headerDeviceId) : null);

    if (!identifier) {
      return NextResponse.json({ success: true, subscriptions: [], payments: [] });
    }

    const db = await getDb();
    const subscriptions = await db
      .collection("subscriptions")
      .find({ userId: identifier })
      .sort({ createdAt: -1 })
      .toArray();

    const payments = await db
      .collection("payments")
      .find({ userId: identifier })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      subscriptions,
      payments,
    });
  } catch (err) {
    console.error("User orders error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
