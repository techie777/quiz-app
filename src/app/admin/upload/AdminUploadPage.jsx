"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  if (res.ok) alert("Your change has been submitted for approval.");
  else alert("Failed to submit change for approval.");
}

export default function AdminUploadPage() {
  const { quizzes, addQuestion, bulkImport, bulkImportQuestions, refreshQuizzes } = useData();
  const { adminUser } = useAdmin();
  const isJr = adminUser?.role === "jr";
  const [tab, setTab] = useState("excel"); // "excel" | "json" | "images"

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
  const [imgCatTab, setImgCatTab] = useState("image");
  const [imgCatSearch, setImgCatSearch] = useState("");
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
  const handleExcelFile = (e) => {
    const file = e.target.files[0];
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
      } catch (err) {
        setExcelErrors(["Failed to read Excel file: " + err.message]);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
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
      }
    } catch (err) {
      console.error("Bulk upload error:", err);
      alert("An error occurred during import: " + err.message);
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
        // For JSON, we import one category at a time to show progress
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
      }
    } catch (err) {
      alert("Import failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
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
      // Upload in batches of 5 to avoid request size limits
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
      // Refresh DataContext so Admin > Questions shows the new draft questions immediately
      await refreshQuizzes();
    } catch (err) {
      setImgResults({ created: [], errors: [err.message] });
    } finally {
      setImgUploading(false);
    }
  };

  const downloadImageTemplate = async () => {
    const XLSX = await import("xlsx");
    const data = [
      { "Image Filename": "eiffel_tower.jpg", "Question Text": "Where is this famous monument located?", "Option 1": "Paris", "Option 2": "London", "Option 3": "Rome", "Option 4": "Berlin", "Correct Answer": 1, "Difficulty": "Easy", "Explanation": "The Eiffel Tower is located in Paris, France." },
      { "Image Filename": "taj_mahal.jpg", "Question Text": "Name this world heritage site", "Option 1": "Burj Khalifa", "Option 2": "Taj Mahal", "Option 3": "Colosseum", "Option 4": "Pyramids", "Correct Answer": 2, "Difficulty": "Easy", "Explanation": "The Taj Mahal is a famous mausoleum in Agra, India." },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [20,35,12,12,12,12,16,12,40].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Image Quiz Template");
    XLSX.writeFile(wb, "image-quiz-template.xlsx");
  };


  const jsonTotalQuestions = jsonPreview
    ? jsonPreview.reduce((sum, c) => sum + (c.questions?.length || 0), 0)
    : 0;

  const selectedCatName = quizzes.find((c) => c.id === selectedCatId)?.topic || "";

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Bulk Upload</h1>
      <p className={styles.subtitle}>
        Import questions via Excel or JSON. 
        <Link href="/admin/sawal-jawab" className="text-indigo-600 ml-2 font-bold hover:underline">
          Go to Sawal / Jawab Bulk Import →
        </Link>
      </p>

      {/* Tab Switcher */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === "excel" ? styles.tabActive : ""}`} onClick={() => setTab("excel")}>
          📊 Excel Upload
        </button>
        <button className={`${styles.tab} ${tab === "json" ? styles.tabActive : ""}`} onClick={() => setTab("json")}>
          📋 JSON Upload
        </button>
        <button className={`${styles.tab} ${tab === "images" ? styles.tabActive : ""}`} onClick={() => setTab("images")}>
          🖼️ Image Bulk Upload
        </button>
      </div>

      {/* ===== EXCEL TAB ===== */}
      {tab === "excel" && (
        <div>
          {excelSuccess && (
            <div className={styles.successBanner}>
              {`✅ Successfully imported ${excelPreview?.length ?? ""} questions into "${selectedCatName}"!`}
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
              <p>{`${excelPreview.length} questions ready to import into "${selectedCatName}"`}</p>
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

              {isUploading && (
                <div className={styles.progressContainer}>
                  <div className={styles.progressHeader}>
                    <span>📥 Uploading questions...</span>
                    <span>{uploadCurrent} / {uploadTotal}</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              <button 
                className="btn-primary" 
                onClick={handleExcelImport}
                disabled={isUploading}
                style={{ width: '100%', marginTop: '20px' }}
              >
                {isUploading ? `🚀 Uploading (${uploadProgress}%)` : `🚀 Import ${excelPreview.length} Questions`}
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

              {isUploading && (
                <div className={styles.progressContainer}>
                  <div className={styles.progressHeader}>
                    <span>📥 Uploading categories...</span>
                    <span>{uploadCurrent} / {uploadTotal} questions</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              <button 
                className="btn-primary" 
                onClick={handleJsonImport}
                disabled={isUploading}
                style={{ width: '100%', marginTop: '20px' }}
              >
                {isUploading ? `🚀 Uploading (${uploadProgress}%)` : `🚀 Import Now`}
              </button>
            </div>
          )}

          <details className={styles.reference}>
            <summary>📖 JSON Format Reference</summary>
            <pre className={styles.code}>{EXAMPLE_JSON}</pre>
          </details>
        </div>
      )}

      {/* ===== IMAGE BULK UPLOAD TAB ===== */}
      {tab === "images" && (
        <div>
          <div style={{ background: 'linear-gradient(135deg, #667eea22, #764ba222)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700 }}>🖼️ How Image Bulk Upload Works</h3>
            <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
              <li><strong>Step 1:</strong> Select an Image Quiz category below</li>
              <li><strong>Step 2:</strong> Drop multiple images at once (logos, places, people, etc.)</li>
              <li><strong>Step 3:</strong> System creates draft questions — one per image</li>
              <li><strong>Step 4:</strong> Go to <strong>Admin → Questions</strong> to fill in the options &amp; answer</li>
              <li><strong>OR Step 4 (Alt):</strong> Download the Excel template, fill in options, and re-upload</li>
            </ol>
          </div>

          {/* Category Picker */}
          <div className={styles.field} style={{ marginBottom: '20px' }}>
            <label className={styles.fieldLabel}>📂 Select Image Quiz Category</label>
            <div style={{ border: '1.5px solid var(--card-border)', borderRadius: '12px', overflow: 'hidden' }}>
              {/* Mini Tabs */}
              <div style={{ display: 'flex', borderBottom: '1.5px solid var(--card-border)', background: 'var(--bg-secondary)' }}>
                {[
                  { key: 'image', label: '🖼️ Image Quizzes' },
                  { key: 'quizzes', label: '📝 Regular' },
                  { key: 'govt', label: '🏛️ Govt' },
                ].map(t => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => { setImgCatTab(t.key); setImgCatSearch(''); }}
                    style={{
                      flex: 1, padding: '8px 4px', border: 'none', fontSize: '0.78rem', fontWeight: 700,
                      background: imgCatTab === t.key ? 'var(--accent, #4f46e5)' : 'transparent',
                      color: imgCatTab === t.key ? 'white' : 'var(--text-secondary)',
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >{t.label}</button>
                ))}
              </div>
              <div style={{ padding: '8px', borderBottom: '1px solid var(--card-border)' }}>
                <input
                  type="text" value={imgCatSearch}
                  onChange={e => setImgCatSearch(e.target.value)}
                  placeholder="Search..."
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '0.85rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '4px' }}>
                {quizzes
                  .filter(c => {
                    const cls = c.categoryClass || '';
                    if (imgCatTab === 'govt') return cls.includes('govt-exam');
                    if (imgCatTab === 'image') return cls.includes('image-quiz');
                    return !cls.includes('govt-exam') && !cls.includes('image-quiz');
                  })
                  .filter(c => !imgCatSearch || c.topic.toLowerCase().includes(imgCatSearch.toLowerCase()))
                  .map(c => (
                    <div
                      key={c.id}
                      onClick={() => setImgCatId(c.id)}
                      style={{
                        padding: '7px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.87rem',
                        fontWeight: imgCatId === c.id ? 700 : 400,
                        background: imgCatId === c.id ? 'var(--accent, #4f46e5)' : 'transparent',
                        color: imgCatId === c.id ? 'white' : 'var(--text-primary)',
                        transition: 'all 0.15s', marginBottom: '2px'
                      }}
                    >
                      {c.emoji} {c.topic}
                      {c.parentId && <span style={{ fontSize: '0.72rem', opacity: 0.7, marginLeft: 4 }}>↳ sub</span>}
                    </div>
                  ))}
              </div>
            </div>
            {imgCatId && (
              <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 700 }}>
                ✅ Selected: {quizzes.find(c => c.id === imgCatId)?.emoji} {quizzes.find(c => c.id === imgCatId)?.topic}
              </p>
            )}
          </div>

          {/* Image Drop Zone */}
          <div
            className={styles.uploadSection}
            style={{ flexDirection: 'column', alignItems: 'center', padding: '30px', border: '2px dashed var(--accent, #4f46e5)', borderRadius: '16px', background: 'var(--bg-secondary)', cursor: 'pointer', marginBottom: '20px' }}
            onClick={() => document.getElementById('bulk-img-input').click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')); setSelectedImages(prev => { const existing = new Set(prev.map(f => f.name)); return [...prev, ...files.filter(f => !existing.has(f.name))]; }); }}
          >
            <input id="bulk-img-input" type="file" accept="image/*" multiple hidden onChange={handleImageFilesSelect} />
            <span style={{ fontSize: '3rem' }}>🖼️</span>
            <p style={{ margin: '8px 0 4px', fontWeight: 700, fontSize: '1rem' }}>Click or Drag & Drop Images Here</p>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>Supports JPG, PNG, WEBP — Max 5MB each</p>
          </div>

          {/* Preview Grid */}
          {selectedImages.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0 }}>{selectedImages.length} image(s) selected</h4>
                <button type="button" onClick={() => setSelectedImages([])} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>Clear All ✕</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}>
                {selectedImages.map((file, idx) => (
                  <div key={idx} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid var(--card-border)' }}>
                    <img src={URL.createObjectURL(file)} alt={file.name} style={{ width: '100%', height: '90px', objectFit: 'cover', display: 'block' }} />
                    <div style={{ padding: '4px 6px', fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
                    <button onClick={(e) => { e.stopPropagation(); removeSelectedImage(idx); }} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', color: 'white', width: '20px', height: '20px', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {imgUploading && (
            <div className={styles.progressContainer} style={{ marginBottom: '16px' }}>
              <div className={styles.progressHeader}>
                <span>📤 Uploading images &amp; creating draft questions...</span>
                <span>{imgProgress}%</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${imgProgress}%` }} />
              </div>
            </div>
          )}

          {/* Results */}
          {imgResults && (
            <div style={{ marginBottom: '20px' }}>
              {imgResults.created.length > 0 && (
                <div className={styles.successBanner}>
                  ✅ {imgResults.created.length} draft question(s) created! Go to <strong>Admin → Questions</strong> → filter by category to fill in options.
                </div>
              )}
              {imgResults.errors.length > 0 && (
                <div className={styles.errorBox}>
                  <strong>⚠️ Some files had errors:</strong>
                  <ul>{imgResults.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              onClick={handleImageBulkUpload}
              disabled={!imgCatId || selectedImages.length === 0 || imgUploading}
              style={{ flex: 1 }}
            >
              {imgUploading ? `🚀 Uploading (${imgProgress}%)...` : `🚀 Upload ${selectedImages.length} Image(s) as Draft Questions`}
            </button>
            <button className="btn-secondary" onClick={downloadImageTemplate}>
              ⬇️ Download Fill-in Template
            </button>
          </div>

          <div className={styles.formatHint} style={{ marginTop: '16px' }}>
            <strong>💡 Fill-in Template:</strong> Download the Excel template, fill in Question Text, Options, and Correct Answer for each image by its filename, then use the <strong>Excel Upload</strong> tab above to import the completed answers.
          </div>
        </div>
      )}
    </div>
  );
}
