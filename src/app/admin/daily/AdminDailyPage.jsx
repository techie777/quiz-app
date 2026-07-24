"use client";

import { useEffect, useMemo, useState } from "react";
import { useData } from "@/context/DataContext";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminDaily.module.css";
import toast, { Toaster } from "react-hot-toast";

const TYPES = [
  { key: "quiz-of-the-day", label: "Quiz of the Day", emoji: "🏆", categoryId: "65f1a2b3c4d5e6f7a8b9c0d9" },
  { key: "daily-current-affairs", label: "Daily Current Affairs Quiz", emoji: "🗞️", categoryId: "65f1a2b3c4d5e6f7a8b9c0e1" },
];

function today() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
      errors.push(`Row ${rowNum}: missing Question text`);
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

export default function AdminDailyPage() {
  const { quizzes, refreshQuizzes, addQuestion, updateQuestion, deleteQuestion, bulkImportQuestions } = useData();
  const { adminUser } = useAdmin();
  const isMaster = adminUser?.role === "master";

  const [type, setType] = useState(TYPES[0].key);
  const [date, setDate] = useState(today());
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [diff, setDiff] = useState("all");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [history, setHistory] = useState([]);
  const [historyQuestions, setHistoryQuestions] = useState(null);
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

  useEffect(() => {
    let cancelled = false;
    async function loadExisting() {
      setLoading(true);
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
    try {
      const res = await fetch("/api/admin/daily-categories", { method: "POST" });
      if (res.ok) {
        await refreshQuizzes();
        toast.success("Daily categories are ready!");
      } else {
        toast.error("Failed to create categories.");
      }
    } catch {
      toast.error("Failed to create categories.");
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

  const handleAddManual = async (e) => {
    e.preventDefault();
    if (!category) return;
    const text = manualText.trim();
    const options = [manualOpt1, manualOpt2, manualOpt3, manualOpt4].map((s) => s.trim());
    if (!text) { toast.error("Question is required."); return; }
    if (options.some((o) => !o)) { toast.error("All 4 options are required."); return; }

    setLoading(true);
    const ok = await addQuestion(category.id, {
      text,
      options,
      correctAnswer: options[manualCorrect - 1],
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
      toast.success("Question added successfully!");
    } else {
      toast.error("Failed to add question.");
    }
  };

  const handleSaveEdit = async () => {
    if (!category || !editingQ) return;
    if (!editForm.text.trim() || editForm.options.some(o => !o.trim()) || !editForm.correctAnswer) {
      toast.error("All fields are required.");
      return;
    }

    setLoading(true);
    const success = await updateQuestion(category.id, editingQ.id, editForm);
    setLoading(false);
    if (success) {
      setShowEditModal(false);
      setEditingQ(null);
      toast.success("Question updated!");
    } else {
      toast.error("Failed to update question.");
    }
  };

  const handleDeleteClick = async (qId) => {
    if (!category || !confirm("Are you sure you want to delete this question?")) return;
    setLoading(true);
    const success = await deleteQuestion(category.id, qId);
    setLoading(false);
    if (success) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(qId);
        return next;
      });
      toast.success("Question deleted!");
    } else {
      toast.error("Failed to delete question.");
    }
  };

  const saveAssignments = async () => {
    if (!category) return;
    setLoading(true);
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
        toast.success(`Saved ${qIds.length} assigned questions for ${date}! 🎉`);
        const histRes = await fetch(`/api/daily-quizzes/history?type=${encodeURIComponent(type)}`);
        if (histRes.ok) {
          setHistory(await histRes.json());
        }
      } else {
        toast.error("Save failed.");
      }
    } catch (error) {
      toast.error("Save failed.");
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
      <Toaster position="top-right" />

      {/* Header Banner */}
      <div className={styles.headerRow}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.badgeHeader}>
            <span>📅 DAILY QUIZZES & CURRENT AFFAIRS ENGINE</span>
          </div>
          <h1 className={styles.title}>Daily Quizzes Hub</h1>
          <p className={styles.subtitle}>
            Manage and assign daily quiz challenges & current affairs quizzes for active users.
          </p>
        </div>

        <div className={styles.actionButtonsGroup}>
          <button className={styles.secondaryBtn} onClick={() => setShowHistoryModal(true)}>
            <span>📋 History Log ({history.length})</span>
          </button>
          <button className={styles.primaryBtn} onClick={saveAssignments} disabled={loading || !category}>
            <span>💾 Save Daily Quiz ({selectedIds.size} Selected)</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(99, 102, 241, 0.12)", color: "#6366f1" }}>📅</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>{date}</div>
            <div className={styles.kpiLabel}>Selected Date</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(168, 85, 247, 0.12)", color: "#a855f7" }}>🎯</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>{selectedIds.size}</div>
            <div className={styles.kpiLabel}>Assigned Questions</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>❓</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>{category?.questions?.length || 0}</div>
            <div className={styles.kpiLabel}>Question Bank Total</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>🏷️</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>{typeMeta.label}</div>
            <div className={styles.kpiLabel}>Quiz Category Type</div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.typeTabs}>
          {TYPES.map((t) => (
            <button
              key={t.key}
              className={`${styles.typeTab} ${type === t.key ? styles.typeTabActive : ''}`}
              onClick={() => setType(t.key)}
            >
              <span>{t.emoji} {t.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.dateField}>
          <span className={styles.dateLabel}>Date:</span>
          <input
            type="date"
            className={styles.inputControl}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button className={styles.secondaryBtn} onClick={() => setDate(today())} style={{ padding: "6px 12px" }}>
            Today
          </button>
        </div>
      </div>

      {!category && (
        <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid #f59e0b", padding: "20px", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong style={{ fontSize: "1rem", color: "#f59e0b" }}>Required Daily Quiz Category Missing</strong>
            <p style={{ margin: "4px 0 0", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
              Create the categories “Quiz of the day” and “Daily current affairs” in database.
            </p>
          </div>
          <button className={styles.primaryBtn} onClick={ensureCategories}>
            Create Daily Categories
          </button>
        </div>
      )}

      {category && (
        <div className={styles.mainGrid}>
          {/* LEFT: ADD NEW QUESTION */}
          <div className={styles.cardSection}>
            <h3 className={styles.cardTitle}>
              <span>➕ Add New Question to Bank</span>
            </h3>

            <form onSubmit={handleAddManual} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Question Text *</label>
                <textarea
                  rows={3}
                  className={styles.formInput}
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Enter daily quiz question text..."
                  required
                />
              </div>

              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Option 1 *</label>
                  <input type="text" className={styles.formInput} value={manualOpt1} onChange={(e) => setManualOpt1(e.target.value)} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Option 2 *</label>
                  <input type="text" className={styles.formInput} value={manualOpt2} onChange={(e) => setManualOpt2(e.target.value)} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Option 3 *</label>
                  <input type="text" className={styles.formInput} value={manualOpt3} onChange={(e) => setManualOpt3(e.target.value)} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Option 4 *</label>
                  <input type="text" className={styles.formInput} value={manualOpt4} onChange={(e) => setManualOpt4(e.target.value)} required />
                </div>
              </div>

              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Correct Option</label>
                  <select className={styles.formInput} value={manualCorrect} onChange={(e) => setManualCorrect(Number(e.target.value))}>
                    <option value={1}>Option 1</option>
                    <option value={2}>Option 2</option>
                    <option value={3}>Option 3</option>
                    <option value={4}>Option 4</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Difficulty</label>
                  <select className={styles.formInput} value={manualDifficulty} onChange={(e) => setManualDifficulty(e.target.value)}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <button type="submit" className={styles.primaryBtn} disabled={loading} style={{ width: "100%", marginTop: "6px" }}>
                <span>Save Question to Bank</span>
              </button>
            </form>
          </div>

          {/* RIGHT: QUESTION BANK SELECTOR */}
          <div className={styles.cardSection}>
            <div className={styles.cardTitle}>
              <span>Question Bank ({questions.length})</span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button className={styles.secondaryBtn} style={{ padding: "4px 8px", fontSize: "0.75rem" }} onClick={selectAllVisible}>Select All</button>
                <button className={styles.secondaryBtn} style={{ padding: "4px 8px", fontSize: "0.75rem" }} onClick={clearAll}>Clear</button>
              </div>
            </div>

            <div className={styles.formGrid2}>
              <input
                type="text"
                className={styles.formInput}
                placeholder="🔍 Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select className={styles.formInput} value={diff} onChange={(e) => setDiff(e.target.value)}>
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className={styles.qList}>
              {questions.length === 0 ? (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", fontStyle: "italic" }}>No questions found in bank.</p>
              ) : (
                questions.map((q) => {
                  const isChecked = selectedIds.has(q.id);
                  return (
                    <div key={q.id} className={styles.qRow}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleOne(q.id)}
                        style={{ marginTop: "4px", accentColor: "#6366f1", cursor: "pointer" }}
                      />

                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)" }}>{q.text}</span>
                        <span className={`${styles.diffTag} ${styles[q.difficulty || 'easy']}`}>{q.difficulty || 'easy'}</span>
                      </div>

                      <div style={{ display: "flex", gap: "4px" }}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => {
                            setEditingQ(q);
                            setEditForm({ text: q.text, options: [...q.options], correctAnswer: q.correctAnswer, difficulty: q.difficulty || "easy" });
                            setShowEditModal(true);
                          }}
                        >
                          ✏️
                        </button>
                        <button className={styles.actionBtnDelete} onClick={() => handleDeleteClick(q.id)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT QUESTION MODAL */}
      {showEditModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--bg-primary, #fff)", borderRadius: "18px", padding: "24px", width: "90%", maxWidth: "500px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "1.2rem", fontWeight: 800 }}>✏️ Edit Daily Question</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label className={styles.formLabel}>Question Text</label>
                <textarea rows={3} className={styles.formInput} value={editForm.text} onChange={(e) => setEditForm({ ...editForm, text: e.target.value })} />
              </div>
              <div className={styles.formGrid2}>
                {editForm.options.map((opt, i) => (
                  <div key={i} className={styles.formGroup}>
                    <label className={styles.formLabel}>Option {i + 1}</label>
                    <input type="text" className={styles.formInput} value={opt} onChange={(e) => {
                      const copy = [...editForm.options];
                      copy[i] = e.target.value;
                      setEditForm({ ...editForm, options: copy });
                    }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button className={styles.secondaryBtn} onClick={() => setShowEditModal(false)}>Cancel</button>
                <button className={styles.primaryBtn} onClick={handleSaveEdit}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY LOG MODAL */}
      {showHistoryModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--bg-primary, #fff)", borderRadius: "18px", padding: "24px", width: "90%", maxWidth: "550px", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>📋 Daily Quizzes History</h3>
              <button className={styles.actionBtnDelete} onClick={() => setShowHistoryModal(false)}>✕</button>
            </div>

            {history.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>No history entries found.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {history.map((h) => (
                  <div key={h.date} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", border: "1px solid var(--card-border)", borderRadius: "10px", background: "var(--bg-secondary)" }}>
                    <div>
                      <strong style={{ fontSize: "0.9rem" }}>📅 {h.date}</strong>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{h.questionIds?.length || 0} Questions Assigned</div>
                    </div>
                    <button className={styles.secondaryBtn} style={{ padding: "4px 10px", fontSize: "0.78rem" }} onClick={() => setDate(h.date)}>
                      Load Date
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
