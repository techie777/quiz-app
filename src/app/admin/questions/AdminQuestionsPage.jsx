"use client";

import { useState, useMemo } from "react";
import { useData } from "@/context/DataContext";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminQuestions.module.css";

const EMPTY_Q = { text: "", options: ["", "", "", ""], correctAnswer: "", difficulty: "easy", image: "" };

async function submitPending(type, payload) {
  const res = await fetch("/api/admin/pending", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, payload }),
  });
  if (res.ok) alert("Your change has been submitted for approval.");
  else alert("Failed to submit change for approval.");
}

export default function AdminQuestionsPage() {
  const { quizzes, addQuestion, updateQuestion, deleteQuestion } = useData();
  const { adminUser } = useAdmin();
  const isJr = adminUser?.role === "jr";
  const [filterCat, setFilterCat] = useState("all");
  const [filterDiff, setFilterDiff] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [editingQ, setEditingQ] = useState(null);
  const [form, setForm] = useState(EMPTY_Q);
  const [formCatId, setFormCatId] = useState("");

  // Build flat list
  const allQuestions = useMemo(() => {
    const list = [];
    quizzes.forEach((cat) =>
      cat.questions.forEach((q) =>
        list.push({ ...q, categoryId: cat.id, categoryTopic: cat.topic, categoryEmoji: cat.emoji })
      )
    );
    return list;
  }, [quizzes]);

  const filtered = useMemo(() => {
    return allQuestions.filter((q) => {
      if (filterCat !== "all" && q.categoryId !== filterCat) return false;
      if (filterDiff !== "all" && q.difficulty !== filterDiff) return false;
      if (search && !q.text.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [allQuestions, filterCat, filterDiff, search]);

  const openAdd = () => {
    setEditingQ(null);
    setEditingCat(null);
    setForm(EMPTY_Q);
    setFormCatId(quizzes[0]?.id || "");
    setModalOpen(true);
  };

  const openEdit = (q) => {
    setEditingQ(q);
    setEditingCat(q.categoryId);
    setFormCatId(q.categoryId);
    setForm({
      text: q.text,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
      difficulty: q.difficulty,
      image: q.image || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.text.trim() || !form.correctAnswer || !formCatId) return;
    if (form.options.some((o) => !o.trim())) return;

    if (editingQ) {
      const data = { text: form.text, options: form.options, correctAnswer: form.correctAnswer, difficulty: form.difficulty, image: form.image };
      if (isJr) {
        await submitPending("update_question", { categoryId: editingCat, questionId: editingQ.id, ...data });
      } else {
        updateQuestion(editingCat, editingQ.id, data);
      }
    } else {
      const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      if (isJr) {
        await submitPending("create_question", { categoryId: formCatId, id, ...form });
      } else {
        addQuestion(formCatId, { id, ...form });
      }
    }
    setModalOpen(false);
  };

  const handleDelete = async (catId, qId) => {
    if (isJr) {
      await submitPending("delete_question", { categoryId: catId, questionId: qId });
    } else {
      deleteQuestion(catId, qId);
    }
  };

  const setOption = (index, value) => {
    const opts = [...form.options];
    opts[index] = value;
    setForm({ ...form, options: opts });
  };

  const handleQImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm({ ...form, image: ev.target.result });
    reader.readAsDataURL(file);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Questions</h1>
          <p className={styles.subtitle}>{filtered.length} of {allQuestions.length} questions</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          + Add Question
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={styles.select}
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
        >
          <option value="all">All Categories</option>
          {quizzes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.topic}
            </option>
          ))}
        </select>
        <select
          className={styles.select}
          value={filterDiff}
          onChange={(e) => setFilterDiff(e.target.value)}
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Question List */}
      <div className={styles.list}>
        {filtered.map((q) => (
          <div key={q.id} className={`${styles.row} glass-card`}>
            <div className={styles.rowTop}>
              <span className={styles.catBadge}>
                {q.categoryEmoji} {q.categoryTopic}
              </span>
              <span className={`${styles.diffBadge} ${styles[q.difficulty]}`}>
                {q.difficulty}
              </span>
            </div>
            <p className={styles.questionText}>{q.text}</p>
            {q.image && <img src={q.image} alt="" className={styles.questionImg} />}
            <div className={styles.optionsList}>
              {q.options.map((opt, i) => (
                <span
                  key={i}
                  className={`${styles.optTag} ${opt === q.correctAnswer ? styles.correctTag : ""}`}
                >
                  {opt}
                </span>
              ))}
            </div>
            <div className={styles.rowActions}>
              <button className={styles.editBtn} onClick={() => openEdit(q)}>
                ✏️ Edit
              </button>
              <button
                className={styles.deleteBtn}
                onClick={() => handleDelete(q.categoryId, q.id)}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className={styles.empty}>No questions match your filters.</p>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className={styles.overlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {editingQ ? "Edit Question" : "Add Question"}
            </h2>

            <div className={styles.field}>
              <label>Category</label>
              <select
                className={styles.select}
                value={formCatId}
                onChange={(e) => setFormCatId(e.target.value)}
                disabled={!!editingQ}
              >
                {quizzes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.topic}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>Question Text</label>
              <textarea
                className={styles.textarea}
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                placeholder="Enter the question"
                rows={3}
              />
            </div>

            <div className={styles.field}>
              <label>Options (4 required)</label>
              {form.options.map((opt, i) => (
                <input
                  key={i}
                  className={styles.input}
                  value={opt}
                  onChange={(e) => setOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  style={{ marginBottom: 8 }}
                />
              ))}
            </div>

            <div className={styles.field}>
              <label>Correct Answer</label>
              <select
                className={styles.select}
                value={form.correctAnswer}
                onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
              >
                <option value="">Select correct answer</option>
                {form.options.filter(Boolean).map((opt, i) => (
                  <option key={i} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>Difficulty</label>
              <select
                className={styles.select}
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className={styles.field}>
              <label>Question Image (optional)</label>
              <input type="file" accept="image/*" onChange={handleQImageUpload} className={styles.fileInput} />
              {form.image && (
                <div className={styles.imgPreviewWrap}>
                  <img src={form.image} alt="Preview" className={styles.imgPreview} />
                  <button type="button" className={styles.removeImgBtn} onClick={() => setForm({ ...form, image: "" })}>✕ Remove</button>
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSave}>
                {editingQ ? "Save Changes" : "Add Question"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
