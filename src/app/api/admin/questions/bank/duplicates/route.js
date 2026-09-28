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
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    const db = await getDb();
    const filter = {};
    if (categoryId && categoryId !== "all" && ObjectId.isValid(categoryId)) {
      filter.$or = [{ category_id: new ObjectId(categoryId) }, { categoryId: new ObjectId(categoryId) }];
    }

    const questions = await db
      .collection("Question")
      .find(filter, { projection: { text_hi: 1, text_en: 1, text: 1, options_list: 1, category_id: 1 } })
      .limit(1000)
      .toArray();

    const tokenized = questions.map((q) => {
      const fullText = `${q.text_hi || ""} ${q.text_en || ""} ${q.text || ""}`.toLowerCase();
      const words = new Set(
        fullText
          .replace(/[^\w\s\u0900-\u097F]/g, "")
          .split(/\s+/)
          .filter((w) => w.length > 2)
      );
      return { id: q._id.toString(), text: q.text_hi || q.text_en || q.text, words };
    });

    const duplicates = [];
    const seenPairs = new Set();

    for (let i = 0; i < tokenized.length; i++) {
      const q1 = tokenized[i];
      if (q1.words.size < 3) continue;

      for (let j = i + 1; j < tokenized.length; j++) {
        const q2 = tokenized[j];
        if (q2.words.size < 3) continue;

        let intersection = 0;
        for (const w of q1.words) {
          if (q2.words.has(w)) intersection++;
        }

        const minLen = Math.min(q1.words.size, q2.words.size);
        const score = Math.round((intersection / minLen) * 100);

        if (score >= 75) {
          const pairKey = [q1.id, q2.id].sort().join(":");
          if (!seenPairs.has(pairKey)) {
            seenPairs.add(pairKey);
            duplicates.push({
              q1: { id: q1.id, text: q1.text },
              q2: { id: q2.id, text: q2.text },
              similarity: score,
            });
          }
        }
      }

      if (duplicates.length >= 50) break; // Return top 50 duplicates for instant responsiveness
    }

    return NextResponse.json({
      success: true,
      scannedCount: questions.length,
      count: duplicates.length,
      duplicates,
    });
  } catch (error) {
    console.error("GET /api/admin/questions/bank/duplicates error:", error);
    return NextResponse.json({ error: "Failed to scan duplicates" }, { status: 500 });
  }
}
