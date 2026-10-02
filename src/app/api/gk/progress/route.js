// src/app/api/gk/progress/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongoDb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ensureGkDbInitialized } from "@/lib/gkDbInit";

export const dynamic = "force-dynamic";

/**
 * GET: Retrieve progress for a subject, topic, set, or user
 */
export async function GET(req) {
  await ensureGkDbInitialized();
  const db = await getDb();

  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    const { searchParams } = new URL(req.url);
    const setId = searchParams.get("setId");
    const subjectId = searchParams.get("subjectId");
    const topicId = searchParams.get("topicId");
    const deviceId = req.headers.get("x-device-id") || searchParams.get("deviceId") || "";

    const progressCol = db.collection("gk_progress");

    // Match criteria: either userId (if logged in) or deviceId
    const userMatch = userId
      ? { $or: [{ userId }, { deviceId: deviceId || "none" }] }
      : { deviceId: deviceId || "none" };

    const filter = { ...userMatch };
    if (setId) filter.setId = setId;
    if (subjectId) filter.subjectId = subjectId;
    if (topicId) filter.topicId = topicId;

    const docs = await progressCol.find(filter).toArray();

    // Summary metrics
    const totalCompleted = docs.filter((d) => d.completedAt || d.status === "completed").length;
    const totalStars = docs.reduce((sum, d) => sum + (d.stars || 0), 0);

    return NextResponse.json({
      success: true,
      progress: docs,
      totalCompleted,
      totalStars,
    });
  } catch (err) {
    console.error("GK Progress GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST: Record set progress, or sync guest device progress to logged in user
 */
export async function POST(req) {
  await ensureGkDbInitialized();
  const db = await getDb();

  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    const body = await req.json();
    const { action, deviceId } = body;

    const progressCol = db.collection("gk_progress");

    // ── TASK 3.2: GUEST TO USER SYNC ON LOGIN ──
    if (action === "sync") {
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized for sync" }, { status: 401 });
      }
      if (!deviceId) {
        return NextResponse.json({ error: "Missing deviceId for sync" }, { status: 400 });
      }

      const syncResult = await progressCol.updateMany(
        { deviceId, $or: [{ userId: { $exists: false } }, { userId: null }] },
        { $set: { userId, syncedAt: new Date() } }
      );

      return NextResponse.json({
        success: true,
        action: "synced",
        modifiedCount: syncResult.modifiedCount,
      });
    }

    // ── RECORD QUIZ SET PROGRESS ──
    const {
      setId,
      subjectId,
      topicId,
      category,
      scope = "subject",
      language = "en",
      score = 0,
      totalQuestions = 20,
      stars = 0,
      status = "completed",
    } = body;

    if (!setId) {
      return NextResponse.json({ error: "Missing setId" }, { status: 400 });
    }

    // Filter by userId if logged in, else deviceId
    const filter = userId ? { userId, setId } : { deviceId: deviceId || "guest", setId };

    const existing = await progressCol.findOne(filter);
    const attempts = (existing?.attempts || 0) + 1;
    const bestScore = Math.max(existing?.bestScore || 0, score);
    const earnedStars = Math.max(existing?.stars || 0, stars);

    const updateDoc = {
      setId,
      subjectId: subjectId || existing?.subjectId || null,
      topicId: topicId || existing?.topicId || null,
      category: category || existing?.category || null,
      scope,
      language,
      attempts,
      bestScore,
      stars: earnedStars,
      totalQuestions,
      status,
      completedAt: status === "completed" ? (existing?.completedAt || new Date()) : null,
      lastPlayedAt: new Date(),
    };

    if (userId) {
      updateDoc.userId = userId;
    }
    if (deviceId) {
      updateDoc.deviceId = deviceId;
    }

    await progressCol.updateOne(filter, { $set: updateDoc }, { upsert: true });

    return NextResponse.json({ success: true, progress: updateDoc });
  } catch (err) {
    console.error("GK Progress POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
