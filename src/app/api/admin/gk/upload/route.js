// src/app/api/admin/gk/upload/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongoDb";
import { requireAdmin } from "@/lib/adminSessionServer";
import { calculateQuestionHash, GK_CATEGORIES } from "@/lib/gkData";
import { ensureGkDbInitialized } from "@/lib/gkDbInit";
import { resolveHierarchy, backfillExistingQuestions } from "@/lib/hierarchyService";
import { buildStaticSetsInSheetOrder, saveGeneratedStaticSets } from "@/lib/staticSetGenerator";
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
  return GK_CATEGORIES.INDIA;
}

// Normalizes correct answer to 0..3 index
function parseCorrectIndex(rawAnswer, options) {
  if (rawAnswer === undefined || rawAnswer === null) return -1;
  const str = String(rawAnswer).trim();
  if (!str) return -1;

  // 1. If A, B, C, D (or A., B., A:, a), etc.)
  const letterMatch = str.match(/^([A-Da-d])(\.|\:|\)|\s|$)/);
  if (letterMatch) {
    const charCode = letterMatch[1].toUpperCase().charCodeAt(0);
    return charCode - 65; // 'A' -> 0
  }

  // 2. If 1-4 numeric (or 1., 2:, 3), etc.)
  const numberMatch = str.match(/^([1-4])(\.|\:|\)|\s|$)/);
  if (numberMatch) {
    return parseInt(numberMatch[1], 10) - 1;
  }

  // 3. If matching exact option text
  if (Array.isArray(options)) {
    const cleanStr = str.toLowerCase().trim();
    const idx = options.findIndex((opt) => String(opt || "").toLowerCase().trim() === cleanStr);
    if (idx !== -1) return idx;

    // Substring match if options contain or are contained by answer string
    const partialIdx = options.findIndex((opt) => {
      const cOpt = String(opt || "").toLowerCase().trim();
      return cOpt && (cleanStr.includes(cOpt) || cOpt.includes(cleanStr));
    });
    if (partialIdx !== -1) return partialIdx;
  }

  return -1;
}

/**
 * Case-insensitive, whitespace-agnostic & punctuation-tolerant field reader by header name
 */
