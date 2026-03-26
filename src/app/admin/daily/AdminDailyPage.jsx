"use client";

import { useEffect, useMemo, useState } from "react";
import { useData } from "@/context/DataContext";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminDaily.module.css";

const TYPES = [
  { key: "quiz-of-the-day", label: "Quiz of the day", categoryId: "65f1a2b3c4d5e6f7a8b9c0d9" },
  { key: "daily-current-affairs", label: "Daily current affairs", categoryId: "65f1a2b3c4d5e6f7a8b9c0e1" },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function parseExcelRows(rows) {
  const errors = [];
  const questions = [];

  rows.forEach((row, i) => {
    const rowNum = i + 2;
    const question = String(row["Question"] || "").trim();
    const opt1 = String(row["Option 1"] || "").trim();
    const opt2 = String(row["Option 2"] || "").trim();
    const opt3 = String(row["Option 3"] || "").trim();
    const opt4 = String(row["Option 4"] || "").trim();
    const correctRaw = row["Correct Answer"];
    const difficultyRaw = String(row["Difficulty"] || "").trim().toLowerCase();

    if (!question) {
      errors.push(`Row ${rowNum}: missing Question`);
      return;
    }
    if (!opt1 || !opt2 || !opt3 || !opt4) {
      errors.push(`Row ${rowNum}: all 4 options are required`);
      return;
    }

    const options = [opt1, opt2, opt3, opt4];
    let correctAnswer = "";

    const correctNum = parseInt(correctRaw, 10);
    if (!isNaN(correctNum) && correctNum >= 1 && correctNum <= 4) {
      correctAnswer = options[correctNum - 1];
    } else if (typeof correctRaw === "string" && correctRaw.trim()) {
      const match = options.find((o) => o.toLowerCase() === correctRaw.trim().toLowerCase());
      if (match) correctAnswer = match;
    }

    if (!correctAnswer) {
      errors.push(`Row ${rowNum}: Correct Answer must be 1-4 or match an option`);
      return;
    }

    const difficulty = ["easy", "medium", "hard"].includes(difficultyRaw) ? difficultyRaw : "easy";

    questions.push({
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}_${i}`,
      text: question,
      options,
      correctAnswer,
      difficulty,
    });
  });

  return { questions, errors };
}

async function generateSampleXlsx() {
  const XLSX = await import("xlsx");
  const data = [
    { "Question": "What is the capital of France?", "Option 1": "London", "Option 2": "Berlin", "Option 3": "Paris", "Option 4": "Madrid", "Correct Answer": 3 },
    { "Question": "Which planet is known as the Red Planet?", "Option 1": "Earth", "Option 2": "Mars", "Option 3": "Jupiter", "Option 4": "Venus", "Correct Answer": 2 },
  ];
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [{ wch: 40 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Questions");
  XLSX.writeFile(wb, "daily-quiz-template.xlsx");
}

export default function AdminDailyPage() {
  const { quizzes, refreshQuizzes, addQuestion, updateQuestion, deleteQuestion, bulkImportQuestions } = useData();
  const { adminUser } = useAdmin();
  const isMaster = adminUser?.role === "master";

  const [type, setType] = useState(TYPES[0].key);
  const [date, setDate] = useState(today());
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");
  const [diff, setDiff] = useState("all");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [history, setHistory] = useState([]);
  const [historyQuestions, setHistoryQuestions] = useState(null); // { date: string, questions: [] }
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // Manual Add Form State
  const [manualText, setManualText] = useState("");
  const [manualOpt1, setManualOpt1] = useState("");
  const [manualOpt2, setManualOpt2] = useState("");
  const [manualOpt3, setManualOpt3] = useState("");
  const [manualOpt4, setManualOpt4] = useState("");
  const [manualCorrect, setManualCorrect] = useState(1);
  const [manualDifficulty, setManualDifficulty] = useState("easy");
  
  // Edit Modal State
  const [editingQ, setEditingQ] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ text: "", options: ["", "", "", ""], correctAnswer: "", difficulty: "easy" });

  const [excelPreview, setExcelPreview] = useState(null);
  const [excelErrors, setExcelErrors] = useState([]);
  const [attachToDay, setAttachToDay] = useState(true);

  const typeMeta = useMemo(() => TYPES.find((t) => t.key === type) || TYPES[0], [type]);
  const category = useMemo(
    () => quizzes.find((q) => q.id === typeMeta.categoryId),
    [quizzes, typeMeta.categoryId]
  );

  const questions = useMemo(() => {
    const qs = category?.questions || [];
    return qs.filter((q) => {
      if (diff !== "all" && q.difficulty !== diff) return false;
      if (search && !q.text.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [category?.questions, diff, search]);

  const selectedCount = useMemo(() => {
    // Only count selected IDs that actually exist in the current filtered questions list
    const currentQuestionIds = new Set(questions.map(q => q.id));
    let count = 0;
    selectedIds.forEach(id => {
      if (currentQuestionIds.has(id)) count++;
    });
    return count;
  }, [selectedIds, questions]);

  useEffect(() => {
    let cancelled = false;
    async function loadExisting() {
      setLoading(true);
      setMsg("");
      // Clear selections when switching type or date to prevent "ghost" selections
      setSelectedIds(new Set());
      try {
        const [dailyRes, histRes] = await Promise.all([
          fetch(`/api/daily-quizzes?type=${encodeURIComponent(type)}&date=${encodeURIComponent(date)}`),
          fetch(`/api/daily-quizzes/history?type=${encodeURIComponent(type)}`),
        ]);
        if (!cancelled && dailyRes.ok) {
          const data = await dailyRes.json();
          const ids = data?.daily?.questionIds || [];
          setSelectedIds(new Set(ids));
        }
        if (!cancelled && histRes.ok) {
          setHistory(await histRes.json());
        }
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadExisting();
    return () => {
      cancelled = true;
    };
  }, [type, date]);

  const ensureCategories = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/daily-categories", { method: "POST" });
      if (res.ok) {
        await refreshQuizzes();
        setMsg("Daily categories are ready.");
      } else {
        const data = await res.json().catch(() => ({}));
        setMsg(data.error || "Failed to create categories.");
      }
    } catch {
      setMsg("Failed to create categories.");
    } finally {
      setLoading(false);
    }
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      questions.forEach((q) => next.add(q.id));
      return next;
    });
  };

  const clearAll = () => {
    setSelectedIds(new Set());
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!category || !confirm(`Are you sure you want to delete ${selectedIds.size} selected questions?`)) return;

    setLoading(true);
    setMsg("");
    try {
      let count = 0;
      for (const id of selectedIds) {
        const ok = await deleteQuestion(category.id, id);
        if (ok) count++;
      }
      setSelectedIds(new Set());
      setMsg(`Deleted ${count} questions.`);
    } catch (err) {
      console.error("[AdminDaily] Bulk delete error:", err);
      setMsg("Bulk delete failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddManual = async () => {
    if (!category) return;
    const text = manualText.trim();
    const options = [manualOpt1, manualOpt2, manualOpt3, manualOpt4].map((s) => s.trim());
    if (!text) {
      setMsg("Question is required.");
      return;
    }
    if (options.some((o) => !o)) {
      setMsg("All 4 options are required.");
      return;
    }
    const idx = Number(manualCorrect);
    if (![1, 2, 3, 4].includes(idx)) {
      setMsg("Correct answer must be 1-4.");
      return;
    }
    
    setLoading(true);
    setMsg("");
    const ok = await addQuestion(category.id, {
      text,
      options,
      correctAnswer: options[idx - 1],
      difficulty: manualDifficulty,
    });
    setLoading(false);
    if (ok) {
      setManualText("");
      setManualOpt1("");
      setManualOpt2("");
      setManualOpt3("");
      setManualOpt4("");
      setManualCorrect(1);
      setManualDifficulty("easy");
      setMsg("Question added.");
    } else {
      setMsg("Failed to add question.");
    }
  };

  const handleEditClick = (q) => {
    setEditingQ(q);
    setEditForm({
      text: q.text,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
      difficulty: q.difficulty
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!category || !editingQ) return;
    if (!editForm.text.trim() || editForm.options.some(o => !o.trim()) || !editForm.correctAnswer) {
      alert("All fields are required.");
      return;
    }

    setLoading(true);
    const success = await updateQuestion(category.id, editingQ.id, editForm);
    setLoading(false);
    if (success) {
      setShowEditModal(false);
      setEditingQ(null);
      setMsg("Question updated.");
    } else {
      alert("Failed to update question.");
    }
  };

  const handleDeleteClick = async (qId) => {
    if (!category || !confirm("Are you sure you want to delete this question?")) return;
    
    setLoading(true);
    const success = await deleteQuestion(category.id, qId);
    setLoading(false);
    
    if (success) {
      // Also remove from selected set if it was there
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(qId);
        return next;
      });
      setMsg("Question deleted.");
    } else {
      alert("Failed to delete question.");
    }
  };

  const handleExcelFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setExcelErrors([]);
    setExcelPreview(null);

    const reader = new FileReader();
    reader.onload = async (ev) => {
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
    if (!category || !excelPreview) return;
    setLoading(true);
    setMsg("");
    const ok = await bulkImportQuestions(category.id, excelPreview);
    setLoading(false);
    if (!ok) {
      setMsg("Import failed.");
      return;
    }
    if (attachToDay) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        excelPreview.forEach((q) => next.add(q.id));
        return next;
      });
    }
    setExcelPreview(null);
    setMsg(`Imported ${excelPreview.length} questions.`);
  };

  const save = async () => {
    if (!category) return;
    setLoading(true);
    setMsg("");
    try {
      const qIds = Array.from(selectedIds);
      const res = await fetch("/api/daily-quizzes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          date,
          categoryId: category.id,
          questionIds: qIds,
        }),
      });
      if (res.ok) {
        setMsg("Saved.");
        const histRes = await fetch(`/api/daily-quizzes/history?type=${encodeURIComponent(type)}`);
        if (histRes.ok) {
          const histData = await histRes.json();
          setHistory(histData);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setMsg(data.error || "Save failed.");
      }
    } catch (error) {
      console.error("[AdminDaily] Save error:", error);
      setMsg("Save failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = async (h) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/daily-quizzes?type=${encodeURIComponent(type)}&date=${encodeURIComponent(h.date)}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryQuestions({ date: h.date, questions: data.questions || [] });
        setShowHistoryModal(true);
      }
    } catch (err) {
      console.error("[AdminDaily] History questions error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isMaster) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Daily Quizzes</h1>
        <p className={styles.subtitle}>Master admin access required.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Daily Quizzes</h1>
          <p className={styles.subtitle}>Manage Quiz of the day and Daily current affairs.</p>
        </div>
      </div>

      <div className={`${styles.panel} glass-card`}>
        <div className={styles.controls}>
          <div className={styles.field}>
            <label>Type</label>
            <select className={styles.input} value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label>Date</label>
            <input className={styles.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className={styles.actions}>
            <button className="btn-secondary" type="button" onClick={() => setDate(today())}>
              Today
            </button>
            <button className="btn-primary" type="button" onClick={save} disabled={loading || !category}>
              Save
            </button>
          </div>
        </div>

        {!category && (
          <div className={styles.missingBox}>
            <div>
              <div className={styles.missingTitle}>Required category missing</div>
              <div className={styles.missingDesc}>
                Create the categories “Quiz of the day” and “Daily current affairs” first.
              </div>
            </div>
            <button className="btn-primary" type="button" onClick={ensureCategories} disabled={loading}>
              Create Categories
            </button>
          </div>
        )}

        {msg && <div className={styles.msg}>{msg}</div>}

        {category && (
          <div className={styles.body}>
            <div className={styles.left}>
              <div className={styles.builder}>
                <div className={styles.builderTitle}>Add Questions</div>

                <div className={styles.builderGrid}>
                  <div className={styles.field}>
                    <label>Question</label>
                    <input
                      className={styles.input}
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      placeholder="Type your question..."
                    />
                  </div>

                  <div className={styles.row4}>
                    <div className={styles.field}>
                      <label>Option 1</label>
                      <input className={styles.input} value={manualOpt1} onChange={(e) => setManualOpt1(e.target.value)} />
                    </div>
                    <div className={styles.field}>
                      <label>Option 2</label>
                      <input className={styles.input} value={manualOpt2} onChange={(e) => setManualOpt2(e.target.value)} />
                    </div>
                    <div className={styles.field}>
                      <label>Option 3</label>
                      <input className={styles.input} value={manualOpt3} onChange={(e) => setManualOpt3(e.target.value)} />
                    </div>
                    <div className={styles.field}>
                      <label>Option 4</label>
                      <input className={styles.input} value={manualOpt4} onChange={(e) => setManualOpt4(e.target.value)} />
                    </div>
                  </div>

                  <div className={styles.row3}>
                    <div className={styles.field}>
                      <label>Correct answer</label>
                      <select
                        className={styles.input}
                        value={manualCorrect}
                        onChange={(e) => setManualCorrect(Number(e.target.value))}
                      >
                        <option value={1}>Option 1</option>
                        <option value={2}>Option 2</option>
                        <option value={3}>Option 3</option>
                        <option value={4}>Option 4</option>
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label>Difficulty</label>
                      <select
                        className={styles.input}
                        value={manualDifficulty}
                        onChange={(e) => setManualDifficulty(e.target.value)}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div className={styles.builderActions}>
                      <label className={styles.attachToggle}>
                        <input
                          type="checkbox"
                          checked={attachToDay}
                          onChange={(e) => setAttachToDay(e.target.checked)}
                        />
                        Add to this day
                      </label>
                      <button className="btn-primary" type="button" onClick={handleAddManual} disabled={loading}>
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.uploadBox}>
                  <div className={styles.uploadTitle}>Bulk Upload (Excel)</div>
                  <div className={styles.uploadActions}>
                    <label className={styles.fileBtn}>
                      Upload Excel
                      <input type="file" accept=".xlsx,.xls" hidden onChange={handleExcelFile} />
                    </label>
                    <button className="btn-secondary" type="button" onClick={generateSampleXlsx}>
                      Download Template
                    </button>
                    {excelPreview && (
                      <button className="btn-primary" type="button" onClick={handleExcelImport} disabled={loading}>
                        Import {excelPreview.length}
                      </button>
                    )}
                  </div>
                  <div className={styles.formatHint}>
                    Required columns: Question, Option 1, Option 2, Option 3, Option 4, Correct Answer (1-4). Difficulty is optional.
                  </div>

                  {excelErrors.length > 0 && (
                    <div className={styles.errorBox}>
                      <strong>Validation Errors:</strong>
                      <ul>
                        {excelErrors.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {excelPreview && (
                    <div className={styles.previewBox}>
                      <div className={styles.previewTitle}>Preview</div>
                      <div className={styles.previewList}>
                        {excelPreview.slice(0, 5).map((q) => (
                          <div key={q.id} className={styles.previewItem}>
                            <span>{q.text}</span>
                            <span className={styles.previewBadge}>{q.difficulty}</span>
                          </div>
                        ))}
                        {excelPreview.length > 5 && <div className={styles.previewMore}>+{excelPreview.length - 5} more</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.toolbar}>
                <input
                  className={styles.input}
                  placeholder="Search questions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select className={styles.input} value={diff} onChange={(e) => setDiff(e.target.value)}>
                  <option value="all">All</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className={styles.bulkBtns}>
                <button className="btn-secondary" type="button" onClick={selectAllVisible}>
                  Select Visible
                </button>
                <button className="btn-secondary" type="button" onClick={clearAll}>
                  Clear Selection
                </button>
                {selectedCount > 0 && (
                  <button className={`${styles.fileBtn} ${styles.deleteBtn}`} type="button" onClick={deleteSelected} disabled={loading}>
                    🗑️ Delete ({selectedCount})
                  </button>
                )}
                <div className={styles.countBadge}>{selectedCount} selected</div>
              </div>

              <div className={styles.qList}>
                {questions.map((q) => (
                  <div key={q.id} className={styles.qRow}>
                    <input type="checkbox" checked={selectedIds.has(q.id)} onChange={() => toggleOne(q.id)} />
                    <span className={styles.qText}>{q.text}</span>
                    <span className={`${styles.diffTag} ${styles[q.difficulty]}`}>{q.difficulty}</span>
                    <div className={styles.qActions}>
                      <button className={styles.iconBtn} onClick={() => handleEditClick(q)} title="Edit Question">✏️</button>
                      <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={() => handleDeleteClick(q.id)} title="Delete Question">🗑️</button>
                    </div>
                  </div>
                ))}
                {questions.length === 0 && <div className={styles.empty}>No questions match your filters.</div>}
              </div>
            </div>

            <div className={styles.right}>
              <div className={styles.historyTitle}>History</div>
              <div className={styles.historyList}>
                {history.map((h) => (
                  <div key={h.date} className={`${styles.historyBtn} ${h.date === date ? styles.historyBtnActive : ""}`}>
                    <div onClick={() => setDate(h.date)} style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{h.date === today() ? "Today" : h.date}</span>
                      <span className={styles.historyCount}>{h.questionCount} Qs</span>
                    </div>
                    <button 
                      className={styles.iconBtn} 
                      onClick={(e) => { e.stopPropagation(); handleHistoryClick(h); }}
                      title="View Questions"
                      style={{ marginLeft: '10px' }}
                    >
                      👁️
                    </button>
                  </div>
                ))}
                {history.length === 0 && <div className={styles.empty}>No saved days yet.</div>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Edit Question</h2>
            
            <div className={styles.builderGrid}>
              <div className={styles.field}>
                <label>Question Text</label>
                <input
                  className={styles.input}
                  value={editForm.text}
                  onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                  placeholder="Enter question text..."
                />
              </div>

              <div className={styles.row4}>
                {editForm.options.map((opt, i) => (
                  <div key={i} className={styles.field}>
                    <label>Option {i + 1}</label>
                    <input
                      className={styles.input}
                      value={opt}
                      onChange={(e) => {
                        const next = [...editForm.options];
                        next[i] = e.target.value;
                        setEditForm({ ...editForm, options: next });
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className={styles.row3}>
                <div className={styles.field}>
                  <label>Correct Answer</label>
                  <select
                    className={styles.input}
                    value={editForm.options.indexOf(editForm.correctAnswer) + 1 || ""}
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      if (idx >= 1 && idx <= 4) {
                        setEditForm({ ...editForm, correctAnswer: editForm.options[idx - 1] });
                      }
                    }}
                  >
                    <option value="">Select correct option...</option>
                    <option value="1">Option 1</option>
                    <option value="2">Option 2</option>
                    <option value="3">Option 3</option>
                    <option value="4">Option 4</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label>Difficulty</label>
                  <select
                    className={styles.input}
                    value={editForm.difficulty}
                    onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
      {/* History Questions Modal */}
      {showHistoryModal && historyQuestions && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className={styles.modalTitle} style={{ margin: 0 }}>Quiz for {historyQuestions.date}</h2>
              <button className={styles.iconBtn} onClick={() => setShowHistoryModal(false)}>✕</button>
            </div>
            
            <div className={styles.qList} style={{ maxHeight: '60vh' }}>
              {historyQuestions.questions.length === 0 ? (
                <p className={styles.empty}>No questions found for this date.</p>
              ) : (
                historyQuestions.questions.map((q, idx) => (
                  <div key={q.id} className={styles.qRow} style={{ gridTemplateColumns: '30px 1fr auto' }}>
                    <span className={styles.qNum}>{idx + 1}</span>
                    <div className={styles.qText}>
                      <div>{q.text}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '4px' }}>✓ {q.correctAnswer}</div>
                    </div>
                    <span className={`${styles.diffTag} ${styles[q.difficulty]}`}>{q.difficulty}</span>
                  </div>
                ))
              )}
            </div>

            <div className={styles.modalActions}>
              <button className="btn-primary" onClick={() => setShowHistoryModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
