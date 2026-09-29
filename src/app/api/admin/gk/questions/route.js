// src/app/api/admin/gk/questions/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongoDb";
import { requireAdmin } from "@/lib/adminSessionServer";
import { GK_CATEGORIES } from "@/lib/gkData";
import { ensureGkDbInitialized } from "@/lib/gkDbInit";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  await ensureGkDbInitialized();
  const db = await getDb();

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || GK_CATEGORIES.INDIA;
    const language = searchParams.get("language") || "en";
    const topicId = searchParams.get("topicId");
    const difficulty = searchParams.get("difficulty");
    const examTag = searchParams.get("examTag");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "30", 10)));

    const filter = {
      $or: [
        { category },
        { masterCategory: "GK", categoryName: category },
      ],
      language,
    };

    if (topicId && topicId !== "all") {
      filter.topicId = topicId;
    }
    if (difficulty && difficulty !== "all") {
      filter.difficulty = difficulty.toLowerCase();
    }
    if (examTag && examTag !== "all") {
      filter.$or = [
        ...(filter.$or || []),
        { examTags: examTag },
        { exam: examTag },
        { tags: examTag },
      ];
    }
    if (search && search.trim()) {
      filter.text = { $regex: search.trim(), $options: "i" };
    }

    const questionCol = db.collection("Question");
    const total = await questionCol.countDocuments(filter);
    const skip = (page - 1) * limit;

    const questions = await questionCol
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Parse options if stored as string
    const formatted = questions.map((q) => {
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
        text: q.text || q.text_en || q.text_hi,
        options: opts,
        correctAnswer: q.correctAnswer,
        correctIndex: q.correctIndex !== undefined ? q.correctIndex : q.correct_index,
        difficulty: q.difficulty,
        category: q.category,
        topicId: q.topicId,
        subTopic: q.subTopic,
        questionType: q.questionType,
        examTags: q.examTags || q.exam || [],
        explanation: q.explanation || q.explanation_en || q.explanation_hi,
        language: q.language,
        createdAt: q.createdAt,
      };
    });

    return NextResponse.json({
      questions: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("GK Questions GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  await ensureGkDbInitialized();
  const db = await getDb();

  try {
    const body = await req.json();
    const { action, questionIds = [], updates } = body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ error: "No question IDs provided" }, { status: 400 });
    }

    const questionCol = db.collection("Question");
    const objectIds = questionIds.map((id) => {
      try {
        return new ObjectId(id);
      } catch {
        return id;
      }
    });

    // ── BULK EDIT TOPIC, DIFFICULTY, OR EXAM TAGS ──
    if (action === "bulk_edit") {
      const setDoc = { updatedAt: new Date() };

      if (updates.topicId) setDoc.topicId = updates.topicId;
      if (updates.difficulty) {
        setDoc.difficulty = updates.difficulty.toLowerCase();
        setDoc.difficulty_level =
          updates.difficulty === "easy"
            ? 1
            : updates.difficulty === "hard"
            ? 3
            : updates.difficulty === "expert"
            ? 4
            : 2;
      }
      if (Array.isArray(updates.examTags)) {
        setDoc.examTags = updates.examTags;
        setDoc.exam = updates.examTags;
      }

      const res = await questionCol.updateMany(
        { _id: { $in: objectIds } },
        { $set: setDoc }
      );

      return NextResponse.json({ success: true, modifiedCount: res.modifiedCount });
    }

    // ── BULK DELETE ──
    if (action === "delete") {
      const res = await questionCol.deleteMany({ _id: { $in: objectIds } });
      return NextResponse.json({ success: true, deletedCount: res.deletedCount });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("GK Questions PUT error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
