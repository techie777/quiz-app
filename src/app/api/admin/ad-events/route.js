import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongoDb";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const { trigger, tier, setId, status, deviceId } = body;

    const db = await getDb();
    const adEventsCol = db.collection("ad_events");

    await adEventsCol.insertOne({
      trigger: trigger || "start",
      tier: tier || "explorer",
      setId: setId || "unknown",
      status: status || "requested",
      deviceId: deviceId || "anonymous",
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to log ad event:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const db = await getDb();
    const adEventsCol = db.collection("ad_events");

    // Aggregate stats
    const totalEvents = await adEventsCol.countDocuments();
    const completedCount = await adEventsCol.countDocuments({ status: "completed" });
    const dismissedCount = await adEventsCol.countDocuments({ status: "dismissed" });
    const blockedCount = await adEventsCol.countDocuments({ status: "blocked" });

    // Group by trigger
    const byTrigger = await adEventsCol
      .aggregate([
        {
          $group: {
            _id: "$trigger",
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
            dismissed: { $sum: { $cond: [{ $eq: ["$status", "dismissed"] }, 1, 0] } },
          },
        },
      ])
      .toArray();

    // Recent 50 events
    const recentEvents = await adEventsCol
      .find({})
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      success: true,
      stats: {
        totalEvents,
        completedCount,
        dismissedCount,
        blockedCount,
        completionRate: totalEvents > 0 ? ((completedCount / totalEvents) * 100).toFixed(1) : 0,
        byTrigger,
      },
      recentEvents,
    });
  } catch (err) {
    console.error("Failed to fetch ad events stats:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
