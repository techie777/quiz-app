import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { recordAttemptFirstAnswer, checkEntitlement } from "@/lib/entitlement";

export async function POST(request) {
  try {
    const body = await request.json();
    const { setId, tier, moduleId, gatePassed = "start" } = body;

    if (!setId) {
      return NextResponse.json({ success: false, error: "setId is required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;
    const headerDeviceId = request.headers.get("x-device-id");
    const deviceId = body.deviceId || headerDeviceId || null;

    const recordResult = await recordAttemptFirstAnswer({
      userId,
      deviceId,
      tier: tier || "adults",
      moduleId: moduleId || "quiz",
      setId,
      gatePassed,
    });

    const entitlement = await checkEntitlement({
      userId,
      deviceId,
      tier,
      moduleId,
      setId,
    });

    return NextResponse.json({
      success: true,
      recordResult,
      entitlement,
    });
  } catch (err) {
    console.error("POST /api/attempts/record error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
