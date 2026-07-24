"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/GovtExamManagement.module.css";
import toast from "react-hot-toast";

export default function GovtExamManagement() {
  const { quizzes, updateCategory, addCategory, deleteCategory, addQuestion, updateQuestion, deleteQuestion, refreshQuizzes } = useData();
  const { adminUser } = useAdmin();
  const allowed = adminUser?.role === "master" || adminUser?.permissions?.govtExams !== false;

  const [activeTab, setActiveTab] = useState("theory"); // "theory", "categories", "questions", "jobs"

  // Theory Tab State
  const [selectedTheoryCatId, setSelectedTheoryCatId] = useState("");
  const [theorySearch, setTheorySearch] = useState("");
  const [theoryForm, setTheoryForm] = useState({
    topic: "",
    topicHi: "",
    description: "",
    descriptionHi: "",
    storyText: "",
    storyImage: "",
    hidden: false,
    originalLang: "en"
  });

  // Jobs / Notifications State
  const [exams, setExams] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [examFormData, setExamFormData] = useState({
    title: "",
    category: "Central Govt",
    organization: "",
    governmentType: "Central Govt",
    vacancies: "",
    postNames: "",
    qualification: "",
    ageLimit: "",
    eligibility: "",
    startDate: "",
    lastDate: "",
    quota: { gen: 0, sc: 0, st: 0, obc: 0 },
    syllabus: "",
    applicationFee: "",
    officialWebsite: "",
    description: "",
    status: "active"
  });

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catForm, setCatForm] = useState({
    topic: "",
    topicHi: "",
    emoji: "🏛️",
    description: "",
    categoryClass: "govt-exam",
    hidden: false,
    parentId: ""
  });

  // Question Modal State
  const [isQModalOpen, setIsQModalOpen] = useState(false);
  const [editingQ, setEditingQ] = useState(null);
  const [qCatId, setQCatId] = useState("");
  const [qForm, setQForm] = useState({
    text: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    difficulty: "easy",
    explanation: "",
    image: ""
  });

  // Load Exam Job Notifications
  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await fetch('/api/govt-exams');
      if (response.ok) {
        const data = await response.json();
        setExams(data.exams || data);
      }
    } catch (error) {
      console.error('Failed to fetch exams:', error);
    }
  };

  const safeQuizzes = useMemo(() => (Array.isArray(quizzes) ? quizzes : []), [quizzes]);

  // Filter Govt Exam Categories
  const govtCategories = useMemo(() => {
    return safeQuizzes.filter((c) => {
      const cls = c.categoryClass || "";
      return cls.includes("govt-exam") || c.topic?.toLowerCase().includes("gk") || c.topic?.toLowerCase().includes("history") || c.topic?.toLowerCase().includes("science") || c.topic?.toLowerCase().includes("polity") || c.topic?.toLowerCase().includes("exam");
    });
  }, [safeQuizzes]);

  // Selected Theory Category
  const selectedTheoryCategory = useMemo(() => {
    if (!selectedTheoryCatId) return govtCategories[0] || safeQuizzes[0] || null;
    return safeQuizzes.find((c) => c.id === selectedTheoryCatId) || govtCategories[0] || null;
  }, [selectedTheoryCatId, safeQuizzes, govtCategories]);

  // Sync Theory Form when selected category changes
  useEffect(() => {
    if (selectedTheoryCategory) {
      setTheoryForm({
        topic: selectedTheoryCategory.topic || "",
        topicHi: selectedTheoryCategory.topicHi || "",
        description: selectedTheoryCategory.description || "",
        descriptionHi: selectedTheoryCategory.descriptionHi || "",
        storyText: selectedTheoryCategory.storyText || "",
        storyImage: selectedTheoryCategory.storyImage || "",
        hidden: !!selectedTheoryCategory.hidden,
        originalLang: selectedTheoryCategory.originalLang || "en"
      });
    }
  }, [selectedTheoryCategory]);

  if (!allowed) {
    return (
      <div className={styles.container}>
        <p>Access denied.</p>
      </div>
    );
  }

  // Handle Theory Save
  const handleSaveTheory = async () => {
    if (!selectedTheoryCategory) return;
    try {
      const updates = {
        topic: theoryForm.topic,
        topicHi: theoryForm.topicHi || null,
        description: theoryForm.description,
        descriptionHi: theoryForm.descriptionHi || null,
        storyText: theoryForm.storyText || "",
        storyImage: theoryForm.storyImage || null,
        hidden: !!theoryForm.hidden,
        originalLang: theoryForm.originalLang || "en"
      };

      const success = await updateCategory(selectedTheoryCategory.id, updates);
      if (success) {
        toast.success("Chapter Theory & Notes saved! Customer Read Mode is now updated.");
      } else {
        toast.error("Failed to save Theory notes.");
      }
    } catch (error) {
      console.error("Save Theory Error:", error);
      toast.error("Error saving theory notes.");
    }
  };

  // Upload Theory Image
  const handleTheoryImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setTheoryForm((prev) => ({ ...prev, storyImage: result.url }));
        toast.success('Theory diagram uploaded!');
      } else {
        toast.error('Failed to upload theory image');
      }
    } catch (error) {
      toast.error('Upload error');
    }
  };

  // Save Category
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (!catForm.topic.trim()) {
        toast.error("Category topic is required!");
        return;
      }

      if (editingCategory) {
        await updateCategory(editingCategory.id, catForm);
        toast.success("Govt Exam Category updated!");
      } else {
        await addCategory({
          ...catForm,
          categoryClass: "govt-exam",
        });
        toast.success("Govt Exam Category created!");
      }
      setIsCatModalOpen(false);
      setEditingCategory(null);
    } catch (err) {
      toast.error("Failed to save category.");
    }
  };

  // Save Question
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    try {
      if (!qForm.text.trim() || !qForm.correctAnswer || !qCatId) {
        toast.error("Question text, answer, and category are required!");
        return;
      }

      if (editingQ) {
        await updateQuestion(qCatId, editingQ.id, qForm);
        toast.success("Question updated!");
      } else {
        await addQuestion(qCatId, qForm);
        toast.success("Question added to Govt Exam chapter!");
      }
      setIsQModalOpen(false);
      setEditingQ(null);
    } catch (err) {
      toast.error("Failed to save question.");
    }
  };

  // Save Job Notification
  const handleSaveExamJob = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/govt-exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examFormData)
      });
      if (res.ok) {
        await fetchExams();
        setIsModalOpen(false);
        setEditingExam(null);
        toast.success("Exam Job notification saved!");
      }
    } catch (error) {
      toast.error("Failed to save exam notification.");
    }
  };

  return (
    <div className={styles.container}>
      
      {/* Header Banner */}
      <div className={styles.header}>
        <h1 className={styles.title}>Government Exam Master Hub</h1>
        <p className={styles.subtitle}>
          Full control over Govt Exam Read Mode, Chapter Theory Notes, Questions & Recruitment Alerts
        </p>
      </div>

      {/* Primary Tab Navigation */}
      <div className={styles.actions}>
        <div className={styles.tabNavigation}>
          <button
            className={`${styles.tabButton} ${activeTab === 'theory' ? styles.active : ''}`}
            onClick={() => setActiveTab('theory')}
          >
            <span>📖 Chapter Theory & Read Mode Notes</span>
          </button>

          <button
            className={`${styles.tabButton} ${activeTab === 'categories' ? styles.active : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <span>🏛️ Govt Exam Categories ({govtCategories.length})</span>
          </button>

          <button
            className={`${styles.tabButton} ${activeTab === 'questions' ? styles.active : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            <span>❓ Exam Quiz Questions</span>
          </button>

          <button
            className={`${styles.tabButton} ${activeTab === 'jobs' ? styles.active : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            <span>📋 Job Vacancies & Alerts ({exams.length})</span>
          </button>
        </div>

        <div className={styles.stats}>
          <div className={styles.statItem}>
            Total Categories: <strong>{quizzes.length}</strong>
          </div>
          <div className={styles.statItem}>
            Govt Exam Subjects: <strong>{govtCategories.length}</strong>
          </div>
        </div>
      </div>

      {/* TAB 1: CHAPTER THEORY & READ MODE NOTES */}
      {activeTab === 'theory' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
          
          {/* Left Column: Chapter List */}
          <div style={{ background: 'var(--bg-primary, #fff)', border: '1px solid var(--card-border, #e2e8f0)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              📚 Select Chapter / Subject
            </h3>
            
            <input
              type="text"
              placeholder="Search chapters..."
              value={theorySearch}
              onChange={(e) => setTheorySearch(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '10px', border: '1.5px solid var(--card-border, #cbd5e1)', fontSize: '0.85rem' }}
            />

            <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {safeQuizzes
                .filter((c) => !theorySearch || c.topic?.toLowerCase().includes(theorySearch.toLowerCase()))
                .map((cat) => {
                  const isSelected = (selectedTheoryCategory?.id === cat.id);
                  const hasTheory = !!cat.storyText;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedTheoryCatId(cat.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-secondary, #f8fafc)',
                        border: isSelected ? '1.5px solid #6366f1' : '1px solid var(--card-border, #e2e8f0)',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <span style={{ fontSize: '1.2rem' }}>{cat.emoji || '📖'}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: isSelected ? 700 : 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {cat.topic}
                        </span>
                      </div>
                      {hasTheory ? (
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#10b981', color: '#fff', padding: '2px 6px', borderRadius: '10px' }}>NOTES</span>
                      ) : (
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>0 NOTES</span>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Right Column: Theory & Notes Editor Panel */}
          {selectedTheoryCategory ? (
            <div style={{ background: 'var(--bg-primary, #fff)', border: '1px solid var(--card-border, #e2e8f0)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>{selectedTheoryCategory.emoji || '📖'}</span>
                    <span>{selectedTheoryCategory.topic}</span>
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Edit chapter theory, study notes, and explanations for Customer App Read Mode
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link
                    href={`/quizzes?mode=read&cat=${encodeURIComponent(selectedTheoryCategory.id)}`}
                    target="_blank"
                    style={{ padding: '8px 14px', borderRadius: '10px', border: '1.5px solid #6366f1', color: '#6366f1', textDecoration: 'none', fontWeight: 700, fontSize: '0.82rem' }}
                  >
                    👁️ Customer Preview
                  </Link>

                  <button
                    onClick={handleSaveTheory}
                    style={{ padding: '8px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}
                  >
                    💾 Save Theory Notes
                  </button>
                </div>
              </div>

              {/* Form Controls */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Chapter Topic Title (English)
                  </label>
                  <input
                    type="text"
                    value={theoryForm.topic}
                    onChange={(e) => setTheoryForm({ ...theoryForm, topic: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--card-border)', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Chapter Topic Title (Hindi)
                  </label>
                  <input
                    type="text"
                    value={theoryForm.topicHi}
                    onChange={(e) => setTheoryForm({ ...theoryForm, topicHi: e.target.value })}
                    placeholder="जैसे: प्राचीन एवं मध्यकालीन भारतीय इतिहास"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--card-border)', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* Theory Content Multiline Input */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: '#6366f1' }}>
                    📖 Chapter Theory, Explanations & Study Notes (Read Mode Feed)
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Supports paragraphs & multiline text</span>
                </div>
                <textarea
                  rows={10}
                  value={theoryForm.storyText}
                  onChange={(e) => setTheoryForm({ ...theoryForm, storyText: e.target.value })}
                  placeholder="Write comprehensive chapter notes, historical timelines, key formulas, rules, or explanations for this exam chapter..."
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid var(--card-border)', fontSize: '0.92rem', lineHeight: '1.6', fontFamily: 'inherit' }}
                />
              </div>

              {/* Theory Image Upload */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Theory Diagram / Concept Image
                  </label>
                  <input type="file" accept="image/*" onChange={handleTheoryImageUpload} style={{ fontSize: '0.85rem' }} />
                </div>

                {theoryForm.storyImage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={theoryForm.storyImage} alt="Theory preview" style={{ width: '90px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => setTheoryForm({ ...theoryForm, storyImage: "" })}
                      style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Status Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingTop: '12px', borderTop: '1px solid var(--card-border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={theoryForm.hidden}
                    onChange={(e) => setTheoryForm({ ...theoryForm, hidden: e.target.checked })}
                  />
                  <span>Hide from public Customer App</span>
                </label>
              </div>

            </div>
          ) : (
            <div style={{ background: 'var(--bg-primary, #fff)', borderRadius: '16px', padding: '40px', textAlignment: 'center', color: 'var(--text-muted)' }}>
              Select a chapter on the left to edit theory notes.
            </div>
          )}

        </div>
      )}

      {/* TAB 2: GOVT EXAM CATEGORIES & SUBJECTS */}
      {activeTab === 'categories' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Govt Exam Categories & Subjects</h2>
            <button
              onClick={() => { setEditingCategory(null); setCatForm({ topic: "", topicHi: "", emoji: "🏛️", description: "", categoryClass: "govt-exam", hidden: false, parentId: "" }); setIsCatModalOpen(true); }}
              style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
            >
              + Add Govt Exam Subject
            </button>
          </div>

          <div className={styles.categoryGrid}>
            {govtCategories.map((cat) => (
              <div key={cat.id} className={styles.categoryCard}>
                <div className={styles.categoryHeader}>
                  <div className={styles.categoryInfo}>
                    <span className={styles.categoryIconLarge}>{cat.emoji || '🏛️'}</span>
                    <h3 className={styles.categoryName}>{cat.topic}</h3>
                    {cat.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{cat.description}</p>}
                  </div>
                  <div className={styles.categoryActions}>
                    <button className={styles.editButton} onClick={() => { setEditingCategory(cat); setCatForm(cat); setIsCatModalOpen(true); }}>✏️</button>
                    <button className={styles.deleteButton} onClick={() => deleteCategory(cat.id)}>🗑️</button>
                  </div>
                </div>

                <div className={styles.categoryDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Questions</span>
                    <span className={styles.value}><strong>{cat.questionCount || 0}</strong> Questions</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Read Mode Sets</span>
                    <span className={styles.value}><strong>{Math.ceil((cat.questionCount || 0) / 20)}</strong> Sets</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: EXAM QUIZ QUESTIONS */}
      {activeTab === 'questions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Govt Exam Question Bank</h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Add, edit, or remove questions across all Govt Exam chapters</p>
            </div>
            <button
              onClick={() => { setEditingQ(null); setQForm({ text: "", options: ["", "", "", ""], correctAnswer: "", difficulty: "easy", explanation: "", image: "" }); setQCatId(govtCategories[0]?.id || ""); setIsQModalOpen(true); }}
              style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
            >
              + Add Question
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {govtCategories.map((cat) => (
              <div key={cat.id} style={{ background: 'var(--bg-primary, #fff)', border: '1px solid var(--card-border, #e2e8f0)', borderRadius: '14px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.4rem' }}>{cat.emoji || '🏛️'}</span>
                    <strong style={{ fontSize: '0.95rem' }}>{cat.topic}</strong>
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                    {cat.questionCount || 0} Qs
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link
                    href={`/admin/questions?category=${cat.id}`}
                    style={{ flex: 1, padding: '8px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', borderRadius: '8px', textAlign: 'center', textDecoration: 'none', fontWeight: 700, fontSize: '0.78rem' }}
                  >
                    Manage Questions →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: JOB VACANCIES & EXAM NOTIFICATIONS */}
      {activeTab === 'jobs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Recruitment Alerts & Exam Notifications</h2>
            <button
              onClick={() => { setEditingExam(null); setIsModalOpen(true); }}
              style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
            >
              + Add Exam Notification
            </button>
          </div>

          <div className={styles.examGrid}>
            {exams.map((exam) => (
              <div key={exam._id || exam.id} className={styles.examCard}>
                <div className={styles.examHeader}>
                  <div className={styles.examInfo}>
                    <h3 className={styles.examTitle}>{exam.title}</h3>
                    <div className={styles.examMeta}>
                      <span className={styles.category}>{exam.organization}</span>
                      <span className={styles.govtType}>{exam.governmentType}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.examDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Vacancies</span>
                    <span className={styles.value}>{exam.vacancies}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Last Date</span>
                    <span className={styles.value}>{exam.lastDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {isCatModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-primary, #fff)', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '480px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem', fontWeight: 800 }}>{editingCategory ? "Edit Subject" : "Add Govt Exam Subject"}</h3>
            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Emoji Icon</label>
                <input type="text" value={catForm.emoji} onChange={(e) => setCatForm({ ...catForm, emoji: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Subject Name (English)</label>
                <input type="text" value={catForm.topic} onChange={(e) => setCatForm({ ...catForm, topic: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Subject Name (Hindi)</label>
                <input type="text" value={catForm.topicHi || ""} onChange={(e) => setCatForm({ ...catForm, topicHi: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsCatModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700 }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
