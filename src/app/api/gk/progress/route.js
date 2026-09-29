// src/app/api/gk/progress/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongoDb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ensureGkDbInitialized } from "@/lib/gkDbInit";

export const dynamic = "force-dynamic";

export async function POST(req) {
  await ensureGkDbInitialized();
  const db = await getDb();

  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    const body = await req.json();
    const {
      setId,
      category,
      scope = "topic",
      topicId,
      language = "en",
      score = 0,
      totalQuestions = 20,
      stars = 0,
      deviceId,
    } = body;

    if (!setId) {
      return NextResponse.json({ error: "Missing setId" }, { status: 400 });
    }

    const progressCol = db.collection("gk_progress");

    // Filter by userId if logged in, else deviceId
    const filter = userId ? { userId, setId } : { deviceId: deviceId || "guest", setId };

    const existing = await progressCol.findOne(filter);
    const attempts = (existing?.attempts || 0) + 1;
    const bestScore = Math.max(existing?.bestScore || 0, score);
    const earnedStars = Math.max(existing?.stars || 0, stars);

    const updateDoc = {
      setId,
      category,
      scope,
      topicId: topicId || null,
      language,
      attempts,
      bestScore,
      stars: earnedStars,
      totalQuestions,
      completedAt: new Date(),
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
