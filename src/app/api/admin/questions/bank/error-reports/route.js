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
    const status = searchParams.get("status") || "pending";

    const db = await getDb();
    const filter = status === "all" ? {} : { status };

    const reports = await db
      .collection("QuestionReport")
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    // Enrich with question details
    const questionIds = reports
      .map((r) => r.questionId)
      .filter((id) => id && ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    const questions = await db
      .collection("Question")
      .find({ _id: { $in: questionIds } })
      .toArray();

    const questionMap = new Map();
    for (const q of questions) {
      questionMap.set(q._id.toString(), q);
    }

    const enriched = reports.map((r) => {
      const q = r.questionId ? questionMap.get(r.questionId.toString()) : null;
      return {
        id: r._id.toString(),
        questionId: r.questionId ? r.questionId.toString() : null,
        issue: r.issue,
        details: r.details || "",
        reportedBy: r.reportedBy,
        reportedAt: r.reportedAt || r.createdAt,
        status: r.status,
        question: q
          ? {
              text_hi: q.text_hi || q.textHi || q.text,
              text_en: q.text_en || q.text,
              options_list: q.options_list || [],
              correct_index: q.correct_index || 0,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      count: enriched.length,
      reports: enriched,
    });
  } catch (error) {
    console.error("GET /api/admin/questions/bank/error-reports error:", error);
    return NextResponse.json({ error: "Failed to fetch error reports" }, { status: 500 });
  }
}

export async function PATCH(request) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    const body = await request.json();
    const { reportId, status = "resolved" } = body;

    if (!reportId || !ObjectId.isValid(reportId)) {
      return NextResponse.json({ error: "Invalid reportId" }, { status: 400 });
    }

    const db = await getDb();
    const res = await db.collection("QuestionReport").findOneAndUpdate(
      { _id: new ObjectId(reportId) },
      {
        $set: {
          status,
          resolvedBy: adminCheck.admin?.username || "admin",
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    return NextResponse.json({ success: true, report: res });
  } catch (error) {
    console.error("PATCH /api/admin/questions/bank/error-reports error:", error);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}
