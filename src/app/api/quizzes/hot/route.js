import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongoDb";
import { HOT_QUIZZES_SEED } from "@/lib/hotQuizzesData";

export async function GET(request) {
  try {
    const db = await getDb();
    
    // Check if hot quizzes exist in DB
    const dbHotQuizzes = await db
      .collection("quiz_sets")
      .find({ hot: true })
      .sort({ hotRank: 1 })
      .toArray();

    if (dbHotQuizzes && dbHotQuizzes.length > 0) {
      return NextResponse.json({
        success: true,
        quizzes: dbHotQuizzes,
      });
    }

    // Seed into DB asynchronously if empty
    try {
      for (const item of HOT_QUIZZES_SEED) {
        await db.collection("quiz_sets").updateOne(
          { id: item.id },
          { $set: { ...item, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
          { upsert: true }
        );
      }
    } catch (e) {
      console.error("Auto-seed hot quizzes error:", e);
    }

    return NextResponse.json({
      success: true,
      quizzes: HOT_QUIZZES_SEED,
    });
  } catch (err) {
    console.error("GET /api/quizzes/hot error:", err);
    // Fallback to static seed
    return NextResponse.json({
      success: true,
      quizzes: HOT_QUIZZES_SEED,
    });
  }
}
