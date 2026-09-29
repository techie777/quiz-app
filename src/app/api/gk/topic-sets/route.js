// src/app/api/gk/topic-sets/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongoDb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ensureGkDbInitialized } from "@/lib/gkDbInit";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(req) {
  await ensureGkDbInitialized();
  const db = await getDb();

  try {
    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get("topicId");
    const setId = searchParams.get("setId");
    const language = searchParams.get("language") || "en";
    const deviceId = req.headers.get("x-device-id") || searchParams.get("deviceId") || "";

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    const setsCol = db.collection("gk_sets");
    const progressCol = db.collection("gk_progress");

    // ── IF REQUESTING QUESTIONS FOR A SPECIFIC SET (TO PLAY OR PREVIEW) ──
    if (setId) {
      const setDoc = await setsCol.findOne({ id: setId });
      if (!setDoc) {
        return NextResponse.json({ error: "Set not found" }, { status: 404 });
      }

      const qCol = db.collection("Question");
      const questionObjectIds = (setDoc.questionIds || []).map((id) => {
        try {
          return new ObjectId(id);
        } catch {
          return id;
        }
      });

      const questions = await qCol
        .find({
          $or: [
            { _id: { $in: questionObjectIds } },
            { id: { $in: setDoc.questionIds || [] } },
          ],
        })
        .toArray();

      const qMap = new Map();
      questions.forEach((q) => {
        qMap.set(String(q._id), q);
        if (q.id) qMap.set(String(q.id), q);
      });

      // Preserve strict ordering: easy -> medium -> hard -> expert
      const orderedQuestions = (setDoc.questionIds || [])
        .map((qid) => qMap.get(String(qid)))
        .filter(Boolean)
        .map((q) => {
          let opts = q.options_list || [];
          if (typeof q.options === "string") {
            try {
              opts = JSON.parse(q.options);
            } catch {
              opts = [q.options];
            }
          } else if (Array.isArray(q.options)) {
            opts = q.options;
          }

          return {
            id: String(q._id),
            _id: String(q._id),
            text: language === "hi" && q.textHi ? q.textHi : q.text || q.text_en,
            textHi: q.textHi,
            options: language === "hi" && q.optionsHi ? q.optionsHi : opts,
            optionsHi: q.optionsHi,
            correctAnswer: q.correctAnswer,
            correctIndex: q.correctIndex !== undefined ? q.correctIndex : q.correct_index,
            difficulty: q.difficulty,
            difficulty_level: q.difficulty_level,
            explanation: language === "hi" && q.explanationHi ? q.explanationHi : q.explanation,
            explanationHi: q.explanationHi,
            examTags: q.examTags || q.exam || [],
            subTopic: q.subTopic,
            questionType: q.questionType,
          };
        });

      return NextResponse.json({ set: setDoc, questions: orderedQuestions });
    }

    // ── IF REQUESTING TOPIC SETS LIST ──
    if (!topicId) {
      return NextResponse.json({ error: "Missing topicId" }, { status: 400 });
    }

    const topicsCol = db.collection("gk_topics");
    const topicDoc = await topicsCol.findOne({ id: topicId });

    const sets = await setsCol
      .find({
        topicId,
        language,
        scope: "topic",
        status: "published",
      })
      .sort({ number: 1 })
      .toArray();

    // Fetch User Progress
    const userProgressFilter = userId
      ? { $or: [{ userId }, { deviceId: deviceId || "none" }] }
      : { deviceId: deviceId || "none" };

    const userProgressDocs = await progressCol.find(userProgressFilter).toArray();
    const progressMap = new Map();
    userProgressDocs.forEach((p) => {
      progressMap.set(p.setId, p);
    });

    const enrichedSets = sets.map((s) => {
      const p = progressMap.get(s.id);
      return {
        id: s.id,
        number: s.number,
        tags: s.tags || [],
        mix: s.mix,
        questionCount: (s.questionIds || []).length || 20,
        stars: p?.stars || 0,
        bestScore: p?.bestScore || 0,
        attempts: p?.attempts || 0,
        completed: Boolean(p?.completedAt || (p?.bestScore !== undefined && p.bestScore >= 0)),
      };
    });

    return NextResponse.json({
      topic: topicDoc,
      sets: enrichedSets,
      totalSets: enrichedSets.length,
    });
  } catch (err) {
    console.error("GK Topic Sets API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
