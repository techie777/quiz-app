import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkEntitlement } from "@/lib/entitlement";
import { getDb } from "@/lib/mongoDb";
import { enforceRateLimit, rateLimitKey } from "@/lib/rateLimit";

const DAILY_DEVICE_AD_CAP = 20;

export async function POST(request) {
  try {
    // 1. Rate limiting
    const rlKey = rateLimitKey(request, "verify-result");
    const rl = enforceRateLimit(rlKey, { windowMs: 60000, max: 40 });
    if (!rl.ok) {
      return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();
    const { setId, tier, moduleId, durationMs } = body;

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;
    const headerDeviceId = request.headers.get("x-device-id");
    const deviceId = body.deviceId || headerDeviceId || null;
    const identifier = userId ? String(userId) : (deviceId ? String(deviceId) : "anonymous");

    // 2. Check entitlement
    const entitlement = await checkEntitlement({
      userId,
      deviceId,
      tier,
      moduleId,
      setId,
    });

    // Pro or within free quota or exempt: Result payload is immediately allowed!
    if (entitlement.isPro || entitlement.isExempt || !entitlement.isLocked) {
      return NextResponse.json({
        success: true,
        allowed: true,
        gateRequired: false,
        entitlement,
      });
    }

    // Kids and Students never see ads
    if (tier === "kids" || tier === "students") {
      return NextResponse.json({
        success: true,
        allowed: true,
        gateRequired: false,
        entitlement,
      });
    }

    // Explorer and Arena beyond free limit: Result gate check!
    const db = await getDb();

    // Check minimum duration check (risk reduction: at least 3 seconds)
    if (durationMs !== undefined && durationMs < 3000) {
      return NextResponse.json({
        success: false,
        allowed: false,
        error: "Minimum ad duration not met",
      }, { status: 400 });
    }

    // Check per-device daily cap
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAdCount = await db.collection("ad_events").countDocuments({
      userOrDeviceId: identifier,
      status: "completed",
      createdAt: { $gte: today },
    });

    if (todayAdCount >= DAILY_DEVICE_AD_CAP) {
      return NextResponse.json({
        success: true,
        allowed: true,
        capped: true,
        message: "Daily rewarded ad cap reached; granting access without penalty.",
      });
    }

    // If client is reporting gate completion
    if (body.passGate) {
      await db.collection("attempts").updateOne(
        {
          userOrDeviceId: identifier,
          setId: String(setId),
        },
        {
          $addToSet: { gatesPassed: body.passGate },
          $setOnInsert: { firstAnsweredAt: new Date(), tier: tier || "explorer" },
        },
        { upsert: true }
      );

      await db.collection("ad_events").insertOne({
        trigger: body.passGate,
        tier: tier || "explorer",
        setId: String(setId),
        status: "completed",
        deviceId: identifier,
        timestamp: new Date(),
      });

      return NextResponse.json({
        success: true,
        allowed: true,
        gatePassed: true,
        gateRequired: true,
        entitlement,
      });
    }

    // Verify if result gate was recorded
    const attempt = await db.collection("attempts").findOne({
      userOrDeviceId: identifier,
      setId: String(setId),
      firstAnsweredAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    const isGatePassed = attempt?.gatesPassed?.includes("result") || attempt?.gatesPassed?.includes("start");

    return NextResponse.json({
      success: true,
      allowed: Boolean(isGatePassed),
      gateRequired: true,
      gatePassed: Boolean(isGatePassed),
      entitlement,
    });
  } catch (err) {
    console.error("POST /api/attempts/verify-result error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
