import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongoDb";
import { DEFAULT_AD_TOGGLES } from "@/lib/monetizationConfig";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const configDoc = await db.collection("app_settings").findOne({ key: "monetization_config" });
    const config = configDoc?.value || DEFAULT_AD_TOGGLES;

    // Also get overview stats
    const totalSubscriptions = await db.collection("subscriptions").countDocuments();
    const activeSubscriptions = await db.collection("subscriptions").countDocuments({ status: "active" });
    const totalPayments = await db.collection("payments").countDocuments();
    
    // Pro conversions by plan
    const conversionsByPlan = await db
      .collection("subscriptions")
      .aggregate([
        { $group: { _id: "$planId", count: { $sum: 1 }, totalRevenue: { $sum: "$amount" } } },
      ])
      .toArray();

    return NextResponse.json({
      success: true,
      config,
      stats: {
        totalSubscriptions,
        activeSubscriptions,
        totalPayments,
        conversionsByPlan,
      },
    });
  } catch (err) {
    console.error("Monetization config GET error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { config } = body;

    const db = await getDb();
    await db.collection("app_settings").updateOne(
      { key: "monetization_config" },
      { $set: { key: "monetization_config", value: config, updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, message: "Monetization config saved", config });
  } catch (err) {
    console.error("Monetization config POST error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
