import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongoDb";
import { requireAdmin } from "@/lib/adminSessionServer";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    const body = await request.json();
    const { ids, action, updates } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No question IDs provided" }, { status: 400 });
    }

    const objectIds = ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
    if (objectIds.length === 0) {
      return NextResponse.json({ error: "No valid question IDs" }, { status: 400 });
    }

    const db = await getDb();

    // 1. Bulk Delete
    if (action === "delete") {
      const res = await db.collection("Question").deleteMany({ _id: { $in: objectIds } });
      return NextResponse.json({
        success: true,
        deletedCount: res.deletedCount,
      });
    }

    // 2. Bulk Edit
    if (action === "edit" && updates) {
      const setData = { updatedAt: new Date() };

      if (updates.category_id && ObjectId.isValid(updates.category_id)) {
        setData.category_id = new ObjectId(updates.category_id);
      }
      if (updates.topic_id && ObjectId.isValid(updates.topic_id)) {
        setData.topic_id = new ObjectId(updates.topic_id);
      }
      if (updates.difficulty_level !== undefined && updates.difficulty_level !== "") {
        const dl = parseInt(updates.difficulty_level, 10);
        setData.difficulty_level = dl;
        setData.difficulty = dl === 3 ? "hard" : dl === 2 ? "medium" : "easy";
      }
      if (Array.isArray(updates.audience) && updates.audience.length > 0) {
        setData.audience = updates.audience;
      }
      if (Array.isArray(updates.exam) && updates.exam.length > 0) {
        setData.exam = updates.exam;
      }
      if (updates.status) {
        setData.status = updates.status;
      }

      const updateOp = { $set: setData };

      // Tag additions or removals
      if (Array.isArray(updates.addTags) && updates.addTags.length > 0) {
        updateOp.$addToSet = { tags: { $each: updates.addTags } };
      }
      if (Array.isArray(updates.removeTags) && updates.removeTags.length > 0) {
        updateOp.$pullAll = { tags: updates.removeTags };
      }

      const res = await db.collection("Question").updateMany({ _id: { $in: objectIds } }, updateOp);

      return NextResponse.json({
        success: true,
        modifiedCount: res.modifiedCount,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/admin/questions/bank/bulk error:", error);
    return NextResponse.json({ error: "Failed to perform bulk operation" }, { status: 500 });
  }
}
