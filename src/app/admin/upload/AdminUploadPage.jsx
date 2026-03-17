"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { useData } from "@/context/DataContext";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminUpload.module.css";

const DIFFICULTIES = ["easy", "medium", "hard"];

function parseExcelRows(rows) {
  const errors = [];
  const questions = [];

  rows.forEach((row, i) => {
    const rowNum = i + 2; // account for header row
    const question = String(row["Question"] || "").trim();
    const opt1 = String(row["Option 1"] || "").trim();
    const opt2 = String(row["Option 2"] || "").trim();
    const opt3 = String(row["Option 3"] || "").trim();
    const opt4 = String(row["Option 4"] || "").trim();
    const correctRaw = row["Correct Answer"];
    const diffRaw = String(row["Difficulty"] || "").trim().toLowerCase();

    if (!question) { errors.push(`Row ${rowNum}: missing Question`); return; }
    if (!opt1 || !opt2 || !opt3 || !opt4) { errors.push(`Row ${rowNum}: all 4 options are required`); return; }

    const correctNum = parseInt(correctRaw, 10);
    if (isNaN(correctNum) || correctNum < 1 || correctNum > 4) {
      errors.push(`Row ${rowNum}: Correct Answer must be 1-4`);
      return;
    }

    if (!DIFFICULTIES.includes(diffRaw)) {
      errors.push(`Row ${rowNum}: Difficulty must be Easy, Medium, or Hard`);
      return;
    }

    const options = [opt1, opt2, opt3, opt4];
    questions.push({
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}_${i}`,
      text: question,
      options,
      correctAnswer: options[correctNum - 1],
      difficulty: diffRaw,
    });
  });

  return { questions, errors };
}

function generateSampleXlsx() {
  const data = [
    { "Question": "What is the capital of France?", "Option 1": "London", "Option 2": "Berlin", "Option 3": "Paris", "Option 4": "Madrid", "Correct Answer": 3, "Difficulty": "Easy" },
    { "Question": "What is 2 + 2?", "Option 1": "3", "Option 2": "4", "Option 3": "5", "Option 4": "6", "Correct Answer": 2, "Difficulty": "Easy" },
    { "Question": "Who wrote Hamlet?", "Option 1": "Dickens", "Option 2": "Shakespeare", "Option 3": "Austen", "Option 4": "Twain", "Correct Answer": 2, "Difficulty": "Medium" },
  ];
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 16 }, { wch: 12 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Questions");
  XLSX.writeFile(wb, "sample-quiz-template.xlsx");
}

const EXAMPLE_JSON = `[
  {
    "id": "music",
    "topic": "Music",
    "emoji": "🎵",
    "description": "Test your music knowledge",
    "categoryClass": "category-music",
    "questions": [
      {
        "id": "mus1",
        "difficulty": "easy",
        "text": "How many strings does a guitar have?",
        "options": ["4", "5", "6", "7"],
        "correctAnswer": "6"
      }
    ]
  }
]`;

function validateJsonImport(data) {
  const errors = [];
  if (!Array.isArray(data)) return ["Data must be a JSON array of categories"];
  data.forEach((cat, ci) => {
    if (!cat.id) errors.push(`Category ${ci + 1}: missing "id"`);
    if (!cat.topic) errors.push(`Category ${ci + 1}: missing "topic"`);
    if (!cat.emoji) errors.push(`Category ${ci + 1}: missing "emoji"`);
    if (!Array.isArray(cat.questions)) {
      errors.push(`Category ${ci + 1}: "questions" must be an array`);
    } else {
      cat.questions.forEach((q, qi) => {
        if (!q.id) errors.push(`Category "${cat.id}" Q${qi + 1}: missing "id"`);
        if (!q.text) errors.push(`Category "${cat.id}" Q${qi + 1}: missing "text"`);
        if (!Array.isArray(q.options) || q.options.length !== 4)
          errors.push(`Category "${cat.id}" Q${qi + 1}: needs exactly 4 options`);
        if (!q.correctAnswer) errors.push(`Category "${cat.id}" Q${qi + 1}: missing "correctAnswer"`);
        if (!DIFFICULTIES.includes(q.difficulty))
          errors.push(`Category "${cat.id}" Q${qi + 1}: difficulty must be easy/medium/hard`);
      });
    }
  });
  return errors;
}

async function submitPending(type, payload) {
  const res = await fetch("/api/admin/pending", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, payload }),
  });
  if (res.ok) alert("Your change has been submitted for approval.");
  else alert("Failed to submit change for approval.");
}

export default function AdminUploadPage() {
  const { quizzes, addQuestion, bulkImport } = useData();
  const { adminUser } = useAdmin();
  const isJr = adminUser?.role === "jr";
  const [tab, setTab] = useState("excel"); // "excel" | "json"

  // Excel state
  const [selectedCatId, setSelectedCatId] = useState(quizzes[0]?.id || "");
  const [excelPreview, setExcelPreview] = useState(null);
  const [excelErrors, setExcelErrors] = useState([]);
  const [excelSuccess, setExcelSuccess] = useState(false);

  // JSON state
  const [jsonText, setJsonText] = useState("");
  const [jsonErrors, setJsonErrors] = useState([]);
  const [jsonPreview, setJsonPreview] = useState(null);
  const [jsonSuccess, setJsonSuccess] = useState(false);

  // ===== Excel handlers =====
  const handleExcelFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setExcelErrors([]);
    setExcelPreview(null);
    setExcelSuccess(false);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);

        if (rows.length === 0) {
          setExcelErrors(["The Excel file has no data rows."]);
          return;
        }

        const { questions, errors } = parseExcelRows(rows);
        if (errors.length > 0) {
          setExcelErrors(errors);
          return;
        }

        setExcelPreview(questions);
      } catch (err) {
        setExcelErrors(["Failed to read Excel file: " + err.message]);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleExcelImport = async () => {
    if (!excelPreview || !selectedCatId) return;
    if (isJr) {
      await submitPending("bulk_add_questions", { categoryId: selectedCatId, questions: excelPreview });
    } else {
      excelPreview.forEach((q) => addQuestion(selectedCatId, q));
    }
    setExcelSuccess(true);
    setExcelPreview(null);
  };

  // ===== JSON handlers =====
  const handleJsonValidate = () => {
    setJsonErrors([]);
    setJsonPreview(null);
    setJsonSuccess(false);

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      setJsonErrors(["Invalid JSON: " + e.message]);
      return;
    }

    const validationErrors = validateJsonImport(parsed);
    if (validationErrors.length > 0) {
      setJsonErrors(validationErrors);
      return;
    }
    setJsonPreview(parsed);
  };

  const handleJsonImport = async () => {
    if (!jsonPreview) return;
    if (isJr) {
      await submitPending("bulk_import", { categories: jsonPreview });
    } else {
      bulkImport(jsonPreview);
    }
    setJsonSuccess(true);
    setJsonPreview(null);
    setJsonText("");
  };

  const handleJsonFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setJsonText(ev.target.result);
      setJsonErrors([]);
      setJsonPreview(null);
      setJsonSuccess(false);
    };
    reader.readAsText(file);
  };

  const jsonTotalQuestions = jsonPreview
    ? jsonPreview.reduce((sum, c) => sum + (c.questions?.length || 0), 0)
    : 0;

  const selectedCatName = quizzes.find((c) => c.id === selectedCatId)?.topic || "";

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Bulk Upload</h1>
      <p className={styles.subtitle}>Import questions via Excel or JSON</p>

      {/* Tab Switcher */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "excel" ? styles.tabActive : ""}`}
          onClick={() => setTab("excel")}
        >
          📊 Excel Upload
        </button>
        <button
          className={`${styles.tab} ${tab === "json" ? styles.tabActive : ""}`}
          onClick={() => setTab("json")}
        >
          📋 JSON Upload
        </button>
      </div>

      {/* ===== EXCEL TAB ===== */}
      {tab === "excel" && (
        <div>
          {excelSuccess && (
            <div className={styles.successBanner}>
              ✅ Successfully imported {excelPreview?.length ?? ""} questions into "{selectedCatName}"!
            </div>
          )}

          {/* Category Selection */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Select Category</label>
            <select
              className={styles.select}
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
            >
              {quizzes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.topic}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload */}
          <div className={styles.uploadSection}>
            <label className={styles.fileLabel}>
              📁 Upload Excel File (.xlsx)
              <input type="file" accept=".xlsx,.xls" onChange={handleExcelFile} hidden />
            </label>
            <button className="btn-secondary" onClick={generateSampleXlsx}>
              ⬇️ Download Sample Template
            </button>
          </div>

          <div className={styles.formatHint}>
            <strong>Required columns:</strong> Question, Option 1, Option 2, Option 3, Option 4, Correct Answer (1-4), Difficulty (Easy/Medium/Hard)
          </div>

          {/* Errors */}
          {excelErrors.length > 0 && (
            <div className={styles.errorBox}>
              <strong>❌ Validation Errors:</strong>
              <ul>
                {excelErrors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {/* Preview */}
          {excelPreview && (
            <div className={styles.previewBox}>
              <h3>Preview</h3>
              <p>{excelPreview.length} questions ready to import into "{selectedCatName}"</p>
              <div className={styles.previewList}>
                {excelPreview.slice(0, 5).map((q, i) => (
                  <div key={i} className={`${styles.previewCard} glass-card`}>
                    <span>{q.text}</span>
                    <span className={styles.previewCount}>{q.difficulty}</span>
                  </div>
                ))}
                {excelPreview.length > 5 && (
                  <p className={styles.previewMore}>...and {excelPreview.length - 5} more</p>
                )}
              </div>
              <button className="btn-primary" onClick={handleExcelImport}>
                🚀 Import {excelPreview.length} Questions
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== JSON TAB ===== */}
      {tab === "json" && (
        <div>
          {jsonSuccess && (
            <div className={styles.successBanner}>
              ✅ Import successful! Data has been merged with existing content.
            </div>
          )}

          <div className={styles.uploadSection}>
            <label className={styles.fileLabel}>
              📁 Upload JSON File
              <input type="file" accept=".json" onChange={handleJsonFile} hidden />
            </label>
            <span className={styles.orText}>or paste JSON below</span>
          </div>

          <textarea
            className={styles.textarea}
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setJsonErrors([]);
              setJsonPreview(null);
              setJsonSuccess(false);
            }}
            placeholder="Paste your JSON here..."
            rows={14}
          />

          <div className={styles.actions}>
            <button className="btn-primary" onClick={handleJsonValidate} disabled={!jsonText.trim()}>
              Validate & Preview
            </button>
            <button className="btn-secondary" onClick={() => setJsonText(EXAMPLE_JSON)}>
              Load Example
            </button>
          </div>

          {jsonErrors.length > 0 && (
            <div className={styles.errorBox}>
              <strong>❌ Validation Errors:</strong>
              <ul>
                {jsonErrors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {jsonPreview && (
            <div className={styles.previewBox}>
              <h3>Preview</h3>
              <p>
                {jsonPreview.length} {jsonPreview.length === 1 ? "category" : "categories"},{" "}
                {jsonTotalQuestions} questions total
              </p>
              <div className={styles.previewList}>
                {jsonPreview.map((cat) => (
                  <div key={cat.id} className={`${styles.previewCard} glass-card`}>
                    <span>{cat.emoji} <strong>{cat.topic}</strong></span>
                    <span className={styles.previewCount}>{cat.questions?.length || 0} questions</span>
                  </div>
                ))}
              </div>
              <button className="btn-primary" onClick={handleJsonImport}>
                🚀 Import Now
              </button>
            </div>
          )}

          <details className={styles.reference}>
            <summary>📖 JSON Format Reference</summary>
            <pre className={styles.code}>{EXAMPLE_JSON}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
