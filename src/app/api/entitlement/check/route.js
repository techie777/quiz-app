import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkEntitlement } from "@/lib/entitlement";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get("tier") || "adults";
    const moduleId = searchParams.get("moduleId") || "quiz";
    const setId = searchParams.get("setId") || null;

    // Check session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    // Extract device id from headers or query
    const headerDeviceId = request.headers.get("x-device-id");
    const queryDeviceId = searchParams.get("deviceId");
    const deviceId = headerDeviceId || queryDeviceId || null;

    const entitlement = await checkEntitlement({
      userId,
      deviceId,
      tier,
      moduleId,
      setId,
    });

    return NextResponse.json({
      success: true,
      ...entitlement,
    });
  } catch (err) {
    console.error("GET /api/entitlement/check error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check entitlement",
        isPro: false,
        isLocked: false,
        remainingSets: 2,
        freeSetsPerWindow: 2,
      },
      { status: 500 }
    );
  }
}
