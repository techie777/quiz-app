import { NextResponse } from "next/server";
import { getTaxonomyCategories } from "@/lib/taxonomy";
import { getDb } from "@/lib/mongoDb";
import { requireAdmin } from "@/lib/adminSessionServer";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const audience = searchParams.get("audience");

    const categories = await getTaxonomyCategories({ audience, includeTopics: true });

    return NextResponse.json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("GET /api/taxonomy/categories error:", error);
    return NextResponse.json(
      { error: "Failed to fetch taxonomy categories" },
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
    const { id, slug, name, nameHi, description, descriptionHi, icon, audience, sortOrder } = body;

    if (!slug || !name || !nameHi) {
      return NextResponse.json(
        { error: "slug, name, and nameHi are required fields" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const now = new Date();
    const docData = {
      slug,
      name,
      nameHi,
      description: description || null,
      descriptionHi: descriptionHi || null,
      icon: icon || null,
      audience: Array.isArray(audience) ? audience : ["explorer"],
      sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
      updatedAt: now,
    };

    let category;
    if (id) {
      const res = await db.collection("TaxonomyCategory").findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: docData },
        { returnDocument: "after" }
      );
      category = res;
    } else {
      docData.createdAt = now;
      const res = await db.collection("TaxonomyCategory").insertOne(docData);
      category = { ...docData, _id: res.insertedId, id: res.insertedId.toString() };
    }

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("POST /api/taxonomy/categories error:", error);
    return NextResponse.json(
      { error: "Failed to save taxonomy category" },
      { status: 500 }
    );
  }
}
