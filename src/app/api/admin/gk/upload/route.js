// src/app/api/admin/gk/upload/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongoDb";
import { requireAdmin } from "@/lib/adminSessionServer";
import { calculateQuestionHash, GK_CATEGORIES } from "@/lib/gkData";
import { ensureGkDbInitialized } from "@/lib/gkDbInit";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

// Normalizes difficulty string
function normalizeDifficulty(diff) {
  const d = String(diff || "").trim().toLowerCase();
  if (d === "easy" || d === "सरल" || d === "1") return "easy";
  if (d === "medium" || d === "मध्यम" || d === "2") return "medium";
  if (d === "hard" || d === "कठिन" || d === "3") return "hard";
  if (d === "expert" || d === "विशेषज्ञ" || d === "4") return "expert";
  return null;
}

// Normalizes language string
function normalizeLanguage(lang) {
  const l = String(lang || "").trim().toLowerCase();
  if (l.includes("hi") || l.includes("हिंदी") || l.includes("hindi")) return "hi";
  return "en";
}

// Normalizes category string
function normalizeCategory(cat) {
  const c = String(cat || "").trim().toLowerCase();
  if (c.includes("world") || c.includes("विश्व")) return GK_CATEGORIES.WORLD;
  if (c.includes("india") || c.includes("भारत")) return GK_CATEGORIES.INDIA;
  return null;
}

