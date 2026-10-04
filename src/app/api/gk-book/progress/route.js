import { NextResponse } from "next/server";
import { getGkBookProgress, saveGkBookProgress } from "@/lib/gk-book/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/gk-book/progress?userOrDeviceId=...&chapterSlug=...
 * Fetches user or device read progress and quiz attempts
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userOrDeviceId = searchParams.get("userOrDeviceId") || searchParams.get("deviceId");
    const chapterSlug = searchParams.get("chapterSlug");

    if (!userOrDeviceId || !chapterSlug) {
      return NextResponse.json(
        { success: false, error: "userOrDeviceId and chapterSlug are required" },
        { status: 400 }
      );
    }

    const progress = await getGkBookProgress(userOrDeviceId, chapterSlug);
    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (err) {
    console.error("[api/gk-book/progress] GET error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load progress" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gk-book/progress
 * Body: { userOrDeviceId, chapterSlug, read, att, lastPage }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { userOrDeviceId, chapterSlug, read, att, lastPage } = body;

    if (!userOrDeviceId || !chapterSlug) {
      return NextResponse.json(
        { success: false, error: "userOrDeviceId and chapterSlug are required" },
        { status: 400 }
      );
    }

    const result = await saveGkBookProgress(userOrDeviceId, chapterSlug, {
      read,
      att,
      lastPage,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/gk-book/progress] POST error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to save progress" },
      { status: 500 }
    );
  }
}
