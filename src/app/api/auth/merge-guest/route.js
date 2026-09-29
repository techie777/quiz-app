import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { mergeGuestAttempts } from "@/lib/entitlement";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { deviceId } = body;

    if (deviceId) {
      await mergeGuestAttempts(deviceId, session.user.id);
    }

    return NextResponse.json({ success: true, merged: true });
  } catch (err) {
    console.error("POST /api/auth/merge-guest error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
