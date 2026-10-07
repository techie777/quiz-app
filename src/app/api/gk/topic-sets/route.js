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
          } else if (Array.isArray(q.options_list)) {
            opts = q.options_list.map(o => typeof o === 'object' && o !== null ? (o.text || o.text_hi || o.text_en || '') : String(o));
          }

          let optsHi = q.optionsHi;
          if (typeof optsHi === "string") {
            try {
              optsHi = JSON.parse(optsHi);
            } catch {
              optsHi = undefined;
            }
          }
          if (!Array.isArray(optsHi) && Array.isArray(q.options_list)) {
            optsHi = q.options_list.map(o => typeof o === 'object' && o !== null ? (o.text_hi || o.text || '') : String(o));
          }

          return {
            id: String(q._id),
            _id: String(q._id),
            text: language === "hi" && q.textHi ? q.textHi : q.text || q.text_en,
            textHi: q.textHi,
            options: language === "hi" && Array.isArray(optsHi) && optsHi.length > 0 ? optsHi : opts,
            optionsHi: Array.isArray(optsHi) ? optsHi : undefined,
            correctAnswer: q.correctAnswer,
            correctIndex: q.correctIndex !== undefined ? q.correctIndex : q.correct_index,
            difficulty: q.difficulty,
            difficulty_level: q.difficulty_level,
            explanation: language === "hi"
              ? (q.explanationHi || q.explanation_hi || q.hindiExplanation || (q.explanation && /[\u0900-\u097F]/.test(q.explanation) ? q.explanation : "") || q.explanation || "")
              : (q.explanationEn || q.explanation_en || q.englishExplanation || q.explanation || ""),
            explanationHi: q.explanationHi || q.explanation_hi || q.hindiExplanation || (q.explanation && /[\u0900-\u097F]/.test(q.explanation) ? q.explanation : "") || "",
            explanation_hi: q.explanation_hi || q.explanationHi || q.hindiExplanation || (q.explanation && /[\u0900-\u097F]/.test(q.explanation) ? q.explanation : "") || "",
            hindiExplanation: q.hindiExplanation || q.explanationHi || q.explanation_hi || (q.explanation && /[\u0900-\u097F]/.test(q.explanation) ? q.explanation : "") || "",
            explanationEn: q.explanationEn || q.explanation_en || q.englishExplanation || q.explanation || "",
            explanation_en: q.explanation_en || q.explanationEn || q.englishExplanation || q.explanation || "",
            englishExplanation: q.englishExplanation || q.explanationEn || q.explanation_en || q.explanation || "",
            examTags: Array.isArray(q.examTags) ? q.examTags : (Array.isArray(q.exam) ? q.exam : []),
            subTopic: q.subTopic,
            questionType: q.questionType,
          };
        });

      return NextResponse.json({ set: setDoc, questions: orderedQuestions });
    }

    // ── IF REQUESTING TOPIC OR SUBJECT SETS LIST ──
    const subjectId = searchParams.get("subjectId");
    if (!topicId && !subjectId) {
      return NextResponse.json({ error: "Missing topicId or subjectId" }, { status: 400 });
    }

    const topicsCol = db.collection("gk_topics");
    const subjectsCol = db.collection("gk_subjects");

    let topicDoc = null;
    let subjectDoc = null;

    if (subjectId) {
      subjectDoc = await subjectsCol.findOne({ $or: [{ id: subjectId }, { slug: subjectId }] });
      if (subjectDoc?.topicId) {
        topicDoc = await topicsCol.findOne({ id: subjectDoc.topicId });
      }
    }

    if (!topicDoc && topicId) {
      topicDoc = await topicsCol.findOne({ $or: [{ id: topicId }, { slug: topicId }] });
    }

    // Filter sets by subjectId or topicId without restrictive scope
    const setFilter = {
      language,
      status: "published",
    };

    if (subjectDoc) {
      setFilter.$or = [{ subjectId: subjectDoc.id }, { subjectId: subjectId }];
    } else if (topicDoc) {
      setFilter.$or = [{ topicId: topicDoc.id }, { topicId: topicId }];
    }

    const sets = await setsCol
      .find(setFilter)
      .project({ questions: 0 })
      .sort({ number: 1 })
      .toArray();

    // Fetch subjects under this topic if available
    let subjects = [];
    if (topicDoc) {
      subjects = await subjectsCol
        .find({ topicId: topicDoc.id, status: "published" })
        .sort({ order: 1, name: 1 })
        .toArray();
    }

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
        title: s.title || `Set ${s.number}`,
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        tags: s.tags || [],
        mix: s.mix,
        badge: s.badge || "Standard",
        questionCount: (s.questionIds || []).length || 20,
        stars: p?.stars || 0,
        bestScore: p?.bestScore || 0,
        attempts: p?.attempts || 0,
        completed: Boolean(p?.completedAt || (p?.bestScore !== undefined && p.bestScore >= 0)),
      };
    });

    return NextResponse.json({
      topic: topicDoc,
      subject: subjectDoc,
      subjects,
      sets: enrichedSets,
      totalSets: enrichedSets.length,
    });
  } catch (err) {
    console.error("GK Topic Sets API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
