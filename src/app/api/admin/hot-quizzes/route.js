import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongoDb";
import { HOT_QUIZZES_SEED } from "@/lib/hotQuizzesData";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    let sets = await db
      .collection("quiz_sets")
      .find({})
      .project({
        id: 1,
        slug: 1,
        title: 1,
        titleHi: 1,
        format: 1,
        hot: 1,
        hotRank: 1,
        coverImage: 1,
        questionCount: 1,
      })
      .sort({ hotRank: 1, title: 1 })
      .toArray();

    if (!sets || sets.length === 0) {
      sets = HOT_QUIZZES_SEED;
    }

    return NextResponse.json({ success: true, quizzes: sets });
  } catch (err) {
    console.error("Admin hot quizzes GET error:", err);
    return NextResponse.json({ success: true, quizzes: HOT_QUIZZES_SEED });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, hot, hotRank, format, coverImage } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Quiz ID is required" }, { status: 400 });
    }

    const db = await getDb();
    const updateFields = {};
    if (hot !== undefined) updateFields.hot = Boolean(hot);
    if (hotRank !== undefined) updateFields.hotRank = Number(hotRank) || 99;
    if (format !== undefined) updateFields.format = format;
    if (coverImage !== undefined) updateFields.coverImage = coverImage;
    updateFields.updatedAt = new Date();

    await db.collection("quiz_sets").updateOne(
      { $or: [{ id: String(id) }, { slug: String(id) }] },
      { $set: updateFields },
      { upsert: true }
    );

    return NextResponse.json({ success: true, message: "Quiz updated successfully" });
  } catch (err) {
    console.error("Admin hot quizzes POST error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