function getFieldByHeader(row, headerNames) {
  if (!row || typeof row !== "object") return "";

  // 1. Direct key lookup
  for (const name of headerNames) {
    if (row[name] !== undefined && row[name] !== null && String(row[name]).trim() !== "") {
      return String(row[name]).trim();
    }
  }

  // 2. Normalized key lookup (ignoring case, spaces, underscores, hyphens)
  const normKeys = Object.keys(row).map((k) => ({
    original: k,
    normalized: String(k || "").toLowerCase().replace(/[\s_\-]/g, ""),
  }));

  for (const name of headerNames) {
    const targetNorm = String(name || "").toLowerCase().replace(/[\s_\-]/g, "");
    const match = normKeys.find((k) => k.normalized === targetNorm);
    if (match && row[match.original] !== undefined && row[match.original] !== null) {
      const val = String(row[match.original]).trim();
      if (val !== "") return val;
    }
  }

  return "";
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

    // ── 0. ACTION: BACKFILL SUBJECTS FOR EXISTING QUESTIONS (Task 1.1) ──
    if (action === "backfill") {
      const result = await backfillExistingQuestions(db);
      return NextResponse.json({ success: true, ...result });
    }

    // ── 1. ACTION: VALIDATE ROWS & DRY RUN (Rule 3 & Rule 4) ──
    if (action === "validate") {
      const { rows, defaultCategory, categoryId, defaultTopicId } = body;
      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json({ error: "No data rows provided" }, { status: 400 });
      }

      // Resolve target category from Category collection if selected by admin
      let targetCat = null;
      if (categoryId && ObjectId.isValid(categoryId)) {
        targetCat = await db.collection("Category").findOne({ _id: new ObjectId(categoryId) });
      } else if (defaultCategory) {
        targetCat = await db.collection("Category").findOne({
          $or: [
            { topic: { $regex: `^${defaultCategory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
            { name: { $regex: `^${defaultCategory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
            { slug: defaultCategory.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
          ],
        });
      }

      const finalCatName = targetCat ? targetCat.topic : (defaultCategory || "General Knowledge");

      const errors = [];
      const warnings = [];
      const hashes = [];
      const validatedRows = [];

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const rowNum = i + 2;

        // Read by header name (Rule 3 & Standard 14-Column Template)
        const text = getFieldByHeader(r, ["questions", "question", "text", "qtext", "q_text"]);
        const optA = getFieldByHeader(r, ["option a", "optiona", "option 1", "opt a", "opt1", "a"]);
        const optB = getFieldByHeader(r, ["option b", "optionb", "option 2", "opt b", "opt2", "b"]);
        const optC = getFieldByHeader(r, ["option c", "optionc", "option 3", "opt c", "opt3", "c"]);
        const optD = getFieldByHeader(r, ["option d", "optiond", "option 4", "opt d", "opt4", "d"]);
        const rawAns = getFieldByHeader(r, ["correct answer", "correctanswer", "correct answer (1-4)", "answer", "correct", "ans"]);
        const rawDiff = getFieldByHeader(r, ["difficulty", "diff", "level"]);
        const rawMaster = getFieldByHeader(r, ["main category", "maincategory", "main_category", "master category", "mastercategory", "master_category"]) || "India GK";
        const sheetCat = getFieldByHeader(r, ["sub category", "subcategory", "sub_category", "category"]);
        const rawCat = sheetCat || finalCatName;
        const rawTopic = getFieldByHeader(r, ["topic name", "topicname", "topic_name", "topic"]) || rawCat;
        const rawSubject = getFieldByHeader(r, ["subject", "subject name", "subjectname", "sub topic", "subtopic", "sub_topic"]) || rawTopic;
        const rawKeywords = getFieldByHeader(r, ["keywords/tags", "keywords", "keywords in english", "keywords_en", "keyword", "keywordsen", "exam tags", "examtags", "tags"]);
        const rawHindiExp = getFieldByHeader(r, ["hindi explanation", "hindiexplanation", "hindi_explanation", "explanation_hi", "explanation hi"]);
        const rawEnglishExp = getFieldByHeader(r, ["english explanation", "englishexplanation", "english_explanation", "explanation_en", "explanation en"]);
        const rawGenExp = getFieldByHeader(r, ["explanation", "exp", "solution", "notes"]);
        const rawLang = getFieldByHeader(r, ["language", "lang"]) || "hi";
        const rawQType = getFieldByHeader(r, ["question type", "questiontype", "type"]) || "MCQ";

        const language = normalizeLanguage(rawLang);
        const hindiExplanation = rawHindiExp || (language === "hi" ? rawGenExp : "");
        const englishExplanation = rawEnglishExp || (language === "en" ? rawGenExp : "");
        const explanation = (language === "hi" ? hindiExplanation : englishExplanation) || rawGenExp || hindiExplanation || englishExplanation || "";

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
            reason: `Invalid correct answer '${rawAns}'. Expected A, B, C, D or 1, 2, 3, 4`,
          });
          continue;
        }

        const difficulty = normalizeDifficulty(rawDiff) || "medium";
        const category = finalCatName;

        // Keywords in English list
        const keywordsList = rawKeywords
          ? rawKeywords.split(/[,;|]/).map((t) => t.trim()).filter(Boolean)
          : [];

        // Hash for duplicate check
        const hash = calculateQuestionHash(text, language);
        hashes.push(hash);

        validatedRows.push({
          rowNum,
          text,
          options,
          correctIndex,
          correctAnswer: options[correctIndex],
          difficulty,
          masterCategory: rawMaster,
          category: rawCat,
          language,
          topic: rawTopic,
          topicName: rawTopic,
          subject: rawSubject,
          subjectName: rawSubject,
          questionType: rawQType,
          explanation,
          hindiExplanation,
          englishExplanation,
          keywords: keywordsList,
          keywordsEn: rawKeywords,
          keywords_en: rawKeywords,
          examTags: keywordsList,
          hash,
        });
      }

      // Check duplicates against Question collection
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

      let dupCount = 0;
      validatedRows.forEach((r) => {
        if (duplicateHashes.has(r.hash)) {
          r.isDuplicate = true;
          dupCount++;
        }
      });

      // ── DRY RUN CALCULATION (Rule 4: 7/7/6 sheet order, 20/set) ──
      // Group valid, non-duplicate questions under their specific category + subject + language
      const validForSets = validatedRows.filter((r) => !r.isDuplicate);
      const groups = {};
      validForSets.forEach((r) => {
        const key = `${r.masterCategory}:::${r.category}:::${r.topicName}:::${r.subjectName}:::${r.language}`;
        if (!groups[key]) {
          groups[key] = {
            masterCategory: r.masterCategory,
            category: r.category,
            subjectName: r.subjectName,
            topicName: r.topicName,
            language: r.language,
            questions: [],
          };
        }
        groups[key].questions.push(r);
      });

      let dryRunTotalSets = 0;
      let dryRunTotalRemainders = 0;
      const dryRunSetsPreview = [];
      const setWarnings = [];

      for (const group of Object.values(groups)) {
        const buildInfo = buildStaticSetsInSheetOrder({
          questions: group.questions,
          existingRemainder: [], // dry-run estimate for this file
          startingSetNumber: 1,
          subjectId: "preview",
          subjectName: group.subjectName,
          topicId: "preview",
          topicName: group.topicName,
          category: group.category,
          masterCategory: "GK",
          language: group.language,
        });

        dryRunTotalSets += buildInfo.totalCreatedSets;
        dryRunTotalRemainders += buildInfo.remainderCount;
        if (buildInfo.warnings.length > 0) {
          setWarnings.push(...buildInfo.warnings);
        }
        buildInfo.sets.forEach((s) => {
          dryRunSetsPreview.push({
            subjectName: group.subjectName,
            topicName: group.topicName,
            setNumber: s.number,
            questionCount: s.questions.length,
            mix: s.mix,
            mixWarning: s.mixWarning,
            language: group.language,
          });
        });
      }

      return NextResponse.json({
        totalRows: rows.length,
        validCount: validatedRows.length,
        errorCount: errors.length,
        duplicateCount: dupCount,
        errors,
        warnings: [...warnings, ...setWarnings],
        dryRun: {
          estimatedSets: dryRunTotalSets,
          estimatedRemainders: dryRunTotalRemainders,
          setsPreview: dryRunSetsPreview.slice(0, 20),
        },
        previewRows: validatedRows.slice(0, 50),
        allValidated: validatedRows,
      });
    }

    // ── 2. ACTION: IMPORT BATCH & AUTO-GENERATE SETS (Rule 1 & Rule 4) ──
    if (action === "import") {
      const { questions, mode = "add_new", fileName = "bulk_upload.xlsx", categoryId, category: reqCat } = body;
      if (!Array.isArray(questions) || questions.length === 0) {
        return NextResponse.json({ error: "No questions to import" }, { status: 400 });
      }

      let catObjectId = null;
      let targetCat = null;
      if (categoryId && ObjectId.isValid(categoryId)) {
        catObjectId = new ObjectId(categoryId);
        targetCat = await db.collection("Category").findOne({ _id: catObjectId });
      } else if (reqCat) {
        targetCat = await db.collection("Category").findOne({
          $or: [
            { topic: { $regex: `^${reqCat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
            { name: { $regex: `^${reqCat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
            { slug: reqCat.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
          ],
        });
        if (targetCat) catObjectId = targetCat._id;
      }

      const finalCatName = targetCat ? targetCat.topic : (reqCat || "General Knowledge");
      const finalCatSlug = targetCat?.slug || finalCatName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const finalCatIdStr = catObjectId ? catObjectId.toString() : finalCatSlug;

      const batchId = `batch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const importErrors = [];
      const insertedQuestions = [];
      let skippedCount = 0;

      // Group questions by Category + Language for auto set generation
      const subjectLanguageGroups = {};

      // Batch query existing questions in 1 roundtrip
      const allHashes = questions.map((q) => q.hash || calculateQuestionHash(q.text, q.language || "hi"));
      const existingDocs = await db
        .collection("Question")
        .find({ hash: { $in: allHashes } })
        .toArray();
      const existingMap = new Map();
      existingDocs.forEach((doc) => {
        if (doc.hash) existingMap.set(doc.hash, doc);
      });

      const toInsert = [];
      const toUpdate = [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const rowNum = q.rowNum || i + 2;

        try {
          // Check duplicate
          const hash = q.hash || calculateQuestionHash(q.text, q.language || "hi");
          const existing = existingMap.get(hash);

          if (existing && mode === "add_new") {
            skippedCount++;
            continue;
          }

          const qCat = q.category || finalCatName;
          const qMaster = q.masterCategory || "GK";
          const qTopic = q.topic || q.topicName || qCat;
          const qSubject = q.subject || q.subjectName || qTopic;

          const hier = await resolveHierarchy(db, {
            masterCategory: qMaster,
            category: qCat,
            topic: qTopic,
            subject: qSubject,
          });

          const targetCategoryId = catObjectId || hier.categoryId || (targetCat ? targetCat._id : undefined);

          const diffLevel =
            q.difficulty === "easy" ? 1 : q.difficulty === "hard" ? 3 : q.difficulty === "expert" ? 4 : 2;

          const optionsList = Array.isArray(q.options)
            ? q.options.map((opt, idx) => ({
                id: String(idx + 1),
                text: String(opt || ""),
                text_en: String(opt || ""),
                text_hi: q.language === "hi" ? String(opt || "") : undefined,
              }))
            : [];

          const questionDoc = {
            text: q.text,
            text_en: q.language === "en" ? q.text : undefined,
            text_hi: q.language === "hi" ? q.text : undefined,
            textHi: q.language === "hi" ? q.text : undefined,
            options: JSON.stringify(q.options),
            options_list: optionsList,
            optionsHi: q.language === "hi" ? JSON.stringify(q.options) : undefined,
            correctAnswer: q.correctAnswer || (q.options && q.options[q.correctIndex]) || "",
            correct: q.correctAnswer || (q.options && q.options[q.correctIndex]) || "",
            correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
            correct_index: typeof q.correctIndex === "number" ? q.correctIndex : 0,
            difficulty: q.difficulty || "medium",
            difficulty_level: diffLevel,
            explanation: q.explanation || (q.language === "hi" ? q.hindiExplanation : q.englishExplanation) || "",
            explanation_en: q.englishExplanation || (q.language === "en" ? q.explanation : undefined),
            explanation_hi: q.hindiExplanation || (q.language === "hi" ? q.explanation : undefined),
            explanationHi: q.hindiExplanation || (q.language === "hi" ? q.explanation : undefined),
            explanationEn: q.englishExplanation || (q.language === "en" ? q.explanation : undefined),
            hindiExplanation: q.hindiExplanation || undefined,
            englishExplanation: q.englishExplanation || undefined,
            keywords: q.keywords || [],
            keywords_en: q.keywordsEn || q.keywords_en || (Array.isArray(q.keywords) ? q.keywords.join(", ") : "") || undefined,
            keywordsEn: q.keywordsEn || q.keywords_en || (Array.isArray(q.keywords) ? q.keywords.join(", ") : "") || undefined,
            language: q.language || "hi",
            masterCategory: hier.masterCategory,
            categoryId: targetCategoryId,
            category: hier.category,
            categoryName: hier.category,
            topic: hier.topicName,
            topicName: hier.topicName,
            topicId: hier.topicId,
            topicSlug: hier.topicSlug,
            subject: hier.subjectName,
            subjectName: hier.subjectName,
            subjectId: hier.subjectId,
            subjectSlug: hier.subjectSlug,
            subTopic: hier.subjectName,
            questionType: q.questionType || "MCQ",
            examTags: q.examTags || q.keywords || [],
            exam: q.examTags || q.keywords || [],
            tags: q.keywords || q.examTags || [],
            hash,
            status: "published",
            source: "Bulk Upload Sheet",
            importBatchId: batchId,
            sourceRow: rowNum,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          if (existing && mode === "update_existing") {
            questionDoc._id = existing._id;
            toUpdate.push({ _id: existing._id, doc: questionDoc });
          } else {
            toInsert.push(questionDoc);
          }

          // Group by MasterCategory + Category + Topic + Subject + Language for set generation
          const groupKey = `${hier.masterCategory}:::${hier.category}:::${hier.topicId}:::${hier.subjectId}:::${q.language || "hi"}`;
          if (!subjectLanguageGroups[groupKey]) {
            subjectLanguageGroups[groupKey] = {
              subjectId: hier.subjectId,
              subjectName: hier.subjectName,
              topicId: hier.topicId,
              topicName: hier.topicName,
              category: hier.category,
              categoryId: targetCategoryId ? targetCategoryId.toString() : undefined,
              masterCategory: hier.masterCategory,
              language: q.language || "hi",
              questions: [],
            };
          }
          subjectLanguageGroups[groupKey].questions.push(questionDoc);
        } catch (itemErr) {
          importErrors.push({ row: rowNum, reason: itemErr.message });
        }
      }

      // Execute bulk insert and update in parallel
      if (toInsert.length > 0) {
        const insertRes = await db.collection("Question").insertMany(toInsert);
        Object.keys(insertRes.insertedIds).forEach((idx) => {
          toInsert[idx]._id = insertRes.insertedIds[idx];
        });
        insertedQuestions.push(...toInsert);
      }
      if (toUpdate.length > 0) {
        const bulkOps = toUpdate.map((u) => ({
          updateOne: {
            filter: { _id: u._id },
            update: { $set: { ...u.doc, updatedAt: new Date() } },
          },
        }));
        await db.collection("Question").bulkWrite(bulkOps);
        insertedQuestions.push(...toUpdate.map((u) => u.doc));
      }

      // ── 3. AUTOMATICALLY CREATE SETS IN SHEET ORDER (Rule 1 & Rule 4) ──
      const allCreatedSets = [];
      const allSetWarnings = [];
      let totalRemainderCount = 0;

      for (const group of Object.values(subjectLanguageGroups)) {
        const setGenResult = await saveGeneratedStaticSets({
          db,
          subjectId: group.subjectId,
          subjectName: group.subjectName,
          topicId: group.topicId,
          topicName: group.topicName,
          category: group.category,
          categoryId: group.categoryId,
          masterCategory: group.masterCategory,
          language: group.language,
          newQuestions: group.questions,
          batchId,
        });

        allCreatedSets.push(...setGenResult.sets);
        allSetWarnings.push(...setGenResult.warnings);
        totalRemainderCount += setGenResult.remainderCount;
      }

      // Update question count in Category collection for all touched categories
      const touchedCatIds = new Set();
      if (catObjectId) touchedCatIds.add(catObjectId.toString());
      toInsert.concat(toUpdate.map((u) => u.doc)).forEach((doc) => {
        if (doc.categoryId) touchedCatIds.add(doc.categoryId.toString());
      });

      for (const cIdStr of touchedCatIds) {
        if (ObjectId.isValid(cIdStr)) {
          const cOid = new ObjectId(cIdStr);
          const totalCatQ = await db.collection("Question").countDocuments({
            categoryId: cOid,
            status: "published",
          });
          await db.collection("Category").updateOne(
            { _id: cOid },
            { $set: { questionCount: totalCatQ, updatedAt: new Date() } }
          );
        }
      }

      // ── 4. BUILT-IN VERIFICATION CHECK (Rule 1) ──
      let verified = false;
      if (allCreatedSets.length > 0) {
        const verifyCheck = await db.collection("gk_sets").countDocuments({
          id: { $in: allCreatedSets.map((s) => s.id) },
          status: "published",
        });
        verified = verifyCheck === allCreatedSets.length;
      } else {
        verified = true;
      }

      // Record batch in import_batches
      const batchDoc = {
        id: batchId,
        fileName,
        rowsRead: questions.length,
        rowsImported: insertedQuestions.length,
        rowsRejected: importErrors.length,
        setsCreatedCount: allCreatedSets.length,
        setsCreated: allCreatedSets.map((s) => ({
          id: s.id,
          number: s.number,
          title: s.title,
          subjectName: s.subjectName,
          language: s.language,
          questionCount: s.questions.length,
        })),
        warnings: allSetWarnings,
        remainderCount: totalRemainderCount,
        verified,
        status: verified ? "success" : "verification_failed",
        createdAt: new Date(),
      };
      await db.collection("import_batches").insertOne(batchDoc);

      if (!verified) {
        return NextResponse.json(
          {
            error: "Verification failed: sets were created but could not be queried by customer API.",
            batch: batchDoc,
          },
          { status: 500 }
        );
      }

      // Construct customer website link
      const viewUrl = `/category/${finalCatSlug}`;

      return NextResponse.json({
        success: true,
        batchId,
        rowsRead: questions.length,
        rowsImported: insertedQuestions.length,
        rowsRejected: importErrors.length,
        skippedCount,
        setsCreatedCount: allCreatedSets.length,
        setsCreated: batchDoc.setsCreated,
        warnings: allSetWarnings,
        remainderCount: totalRemainderCount,
        viewUrl,
        verified: true,
        errors: importErrors,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("GK Upload route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
