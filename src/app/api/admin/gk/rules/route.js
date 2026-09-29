// src/app/api/admin/gk/rules/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongoDb";
import { requireAdmin } from "@/lib/adminSessionServer";
import { GK_CATEGORIES, DEFAULT_GK_RULES } from "@/lib/gkData";
import { checkGkFeasibility } from "@/lib/gkEngine";
import { ensureGkDbInitialized } from "@/lib/gkDbInit";

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

    const rulesCol = db.collection("gk_rules");
    let rules = await rulesCol.findOne({ category, language });

    if (!rules) {
      rules = {
        category,
        language,
        ...DEFAULT_GK_RULES,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await rulesCol.insertOne(rules);
    }

    // Load questions for feasibility analysis
    const questionCol = db.collection("Question");
    const questions = await questionCol
      .find(
        {
          $or: [
            { category },
            { masterCategory: "GK", categoryName: category },
          ],
          language,
        },
        { projection: { difficulty: 1, topicId: 1 } }
      )
      .toArray();

    // Check feasibility using engine
    const feasibility = checkGkFeasibility(questions, rules);

    return NextResponse.json({ rules, feasibility });
  } catch (err) {
    console.error("GK Rules GET error:", err);
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
    const { category = GK_CATEGORIES.INDIA, language = "en", rules } = body;

    if (!rules) {
      return NextResponse.json({ error: "Missing rules data" }, { status: 400 });
    }

    const rulesCol = db.collection("gk_rules");
    const updateDoc = {
      setSize: Number(rules.setSize) || 20,
      topicSetMix: rules.topicSetMix || DEFAULT_GK_RULES.topicSetMix,
      ramp: rules.ramp || DEFAULT_GK_RULES.ramp,
      maxPerTopicInMasterSet: Number(rules.maxPerTopicInMasterSet) || 3,
      updatedAt: new Date(),
    };

    await rulesCol.updateOne(
      { category, language },
      {
        $set: updateDoc,
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, rules: { category, language, ...updateDoc } });
  } catch (err) {
    console.error("GK Rules PUT error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