// Normalizes correct answer to 0..3 index
function parseCorrectIndex(rawAnswer, options) {
  if (rawAnswer === undefined || rawAnswer === null) return -1;
  const str = String(rawAnswer).trim();

  // If 1-4 numeric
  const num = parseInt(str, 10);
  if (!isNaN(num) && num >= 1 && num <= 4) {
    return num - 1;
  }

  // If 0-3 numeric
  if (!isNaN(num) && num >= 0 && num <= 3 && options && options[num]) {
    // Only if rawAnswer was explicitly 0
    if (str === "0") return 0;
  }

  // If A, B, C, D (or A., B., etc)
  const letterMatch = str.match(/^([A-Da-d])(\.|\:|\s|$)/);
  if (letterMatch) {
    const charCode = letterMatch[1].toUpperCase().charCodeAt(0);
    return charCode - 65; // 'A' -> 0
  }

  // If matching exact option text
  if (Array.isArray(options)) {
    const cleanStr = str.toLowerCase().trim();
    const idx = options.findIndex((opt) => String(opt || "").toLowerCase().trim() === cleanStr);
    if (idx !== -1) return idx;
  }

  return -1;
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
    const { action } = body;

    // ── 1. ACTION: CREATE TOPICS ──
    if (action === "create_topics") {
      const { newTopics, category = GK_CATEGORIES.INDIA } = body;
      if (!Array.isArray(newTopics) || newTopics.length === 0) {
        return NextResponse.json({ error: "No topics provided" }, { status: 400 });
      }

      const topicsCol = db.collection("gk_topics");
      const highestOrderDoc = await topicsCol
        .find({ category })
        .sort({ order: -1 })
        .limit(1)
        .toArray();
      let nextOrder = highestOrderDoc.length > 0 ? (highestOrderDoc[0].order || 0) + 1 : 1;

      const created = [];
      for (const tName of newTopics) {
        const trimmed = String(tName).trim();
        if (!trimmed) continue;

        // Check if exists
        const existing = await topicsCol.findOne({
          category,
          $or: [
            { name: { $regex: `^${trimmed}$`, $options: "i" } },
            { nameHi: { $regex: `^${trimmed}$`, $options: "i" } },
          ],
        });

        if (existing) {
          created.push(existing);
          continue;
        }

        const slug = trimmed
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .slice(0, 50);

        const newDoc = {
          id: `topic_${slug}_${Date.now().toString(36)}`,
          category,
          name: trimmed,
          nameHi: trimmed,
          icon: "📚",
          tint: "#F8FAFC",
          order: nextOrder++,
          weight: 1,
          active: true,
          showOnHome: false,
          homeOrder: 99,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await topicsCol.insertOne(newDoc);
        created.push(newDoc);
      }

      return NextResponse.json({ success: true, createdCount: created.length, topics: created });
    }

    // ── 2. ACTION: VALIDATE ROWS ──
    if (action === "validate") {
      const { rows, defaultCategory, defaultTopicId } = body;
      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json({ error: "No data rows provided" }, { status: 400 });
      }

      // Fetch all topics for fast in-memory matching
      const allTopics = await db.collection("gk_topics").find({}).toArray();
      const topicMap = new Map();
      allTopics.forEach((t) => {
        if (t.name) topicMap.set(t.name.toLowerCase().trim(), t);
        if (t.nameHi) topicMap.set(t.nameHi.toLowerCase().trim(), t);
        if (t.id) topicMap.set(t.id, t);
      });

      const errors = [];
      const warnings = [];
      const missingTopicsSet = new Set();
      const hashes = [];
      const validatedRows = [];

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const rowNum = i + 2;

        const text = String(r.question || r.Question || r.text || "").trim();
        const optA = String(r.optionA || r["Option A"] || r["Option 1"] || r.opt1 || "").trim();
        const optB = String(r.optionB || r["Option B"] || r["Option 2"] || r.opt2 || "").trim();
        const optC = String(r.optionC || r["Option C"] || r["Option 3"] || r.opt3 || "").trim();
        const optD = String(r.optionD || r["Option D"] || r["Option 4"] || r.opt4 || "").trim();
        const rawAns = r.correctAnswer || r["Correct Answer"] || r.answer || r.correct;
        const rawDiff = r.difficulty || r["Difficulty"];
        const rawCat = r.category || r["Category"] || defaultCategory || GK_CATEGORIES.INDIA;
        const rawLang = r.language || r["Language"] || "en";
        const rawTopic = r.topic || r["Topic"] || defaultTopicId || "";
        const rawExam = r.examTags || r["Exam Tags"] || r.exam || "";
        const rawSubTopic = r.subTopic || r["Sub Topic"] || "";
        const rawQType = r.questionType || r["Question Type"] || "Explore";

        // Required text & options
        if (!text) {
          errors.push({ row: rowNum, reason: "Missing question text" });
          continue;
        }
        if (!optA || !optB || !optC || !optD) {
          errors.push({ row: rowNum, reason: "All 4 options (A, B, C, D) are required" });
          continue;
        }

        const options = [optA, optB, optC, optD];
        const correctIndex = parseCorrectIndex(rawAns, options);
        if (correctIndex < 0 || correctIndex > 3) {
          errors.push({
            row: rowNum,
            reason: `Invalid correct answer '${rawAns}'. Expected A/B/C/D, 1-4, or option text`,
          });
          continue;
        }

        const difficulty = normalizeDifficulty(rawDiff);
        if (!difficulty) {
          errors.push({
            row: rowNum,
            reason: `Invalid difficulty '${rawDiff}'. Must be Easy, Medium, Hard, or Expert`,
          });
          continue;
        }

        const category = normalizeCategory(rawCat);
        if (!category) {
          errors.push({
            row: rowNum,
            reason: `Category must be 'India GK' or 'World GK' (received '${rawCat}')`,
          });
          continue;
        }

        const language = normalizeLanguage(rawLang);

        // Topic resolution
        let topicObj = null;
        if (rawTopic) {
          topicObj = topicMap.get(String(rawTopic).toLowerCase().trim()) || null;
        }
        if (!topicObj && rawTopic) {
          missingTopicsSet.add(String(rawTopic).trim());
        }

        // Exam tags
        let examTags = [];
        if (Array.isArray(rawExam)) {
          examTags = rawExam.map((t) => String(t).trim()).filter(Boolean);
        } else if (typeof rawExam === "string" && rawExam.trim()) {
          examTags = rawExam
            .split(/[,;|]/)
            .map((t) => t.trim())
            .filter(Boolean);
        }
        // De-duplicate exam tags
        examTags = Array.from(new Set(examTags));

        // Generate SHA-1 hash for duplicate detection
        const hash = calculateQuestionHash(text, language);
        hashes.push(hash);

        validatedRows.push({
          rowNum,
          text,
          options,
          correctIndex,
          correctAnswer: options[correctIndex],
          difficulty,
          category,
          language,
          topicName: rawTopic,
          topicId: topicObj ? topicObj.id : null,
          subTopic: String(rawSubTopic).trim(),
          questionType: String(rawQType).trim(),
          explanation: String(r.explanation || r["Explanation"] || "").trim(),
          examTags,
          hash,
        });
      }

      // Check duplicates in MongoDB
      const duplicateHashes = new Set();
      if (hashes.length > 0) {
        const found = await db
          .collection("Question")
          .find({ hash: { $in: hashes } }, { projection: { hash: 1 } })
          .toArray();
        found.forEach((item) => {
          if (item.hash) duplicateHashes.add(item.hash);
        });
      }

      // Mark duplicate rows
      let dupCount = 0;
      validatedRows.forEach((r) => {
        if (duplicateHashes.has(r.hash)) {
          r.isDuplicate = true;
          dupCount++;
        }
      });

      return NextResponse.json({
        totalRows: rows.length,
        validCount: validatedRows.length,
        errorCount: errors.length,
        duplicateCount: dupCount,
        errors,
        missingTopics: Array.from(missingTopicsSet),
        previewRows: validatedRows.slice(0, 50),
        allValidated: validatedRows,
      });
    }

    // ── 3. ACTION: IMPORT BATCH ──
    if (action === "import") {
      const { questions, mode = "add_new" } = body;
      if (!Array.isArray(questions) || questions.length === 0) {
        return NextResponse.json({ error: "No questions to import" }, { status: 400 });
      }

      // Find standard category IDs for India GK and World GK in Category collection
      const indiaCat = await db.collection("Category").findOne({ topic: "India GK" });
      const worldCat = await db.collection("Category").findOne({ topic: "World GK" });

      const indiaCatId = indiaCat?._id || new ObjectId("69d03ea978a47c2438020859");
      const worldCatId = worldCat?._id || new ObjectId("69d03eab78a47c2438020860");

      let insertedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const importErrors = [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const rowNum = q.rowNum || i + 2;

        try {
          const catId = q.category === GK_CATEGORIES.WORLD ? worldCatId : indiaCatId;
          const diffLevel =
            q.difficulty === "easy" ? 1 : q.difficulty === "hard" ? 3 : q.difficulty === "expert" ? 4 : 2;

          const questionDoc = {
            text: q.text,
            options: JSON.stringify(q.options),
            options_list: Array.isArray(q.options)
              ? q.options.map((opt) => (typeof opt === "object" && opt !== null ? opt.text || opt.text_en || String(opt) : String(opt)))
              : [],
            correctAnswer: q.correctAnswer || "",
            correct: 0,
            correct_index: typeof q.correctIndex === "number" ? q.correctIndex : 0,
            correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
            difficulty: q.difficulty,
            difficulty_level: diffLevel,
            explanation: q.explanation || "",
            language: q.language || "en",
            masterCategory: "GK",
            category: q.category,
            categoryName: q.category,
            categoryId: catId,
            category_id: catId,
            topicId: q.topicId || null,
            subTopic: q.subTopic || "",
            questionType: q.questionType || "Explore",
            examTags: q.examTags || [],
            exam: q.examTags || [],
            tags: q.examTags || [],
            hash: q.hash || calculateQuestionHash(q.text, q.language || "en"),
            status: "published",
            updatedAt: new Date(),
          };

          if (q.language === "hi") {
            questionDoc.textHi = q.text;
            questionDoc.text_hi = q.text;
            questionDoc.optionsHi = JSON.stringify(q.options);
            questionDoc.explanationHi = q.explanation || "";
            questionDoc.explanation_hi = q.explanation || "";
          } else {
            questionDoc.text_en = q.text;
            questionDoc.explanation_en = q.explanation || "";
          }

          if (mode === "update_existing") {
            const res = await db.collection("Question").updateOne(
              { hash: questionDoc.hash },
              {
                $set: questionDoc,
                $setOnInsert: { createdAt: new Date() },
              },
              { upsert: true }
            );
            if (res.upsertedCount > 0) insertedCount++;
            else updatedCount++;
          } else {
            // "add_new": skip if duplicate exists
            const existing = await db.collection("Question").findOne({ hash: questionDoc.hash });
            if (existing) {
              skippedCount++;
            } else {
              questionDoc.createdAt = new Date();
              await db.collection("Question").insertOne(questionDoc);
              insertedCount++;
            }
          }
        } catch (itemErr) {
          importErrors.push({ row: rowNum, reason: itemErr.message });
        }
      }

      return NextResponse.json({
        success: true,
        insertedCount,
        updatedCount,
        skippedCount,
        errorCount: importErrors.length,
        errors: importErrors,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("GK Upload route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
