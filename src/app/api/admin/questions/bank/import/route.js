import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongoDb";
import { requireAdmin } from "@/lib/adminSessionServer";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      if (insideQuotes && line[i + 1] === char) {
        current += char;
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export async function POST(request) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    const body = await request.json();
    const { format = "json", content, defaultCategoryId, defaultTopicId } = body;

    let items = [];

    if (format === "csv") {
      if (typeof content !== "string" || !content.trim()) {
        return NextResponse.json({ error: "CSV content is empty" }, { status: 400 });
      }

      const lines = content
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length < 2) {
        return NextResponse.json(
          { error: "CSV must have a header row and at least 1 data row" },
          { status: 400 }
        );
      }

      const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, ""));

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const obj = { _rowNum: i + 1 };
        headers.forEach((h, idx) => {
          obj[h] = values[idx] || "";
        });
        items.push(obj);
      }
    } else {
      // JSON format
      if (!Array.isArray(content) || content.length === 0) {
        return NextResponse.json({ error: "JSON content must be a non-empty array" }, { status: 400 });
      }
      items = content.map((item, idx) => ({ ...item, _rowNum: idx + 1 }));
    }

    const errors = [];
    const validQuestions = [];
    const now = new Date();

    for (const item of items) {
      const rowNum = item._rowNum;

      // 1. Text validation
      const textHi = (item.text_hi || item.question_hi || item.text || item.question || "").trim();
      const textEn = (item.text_en || item.question_en || "").trim();

      if (!textHi && !textEn) {
        errors.push({ row: rowNum, error: "Question text (Hindi or English) is required" });
        continue;
      }

      // 2. Options validation (exactly 4 options)
      let optionsList = [];
      if (Array.isArray(item.options)) {
        optionsList = item.options.map((o) => String(o).trim());
      } else if (item.option1 || item.option_1 || item.opt1) {
        optionsList = [
          String(item.option1 || item.option_1 || item.opt1 || "").trim(),
          String(item.option2 || item.option_2 || item.opt2 || "").trim(),
          String(item.option3 || item.option_3 || item.opt3 || "").trim(),
          String(item.option4 || item.option_4 || item.opt4 || "").trim(),
        ];
      } else if (typeof item.options === "string") {
        try {
          const parsed = JSON.parse(item.options);
          if (Array.isArray(parsed)) optionsList = parsed.map((o) => String(o).trim());
        } catch {
          optionsList = item.options.split("|").map((o) => o.trim());
        }
      }

      if (optionsList.length !== 4 || optionsList.some((o) => !o)) {
        errors.push({
          row: rowNum,
          error: `Must provide exactly 4 non-empty options (found ${optionsList.length})`,
        });
        continue;
      }

      // 3. Correct answer validation
      let correctIdx = 0;
      const rawAns = item.correct_index ?? item.correct_answer ?? item.answer ?? item.correctAnswer;

      if (typeof rawAns === "number" && rawAns >= 0 && rawAns < 4) {
        correctIdx = rawAns;
      } else if (typeof rawAns === "string") {
        const trimmed = rawAns.trim();
        const num = parseInt(trimmed, 10);
        if (!isNaN(num) && num >= 0 && num < 4) {
          correctIdx = num;
        } else {
          // Check matching option text
          const foundIdx = optionsList.findIndex((o) => o.toLowerCase() === trimmed.toLowerCase());
          if (foundIdx !== -1) {
            correctIdx = foundIdx;
          } else {
            // Check letters A, B, C, D
            const letterMap = { a: 0, b: 1, c: 2, d: 3, "1": 0, "2": 1, "3": 2, "4": 3 };
            if (letterMap[trimmed.toLowerCase()] !== undefined) {
              correctIdx = letterMap[trimmed.toLowerCase()];
            } else {
              errors.push({
                row: rowNum,
                error: `Correct answer "${trimmed}" does not match any of the 4 options`,
              });
              continue;
            }
          }
        }
      }

      // 4. Difficulty
      let diffLevel = 1;
      const rawDiff = String(item.difficulty_level || item.difficulty || "1").toLowerCase();
      if (rawDiff === "2" || rawDiff === "medium") diffLevel = 2;
      else if (rawDiff === "3" || rawDiff === "hard") diffLevel = 3;

      // 5. Audience
      let audience = ["explorer"];
      if (Array.isArray(item.audience)) audience = item.audience;
      else if (typeof item.audience === "string" && item.audience.trim()) {
        audience = item.audience.split(/[,|]/).map((a) => a.trim().toLowerCase());
      }

      // 6. Category & Topic
      const catId = item.category_id || defaultCategoryId || null;
      const topId = item.topic_id || defaultTopicId || null;

      // 7. Tags
      let tags = [];
      if (Array.isArray(item.tags)) tags = item.tags;
      else if (typeof item.tags === "string" && item.tags.trim()) {
        tags = item.tags.split(/[,|]/).map((t) => t.trim().toLowerCase());
      }

      validQuestions.push({
        text_hi: textHi || textEn,
        text_en: textEn || null,
        text: textEn || textHi,
        textHi: textHi || null,
        options_list: optionsList,
        options: JSON.stringify(optionsList),
        correct_index: correctIdx,
        correctAnswer: optionsList[correctIdx],
        difficulty_level: diffLevel,
        difficulty: diffLevel === 3 ? "hard" : diffLevel === 2 ? "medium" : "easy",
        audience,
        exam: Array.isArray(item.exam) ? item.exam : [],
        state: item.state || null,
        class_level: item.class_level ? parseInt(item.class_level, 10) : null,
        type: item.type || "MCQ",
        image_url: item.image_url || item.image || null,
        image: item.image_url || item.image || null,
        time_sensitive: !!item.time_sensitive,
        review_by: item.review_by ? new Date(item.review_by) : null,
        status: item.status || "published",
        source: item.source || "Bulk Import",
        attempts: 0,
        correct: 0,
        explanation_hi: item.explanation_hi || item.explanation || null,
        explanation_en: item.explanation_en || item.explanation || null,
        explanation: item.explanation_en || item.explanation || null,
        explanationHi: item.explanation_hi || null,
        category_id: catId && ObjectId.isValid(catId) ? new ObjectId(catId) : null,
        categoryId: catId && ObjectId.isValid(catId) ? new ObjectId(catId) : null,
        topic_id: topId && ObjectId.isValid(topId) ? new ObjectId(topId) : null,
        tags,
        createdAt: now,
        updatedAt: now,
      });
    }

    const db = await getDb();
    let importedCount = 0;

    if (validQuestions.length > 0) {
      const res = await db.collection("Question").insertMany(validQuestions);
      importedCount = res.insertedCount;
    }

    return NextResponse.json({
      success: true,
      totalRows: items.length,
      importedCount,
      errorCount: errors.length,
      errors: errors.slice(0, 50), // Return top 50 errors if many
    });
  } catch (error) {
    console.error("POST /api/admin/questions/bank/import error:", error);
    return NextResponse.json({ error: "Failed to import questions" }, { status: 500 });
  }
}
