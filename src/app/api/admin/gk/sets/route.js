// src/app/api/admin/gk/sets/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongoDb";
import { requireAdmin } from "@/lib/adminSessionServer";
import { GK_CATEGORIES, DEFAULT_GK_RULES } from "@/lib/gkData";
import { generateGkSetsDryRun, saveGeneratedSets } from "@/lib/gkEngine";
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
    const scope = searchParams.get("scope"); // "topic" | "master" | null
    const topicId = searchParams.get("topicId");
    const status = searchParams.get("status"); // "draft" | "published" | null
    const setId = searchParams.get("setId");

    const setsCol = db.collection("gk_sets");

    // If requesting single set with question details
    if (setId) {
      const setDoc = await setsCol.findOne({ id: setId });
      if (!setDoc) {
        return NextResponse.json({ error: "Set not found" }, { status: 404 });
      }

      // Fetch the questions inside this set
      const qCol = db.collection("Question");
      const questionObjectIds = (setDoc.questionIds || []).map((id) => {
        try {
          const { ObjectId } = require("mongodb");
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

      // Maintain question order as in setDoc.questionIds
      const qMap = new Map();
      questions.forEach((q) => {
        qMap.set(String(q._id), q);
        if (q.id) qMap.set(String(q.id), q);
      });

      const orderedQuestions = (setDoc.questionIds || [])
        .map((qid) => qMap.get(String(qid)))
        .filter(Boolean);

      return NextResponse.json({ set: setDoc, questions: orderedQuestions });
    }

    // List query
    const filter = { category, language };
    if (scope) filter.scope = scope;
    if (topicId) filter.topicId = topicId;
    if (status) filter.status = status;

    const sets = await setsCol.find(filter).sort({ scope: 1, number: 1 }).toArray();

    return NextResponse.json({ sets });
  } catch (err) {
    console.error("GK Sets GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  await ensureGkDbInitialized();
  const db = await getDb();

  try {
    const body = await req.json();
    const {
      action,
      category = GK_CATEGORIES.INDIA,
      language = "en",
      type = "all", // "topic" | "master" | "all"
      regenerateUnlockedOnly = true,
      allowPartialFinalSet = false,
      pinnedTopicIds = [],
    } = body;

    const setsCol = db.collection("gk_sets");
    const rulesCol = db.collection("gk_rules");
    const topicsCol = db.collection("gk_topics");
    const questionCol = db.collection("Question");

    // Fetch rules
    const rules = (await rulesCol.findOne({ category, language })) || DEFAULT_GK_RULES;

    // Fetch topics in admin order
    const topics = await topicsCol.find({ category, active: true }).sort({ order: 1 }).toArray();

    // Fetch published questions for category & language
    const questions = await questionCol
      .find({
        $or: [
          { category },
          { masterCategory: "GK", categoryName: category },
        ],
        language,
        status: "published",
      })
      .toArray();

    // Fetch existing sets
    const existingSets = await setsCol.find({ category, language }).toArray();

    // ── DRY RUN PREVIEW ──
    if (action === "dry_run") {
      const preview = generateGkSetsDryRun({
        category,
        language,
        topics,
        questions,
        existingSets,
        rules,
        regenerateUnlockedOnly,
        allowPartialFinalSet,
        pinnedTopicIds,
        type,
      });

      return NextResponse.json({ success: true, preview });
    }

    // ── EXECUTE GENERATION & SAVE ──
    if (action === "generate") {
      const dryRunResult = generateGkSetsDryRun({
        category,
        language,
        topics,
        questions,
        existingSets,
        rules,
        regenerateUnlockedOnly,
        allowPartialFinalSet,
        pinnedTopicIds,
        type,
      });

      const saveResult = await saveGeneratedSets({
        db,
        generatedTopicSets: dryRunResult.topicSets,
        generatedMasterSets: dryRunResult.masterSets,
        category,
        language,
        regenerateUnlockedOnly,
        type,
      });

      return NextResponse.json({
        success: true,
        summary: saveResult,
        dryRunResult: {
          topicSetsCount: dryRunResult.topicSets.length,
          masterSetsCount: dryRunResult.masterSets.length,
          leftovers: dryRunResult.leftovers,
        },
      });
    }

    // ── PUBLISH / UNPUBLISH SET ──
    if (action === "publish" || action === "unpublish") {
      const { setId } = body;
      if (!setId) return NextResponse.json({ error: "Missing setId" }, { status: 400 });

      const isPublish = action === "publish";
      await setsCol.updateOne(
        { id: setId },
        {
          $set: {
            status: isPublish ? "published" : "draft",
            locked: isPublish, // Published sets become locked to protect user progress
            updatedAt: new Date(),
          },
        }
      );
      return NextResponse.json({ success: true, status: isPublish ? "published" : "draft" });
    }

    // ── CREATE NEW VERSION OF LOCKED SET ──
    if (action === "new_version") {
      const { setId } = body;
      const target = await setsCol.findOne({ id: setId });
      if (!target) return NextResponse.json({ error: "Set not found" }, { status: 404 });

      const newId = `${target.id}_v${Date.now().toString(36)}`;
      const newDoc = {
        ...target,
        _id: undefined,
        id: newId,
        status: "draft",
        locked: false,
        version: (target.version || 1) + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setsCol.insertOne(newDoc);
      return NextResponse.json({ success: true, newSetId: newId });
    }

    // ── UPDATE SET TAGS ──
    if (action === "update_tags") {
      const { setId, tags } = body;
      if (!setId || !Array.isArray(tags)) {
        return NextResponse.json({ error: "Invalid setId or tags" }, { status: 400 });
      }

      await setsCol.updateOne(
        { id: setId },
        { $set: { tags: tags.map((t) => String(t).trim()).filter(Boolean), updatedAt: new Date() } }
      );
      return NextResponse.json({ success: true, message: "Tags updated" });
    }

    // ── SWAP QUESTION IN SET ──
    if (action === "swap_question") {
      const { setId, oldQuestionId, newQuestionId } = body;
      if (!setId || !oldQuestionId || !newQuestionId) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
      }

      const target = await setsCol.findOne({ id: setId });
      if (!target) return NextResponse.json({ error: "Set not found" }, { status: 404 });

      const idx = (target.questionIds || []).indexOf(oldQuestionId);
      if (idx === -1) {
        return NextResponse.json({ error: "Old question not found in set" }, { status: 400 });
      }

      const updatedIds = [...target.questionIds];
      updatedIds[idx] = newQuestionId;

      await setsCol.updateOne(
        { id: setId },
        { $set: { questionIds: updatedIds, updatedAt: new Date() } }
      );
      return NextResponse.json({ success: true, message: "Question swapped" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("GK Sets POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
