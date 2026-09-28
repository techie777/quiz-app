import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongoDb";
import { requireAdmin } from "@/lib/adminSessionServer";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    const db = await getDb();

    // Query questions with >= 30 attempts
    const questions = await db
      .collection("Question")
      .find({ attempts: { $gte: 30 } })
      .toArray();

    const suggestions = [];

    for (const q of questions) {
      const attempts = q.attempts;
      const correct = q.correct || 0;
      const accuracy = Math.round((correct / attempts) * 100);
      const currentLevel = q.difficulty_level || 1;

      let suggestedLevel = currentLevel;
      if (accuracy > 75) {
        suggestedLevel = 1; // Easy
      } else if (accuracy >= 40 && accuracy <= 75) {
        suggestedLevel = 2; // Medium
      } else {
        suggestedLevel = 3; // Hard
      }

      if (suggestedLevel !== currentLevel) {
        const levelNames = { 1: "Easy", 2: "Medium", 3: "Hard" };
        suggestions.push({
          id: q._id.toString(),
          text: q.text_hi || q.text_en || q.text || "",
          attempts,
          correct,
          accuracy,
          currentLevel,
          currentDifficultyName: levelNames[currentLevel] || "Easy",
          suggestedLevel,
          suggestedDifficultyName: levelNames[suggestedLevel] || "Easy",
          reason: `Accuracy is ${accuracy}% after ${attempts} attempts (Target: ${levelNames[suggestedLevel]})`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: suggestions.length,
      suggestions,
    });
  } catch (error) {
    console.error("GET /api/admin/questions/bank/difficulty-suggestions error:", error);
    return NextResponse.json({ error: "Failed to fetch difficulty suggestions" }, { status: 500 });
  }
}

export async function POST(request) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    const body = await request.json();
    const { questionId, suggestedLevel, applyAll, items } = body;
    const db = await getDb();
    const levelNames = { 1: "easy", 2: "medium", 3: "hard" };

    if (applyAll && Array.isArray(items)) {
      const bulkOps = items
        .filter((item) => ObjectId.isValid(item.id))
        .map((item) => ({
          updateOne: {
            filter: { _id: new ObjectId(item.id) },
            update: {
              $set: {
                difficulty_level: item.suggestedLevel,
                difficulty: levelNames[item.suggestedLevel] || "easy",
                updatedAt: new Date(),
              },
            },
          },
        }));

      if (bulkOps.length > 0) {
        await db.collection("Question").bulkWrite(bulkOps);
      }

      return NextResponse.json({
        success: true,
        appliedCount: bulkOps.length,
      });
    }

    if (!questionId || !ObjectId.isValid(questionId) || !suggestedLevel) {
      return NextResponse.json({ error: "Invalid questionId or suggestedLevel" }, { status: 400 });
    }

    const diffInt = parseInt(suggestedLevel, 10);
    await db.collection("Question").updateOne(
      { _id: new ObjectId(questionId) },
      {
        $set: {
          difficulty_level: diffInt,
          difficulty: levelNames[diffInt] || "easy",
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true, message: "Difficulty updated successfully" });
  } catch (error) {
    console.error("POST /api/admin/questions/bank/difficulty-suggestions error:", error);
    return NextResponse.json({ error: "Failed to apply difficulty suggestions" }, { status: 500 });
  }
}
