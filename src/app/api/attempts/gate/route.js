import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { recordGatePassed, checkEntitlement } from "@/lib/entitlement";
import { getDb } from "@/lib/mongoDb";

export async function POST(request) {
  try {
    const body = await request.json();
    const { setId, gate, tier, moduleId } = body; // gate: "start" | "mid" | "result" | "review" | "share"

    if (!setId || !gate) {
      return NextResponse.json({ success: false, error: "setId and gate are required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;
    const headerDeviceId = request.headers.get("x-device-id");
    const deviceId = body.deviceId || headerDeviceId || null;

    // 1. Record gate in attempts
    const updated = await recordGatePassed({
      userId,
      deviceId,
      setId,
      gate,
    });

    // 2. Log in ad_events if it was an ad completion
    try {
      const db = await getDb();
      await db.collection("ad_events").insertOne({
        trigger: gate,
        tier: tier || "adults",
        status: "completed",
        userOrDeviceId: userId || deviceId || "anonymous",
        setId,
        createdAt: new Date(),
      });
    } catch (e) {
      console.error("ad_event log error:", e);
    }

    const entitlement = await checkEntitlement({
      userId,
      deviceId,
      tier,
      moduleId,
      setId,
    });

    return NextResponse.json({
      success: true,
      updated,
      gate,
      entitlement,
    });
  } catch (err) {
    console.error("POST /api/attempts/gate error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
