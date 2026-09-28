import { NextResponse } from "next/server";
import { getTaxonomyTopics } from "@/lib/taxonomy";
import { getDb } from "@/lib/mongoDb";
import { requireAdmin } from "@/lib/adminSessionServer";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    const topics = await getTaxonomyTopics(categoryId ? new ObjectId(categoryId) : null);

    return NextResponse.json({
      success: true,
      count: topics.length,
      topics,
    });
  } catch (error) {
    console.error("GET /api/taxonomy/topics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch taxonomy topics" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    const body = await request.json();
    const { id, categoryId, slug, name, nameHi, description, tags, sortOrder } = body;

    if (!categoryId || !slug || !name || !nameHi) {
      return NextResponse.json(
        { error: "categoryId, slug, name, and nameHi are required fields" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const now = new Date();
    const docData = {
      categoryId: new ObjectId(categoryId),
      slug,
      name,
      nameHi,
      description: description || null,
      tags: Array.isArray(tags) ? tags : [],
      sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
      updatedAt: now,
    };

    let topic;
    if (id) {
      const res = await db.collection("TaxonomyTopic").findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: docData },
        { returnDocument: "after" }
      );
      topic = res;
    } else {
      docData.createdAt = now;
      docData.questionCount = 0;
      const res = await db.collection("TaxonomyTopic").insertOne(docData);
      topic = { ...docData, _id: res.insertedId, id: res.insertedId.toString() };
    }

    return NextResponse.json({ success: true, topic });
  } catch (error) {
    console.error("POST /api/taxonomy/topics error:", error);
    return NextResponse.json(
      { error: "Failed to save taxonomy topic" },
      { status: 500 }
    );
  }
}
