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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const search = searchParams.get("search")?.trim() || "";
    const categoryId = searchParams.get("categoryId") || "";
    const topicId = searchParams.get("topicId") || "";
    const difficulty = searchParams.get("difficulty") || "";
    const audience = searchParams.get("audience") || "";
    const exam = searchParams.get("exam") || "";
    const state = searchParams.get("state") || "";
    const status = searchParams.get("status") || "";
    const language = searchParams.get("language") || "";
    const tag = searchParams.get("tag")?.trim() || "";
    const reviewDue = searchParams.get("reviewDue") === "true";

    const db = await getDb();
    const query = {};

    // 1. Text Search
    if (search) {
      query.$or = [
        { text_hi: { $regex: search, $options: "i" } },
        { text_en: { $regex: search, $options: "i" } },
        { text: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // 2. Category & Topic
    if (categoryId && categoryId !== "all") {
      if (ObjectId.isValid(categoryId)) {
        query.$or = (query.$or || []).concat([
          { category_id: new ObjectId(categoryId) },
          { categoryId: new ObjectId(categoryId) },
        ]);
      } else {
        query.category_id = categoryId;
      }
    }

    if (topicId && topicId !== "all") {
      if (ObjectId.isValid(topicId)) {
        query.topic_id = new ObjectId(topicId);
      } else {
        query.topic_id = topicId;
      }
    }

    // 3. Difficulty
    if (difficulty && difficulty !== "all") {
      const diffInt = parseInt(difficulty, 10);
      if (!isNaN(diffInt)) {
        query.difficulty_level = diffInt;
      } else {
        const diffMap = { easy: 1, medium: 2, hard: 3 };
        query.difficulty_level = diffMap[difficulty.toLowerCase()] || 1;
      }
    }

    // 4. Audience
    if (audience && audience !== "all") {
      query.audience = { $in: [audience] };
    }

    // 5. Exam
    if (exam && exam !== "all") {
      query.exam = { $in: [exam] };
    }

    // 6. State
    if (state && state !== "all") {
      query.state = state;
    }

    // 7. Status
    if (status && status !== "all") {
      query.status = status;
    }

    // 8. Tag
    if (tag) {
      query.tags = { $in: [tag] };
    }

    // 9. Language Filter
    if (language === "hi") {
      query.text_hi = { $exists: true, $ne: "" };
    } else if (language === "en") {
      query.text_en = { $exists: true, $ne: null, $ne: "" };
    } else if (language === "both") {
      query.text_hi = { $exists: true, $ne: "" };
      query.text_en = { $exists: true, $ne: null, $ne: "" };
    }

    // 10. Review Due
    if (reviewDue) {
      query.time_sensitive = true;
      query.review_by = { $lte: new Date() };
    }

    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      db.collection("Question").find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection("Question").countDocuments(query),
    ]);

    // Format output
    const formatted = questions.map((q) => {
      let options = q.options_list;
      if (!Array.isArray(options)) {
        try {
          options = typeof q.options === "string" ? JSON.parse(q.options) : q.options || [];
        } catch {
          options = [];
        }
      }

      const attempts = typeof q.attempts === "number" ? q.attempts : 0;
      const correct = typeof q.correct === "number" ? q.correct : 0;
      const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;

      return {
        id: q._id.toString(),
        text_hi: q.text_hi || q.textHi || q.text || "",
        text_en: q.text_en || q.text || "",
        options_list: options,
        correct_index: typeof q.correct_index === "number" ? q.correct_index : 0,
        difficulty_level: q.difficulty_level || (q.difficulty === "hard" ? 3 : q.difficulty === "medium" ? 2 : 1),
        audience: Array.isArray(q.audience) ? q.audience : ["explorer"],
        exam: Array.isArray(q.exam) ? q.exam : [],
        state: q.state || null,
        class_level: q.class_level || null,
        type: q.type || "MCQ",
        status: q.status || "published",
        category_id: q.category_id ? q.category_id.toString() : null,
        topic_id: q.topic_id ? q.topic_id.toString() : null,
        tags: Array.isArray(q.tags) ? q.tags : [],
        explanation_hi: q.explanation_hi || q.explanationHi || "",
        explanation_en: q.explanation_en || q.explanation || "",
        time_sensitive: !!q.time_sensitive,
        review_by: q.review_by || null,
        attempts,
        correct,
        accuracy,
        updatedAt: q.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      questions: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error("GET /api/admin/questions/bank error:", error);
    return NextResponse.json({ error: "Failed to fetch question bank" }, { status: 500 });
  }
}

export async function PATCH(request) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid question id" }, { status: 400 });
    }

    const db = await getDb();
    const setData = {
      updatedAt: new Date(),
    };

    if (updates.text_hi !== undefined) setData.text_hi = updates.text_hi;
    if (updates.text_en !== undefined) {
      setData.text_en = updates.text_en;
      setData.text = updates.text_en; // keep legacy text in sync
    }
    if (updates.options_list !== undefined && Array.isArray(updates.options_list)) {
      setData.options_list = updates.options_list;
      setData.options = JSON.stringify(updates.options_list); // keep legacy options in sync
    }
    if (typeof updates.correct_index === "number") {
      setData.correct_index = updates.correct_index;
      if (Array.isArray(updates.options_list) && updates.options_list[updates.correct_index]) {
        setData.correctAnswer = updates.options_list[updates.correct_index];
      }
    }
    if (updates.difficulty_level !== undefined) {
      const dl = parseInt(updates.difficulty_level, 10);
      setData.difficulty_level = dl;
      setData.difficulty = dl === 3 ? "hard" : dl === 2 ? "medium" : "easy";
    }
    if (updates.audience !== undefined && Array.isArray(updates.audience)) setData.audience = updates.audience;
    if (updates.exam !== undefined && Array.isArray(updates.exam)) setData.exam = updates.exam;
    if (updates.state !== undefined) setData.state = updates.state || null;
    if (updates.status !== undefined) setData.status = updates.status;
    if (updates.tags !== undefined && Array.isArray(updates.tags)) setData.tags = updates.tags;
    if (updates.explanation_hi !== undefined) setData.explanation_hi = updates.explanation_hi;
    if (updates.explanation_en !== undefined) setData.explanation_en = updates.explanation_en;
    if (updates.time_sensitive !== undefined) setData.time_sensitive = !!updates.time_sensitive;
    if (updates.review_by !== undefined) setData.review_by = updates.review_by ? new Date(updates.review_by) : null;

    if (updates.category_id && ObjectId.isValid(updates.category_id)) {
      setData.category_id = new ObjectId(updates.category_id);
    }
    if (updates.topic_id && ObjectId.isValid(updates.topic_id)) {
      setData.topic_id = new ObjectId(updates.topic_id);
    }

    const res = await db.collection("Question").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: setData },
      { returnDocument: "after" }
    );

    return NextResponse.json({ success: true, question: res });
  } catch (error) {
    console.error("PATCH /api/admin/questions/bank error:", error);
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid question id" }, { status: 400 });
    }

    const db = await getDb();
    await db.collection("Question").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true, message: "Question deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/admin/questions/bank error:", error);
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
