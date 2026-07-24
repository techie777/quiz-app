"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminUpload.module.css";
import toast, { Toaster } from "react-hot-toast";

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

    if (!question) { errors.push(`Row ${rowNum}: missing Question text`); return; }
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

async function generateSampleXlsx() {
  const XLSX = await import("xlsx");
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
  if (res.ok) toast.success("Submitted for admin approval!");
  else toast.error("Failed to submit change for approval.");
}

export default function AdminUploadPage() {
  const { quizzes, bulkImport, bulkImportQuestions, refreshQuizzes } = useData();
  const { adminUser } = useAdmin();
  const isJr = adminUser?.role === "jr";
  const [tab, setTab] = useState("excel"); // "excel" | "json" | "images"

  const excelInputRef = useRef(null);
  const jsonInputRef = useRef(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [uploadCurrent, setUploadCurrent] = useState(0);

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

  // Image bulk upload state
  const [imgCatId, setImgCatId] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [imgUploading, setImgUploading] = useState(false);
  const [imgProgress, setImgProgress] = useState(0);
  const [imgResults, setImgResults] = useState(null);

  // Set default category when quizzes load
  useEffect(() => {
    if (quizzes.length > 0 && !selectedCatId) {
      setSelectedCatId(quizzes[0].id);
    }
  }, [quizzes, selectedCatId]);

  const allowed = adminUser?.role === "master" || adminUser?.permissions?.upload !== false;
  if (!allowed) {
    return (
      <div className={styles.page}>
        <p>Access denied.</p>
      </div>
    );
  }

  // ===== Excel handlers =====
  const handleExcelFile = (file) => {
    if (!file) return;
    setExcelErrors([]);
    setExcelPreview(null);
    setExcelSuccess(false);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const XLSX = await import("xlsx");
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
        toast.success(`Parsed ${questions.length} questions from Excel file!`);
      } catch (err) {
        setExcelErrors(["Failed to read Excel file: " + err.message]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExcelImport = async () => {
    if (!excelPreview || !selectedCatId || isUploading) return;

    setIsUploading(true);
    setUploadTotal(excelPreview.length);
    setUploadCurrent(0);
    setUploadProgress(0);

    try {
      if (isJr) {
        await submitPending("bulk_add_questions", { categoryId: selectedCatId, questions: excelPreview });
        setExcelSuccess(true);
        setExcelPreview(null);
      } else {
        const CHUNK_SIZE = 50;
        const total = excelPreview.length;

        for (let i = 0; i < total; i += CHUNK_SIZE) {
          const chunk = excelPreview.slice(i, i + CHUNK_SIZE);
          const success = await bulkImportQuestions(selectedCatId, chunk);

          if (!success) {
            throw new Error(`Failed to upload chunk starting at ${i}`);
          }

          const current = Math.min(i + CHUNK_SIZE, total);
          setUploadCurrent(current);
          setUploadProgress(Math.floor((current / total) * 100));
        }

        setExcelSuccess(true);
        setExcelPreview(null);
        toast.success(`Successfully imported ${excelPreview.length} questions!`);
      }
    } catch (err) {
      console.error("Bulk upload error:", err);
      toast.error("An error occurred during import: " + err.message);
    } finally {
      setIsUploading(false);
    }
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
    toast.success("JSON structure validated successfully!");
  };

  const handleJsonImport = async () => {
    if (!jsonPreview || isUploading) return;

    setIsUploading(true);
    const total = jsonPreview.reduce((sum, c) => sum + (c.questions?.length || 0), 0);
    setUploadTotal(total);
    setUploadCurrent(0);
    setUploadProgress(0);

    try {
      if (isJr) {
        await submitPending("bulk_import", { categories: jsonPreview });
        setJsonSuccess(true);
        setJsonPreview(null);
        setJsonText("");
      } else {
        let processedCount = 0;
        for (const category of jsonPreview) {
          const success = await bulkImport([category]);
          if (!success) throw new Error(`Failed to import category: ${category.topic}`);

          processedCount += (category.questions?.length || 0);
          setUploadCurrent(processedCount);
          setUploadProgress(Math.floor((processedCount / total) * 100));
        }

        setJsonSuccess(true);
        setJsonPreview(null);
        setJsonText("");
        toast.success(`Imported ${total} questions across categories!`);
      }
    } catch (err) {
      toast.error("Import failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ===== Image Bulk Upload Handlers =====
  const handleImageFilesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => f.type.startsWith("image/"));
    setSelectedImages(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      return [...prev, ...validFiles.filter(f => !existingNames.has(f.name))];
    });
    e.target.value = "";
  };

  const removeSelectedImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageBulkUpload = async () => {
    if (!imgCatId || selectedImages.length === 0 || imgUploading) return;
    setImgUploading(true);
    setImgProgress(0);
    setImgResults(null);

    try {
      const BATCH = 5;
      let allCreated = [];
      let allErrors = [];

      for (let i = 0; i < selectedImages.length; i += BATCH) {
        const batch = selectedImages.slice(i, i + BATCH);
        const fd = new FormData();
        fd.append("categoryId", imgCatId);
        batch.forEach(f => fd.append("images", f));

        const res = await fetch("/api/admin/bulk-image-upload", { method: "POST", body: fd });
        const data = await res.json();

        if (data.created) allCreated = [...allCreated, ...data.questions];
        if (data.errors) allErrors = [...allErrors, ...data.errors];

        setImgProgress(Math.min(100, Math.round(((i + BATCH) / selectedImages.length) * 100)));
      }

      setImgResults({ created: allCreated, errors: allErrors });
      setSelectedImages([]);
      await refreshQuizzes();
      toast.success(`Uploaded ${allCreated.length} image questions!`);
    } catch (err) {
      setImgResults({ created: [], errors: [err.message] });
    } finally {
      setImgUploading(false);
    }
  };

  const selectedCatName = quizzes.find((c) => c.id === selectedCatId)?.topic || "";

  return (
    <div className={styles.page}>
      <Toaster position="top-right" />

      {/* Header Banner */}
      <div className={styles.headerRow}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.badgeHeader}>
            <span>📥 BULK DATA & QUESTION IMPORTER</span>
          </div>
          <h1 className={styles.title}>Bulk Upload Center</h1>
          <p className={styles.subtitle}>
            Import questions via Excel spreadsheets, JSON payloads, or bulk image uploads.
          </p>
        </div>

        <Link href="/admin/sawal-jawab" className={styles.secondaryBtn}>
          <span>Go to Sawal / Jawab Bulk Import →</span>
        </Link>
      </div>

      {/* KPI Overview Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(99, 102, 241, 0.12)", color: "#6366f1" }}>📊</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>Excel (.xlsx)</div>
            <div className={styles.kpiLabel}>Spreadsheet Upload</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(168, 85, 247, 0.12)", color: "#a855f7" }}>📋</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>JSON</div>
            <div className={styles.kpiLabel}>Full Structure Payload</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>🖼️</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>Image Upload</div>
            <div className={styles.kpiLabel}>Visual & Diagram Quizzes</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>🏷️</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>{quizzes.length}</div>
            <div className={styles.kpiLabel}>Target Categories</div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "excel" ? styles.tabActive : ""}`}
          onClick={() => setTab("excel")}
        >
          <span>📊 Excel Spreadsheet Upload</span>
        </button>
        <button
          className={`${styles.tab} ${tab === "json" ? styles.tabActive : ""}`}
          onClick={() => setTab("json")}
        >
          <span>📋 JSON Payload Import</span>
        </button>
        <button
          className={`${styles.tab} ${tab === "images" ? styles.tabActive : ""}`}
          onClick={() => setTab("images")}
        >
          <span>🖼️ Image Bulk Upload</span>
        </button>
      </div>

      {/* ===== TAB 1: EXCEL UPLOAD ===== */}
      {tab === "excel" && (
        <div className={styles.uploadCard}>
          {excelSuccess && (
            <div className={styles.successBanner}>
              {`✅ Successfully imported questions into "${selectedCatName}"!`}
            </div>
          )}

          {/* Category Select */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Target Quiz Category</label>
            <select
              className={styles.select}
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
            >
              {quizzes.map((c) => (
                <option key={c.id} value={c.id}>
                  {(c.emoji || "📖") + " " + c.topic}
                </option>
              ))}
            </select>
          </div>

          {/* Drag & Drop Zone */}
          <div
            className={styles.dropzone}
            onClick={() => excelInputRef.current?.click()}
          >
            <div className={styles.dropIcon}>📁</div>
            <h3 className={styles.dropText}>Click or Drag Excel Spreadsheet Here</h3>
            <p className={styles.dropSubtext}>Supports .xlsx and .xls file formats</p>

            <input
              type="file"
              ref={excelInputRef}
              accept=".xlsx,.xls"
              onChange={(e) => handleExcelFile(e.target.files[0])}
              hidden
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className={styles.secondaryBtn} onClick={generateSampleXlsx}>
              <span>⬇️ Download Sample Excel Template (.xlsx)</span>
            </button>
          </div>

          <div className={styles.formatHint}>
            <strong>Required Excel Columns:</strong> Question, Option 1, Option 2, Option 3, Option 4, Correct Answer (1-4), Difficulty (Easy/Medium/Hard)
          </div>

          {/* Validation Errors */}
          {excelErrors.length > 0 && (
            <div className={styles.errorBox}>
              <strong>❌ Validation Errors ({excelErrors.length}):</strong>
              <ul>
                {excelErrors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {/* Excel Preview */}
          {excelPreview && (
            <div className={styles.previewBox}>
              <h3>Validation Preview</h3>
              <p>{`${excelPreview.length} questions parsed & ready to import into "${selectedCatName}"`}</p>

              <div className={styles.previewList}>
                {excelPreview.slice(0, 5).map((q, i) => (
                  <div key={i} className={styles.previewCard}>
                    <span>{q.text}</span>
                    <span className={styles.previewCount}>{q.difficulty}</span>
                  </div>
                ))}
                {excelPreview.length > 5 && (
                  <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--text-secondary)", margin: "4px 0 0" }}>
                    ...and {excelPreview.length - 5} more questions
                  </p>
                )}
              </div>

              {isUploading && (
                <div className={styles.progressContainer}>
                  <div className={styles.progressHeader}>
                    <span>📥 Uploading questions in chunks...</span>
                    <span>{uploadCurrent} / {uploadTotal}</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              <button
                className={styles.primaryBtn}
                onClick={handleExcelImport}
                disabled={isUploading}
                style={{ width: '100%', marginTop: '10px' }}
              >
                <span>{isUploading ? "Uploading..." : `🚀 Import All ${excelPreview.length} Questions`}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 2: JSON UPLOAD ===== */}
      {tab === "json" && (
        <div className={styles.uploadCard}>
          {jsonSuccess && (
            <div className={styles.successBanner}>
              ✅ Successfully imported JSON payload!
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label className={styles.fieldLabel}>JSON Payload Data</label>
            <button
              className={styles.secondaryBtn}
              onClick={() => jsonInputRef.current?.click()}
              style={{ padding: "6px 14px", fontSize: "0.8rem" }}
            >
              <span>📁 Load JSON File</span>
            </button>
            <input
              type="file"
              ref={jsonInputRef}
              accept=".json"
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  setJsonText(ev.target.result);
                };
                reader.readAsText(file);
              }}
              hidden
            />
          </div>

          <textarea
            rows={10}
            className={styles.textarea}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={EXAMPLE_JSON}
          />

          <div style={{ display: "flex", gap: "10px" }}>
            <button className={styles.secondaryBtn} onClick={handleJsonValidate}>
              <span>🔍 Validate JSON Payload</span>
            </button>
          </div>

          {/* Validation Errors */}
          {jsonErrors.length > 0 && (
            <div className={styles.errorBox}>
              <strong>❌ JSON Validation Errors:</strong>
              <ul>
                {jsonErrors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {/* JSON Preview */}
          {jsonPreview && (
            <div className={styles.previewBox}>
              <h3>JSON Preview</h3>
              <p>Found {jsonPreview.length} categories with total {jsonPreview.reduce((s, c) => s + (c.questions?.length || 0), 0)} questions.</p>

              {isUploading && (
                <div className={styles.progressContainer}>
                  <div className={styles.progressHeader}>
                    <span>📥 Uploading JSON categories...</span>
                    <span>{uploadCurrent} / {uploadTotal}</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              <button
                className={styles.primaryBtn}
                onClick={handleJsonImport}
                disabled={isUploading}
                style={{ width: '100%', marginTop: '10px' }}
              >
                <span>{isUploading ? "Uploading..." : "🚀 Process JSON Bulk Import"}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 3: IMAGE BULK UPLOAD ===== */}
      {tab === "images" && (
        <div className={styles.uploadCard}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Target Category for Image Questions</label>
            <select
              className={styles.select}
              value={imgCatId}
              onChange={(e) => setImgCatId(e.target.value)}
            >
              <option value="">-- Select Category --</option>
              {quizzes.map((c) => (
                <option key={c.id} value={c.id}>
                  {(c.emoji || "🖼️") + " " + c.topic}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.dropzone} onClick={() => document.getElementById("img-bulk-input")?.click()}>
            <div className={styles.dropIcon}>🖼️</div>
            <h3 className={styles.dropText}>Select Image Files for Quiz Questions</h3>
            <p className={styles.dropSubtext}>Upload diagrams, map questions, or picture-based quiz questions</p>
            <input
              id="img-bulk-input"
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageFilesSelect}
              hidden
            />
          </div>

          {selectedImages.length > 0 && (
            <div style={{ background: "var(--bg-secondary)", padding: "16px", borderRadius: "14px" }}>
              <h4 style={{ margin: "0 0 10px", fontSize: "0.95rem", fontWeight: 800 }}>
                Selected Images ({selectedImages.length})
              </h4>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {selectedImages.map((img, i) => (
                  <span key={i} className={styles.previewCount} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    {img.name}
                    <button type="button" onClick={() => removeSelectedImage(i)} style={{ border: "none", background: "none", cursor: "pointer" }}>✕</button>
                  </span>
                ))}
              </div>

              {imgUploading && (
                <div className={styles.progressContainer}>
                  <div className={styles.progressHeader}>
                    <span>🖼️ Uploading & processing images...</span>
                    <span>{imgProgress}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${imgProgress}%` }} />
                  </div>
                </div>
              )}

              <button
                className={styles.primaryBtn}
                onClick={handleImageBulkUpload}
                disabled={imgUploading || !imgCatId}
                style={{ width: "100%", marginTop: "14px" }}
              >
                <span>{imgUploading ? "Uploading..." : `🚀 Upload ${selectedImages.length} Image Questions`}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
