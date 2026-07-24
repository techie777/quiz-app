"use client";

import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Rocket, X, Download, Upload, Trash2, Edit, Copy, Settings, Check, ChevronRight, GripVertical, Clock, Target, Image as ImageIcon, Layers, FileSpreadsheet, Globe, Award, Play } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from '@/styles/AdminMockManager.module.css';

// Components
import CategoryTreeTable from '@/components/admin/mock-tests/CategoryTreeTable';
import CategoryDrawer from '@/components/admin/mock-tests/CategoryDrawer';
import SubCategoryDrawer from '@/components/admin/mock-tests/SubCategoryDrawer';
import QuestionBankManager from '@/components/admin/mock-tests/QuestionBankManager';
import QuestionDrawer from '@/components/admin/mock-tests/QuestionDrawer';
import BulkValidationSandbox from '@/components/admin/mock-tests/BulkValidationSandbox';
import DraggableRow from '@/components/admin/mock-tests/DraggableRow';
import HorizontalFilterBar from '@/components/admin/mock-tests/HorizontalFilterBar';
import PaperDrawer from '@/components/admin/mock-tests/PaperDrawer';
import WizardSectionRow from '@/components/admin/mock-tests/WizardSectionRow';

export default function MockTestsManager() {
  const [exams, setExams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('categories');
  const [mounted, setMounted] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [sandboxData, setSandboxData] = useState([]);

  const [examForm, setExamForm] = useState({ id: '', name: '', slug: '', emoji: '📝', description: '', categoryId: '', sortOrder: 0, hidden: false, quizCategoryIds: [], booksJson: '[]', studyMaterialJson: '[]' });
  const [categoryForm, setCategoryForm] = useState({ id: '', name: '', slug: '', icon: '📚', sortOrder: 0 });
  const [paperForm, setPaperForm] = useState({ id: '', examId: '', title: '', slug: '', timeLimit: 60, totalMarks: 100, negativeMarking: 0.25, positiveMarking: 1.0, instructionType: 'TCS', instructions: '', isLive: false, showSolutions: false, paperType: 'MOCK', year: 2025 });
  const [questionForm, setQuestionForm] = useState({ id: '', paperId: '', sectionId: '', text: '', textHi: '', options: ["", "", "", ""], optionsHi: ["", "", "", ""], answer: 0, explanation: '', explanationHi: '', image: '', type: 'MCQ', difficulty: 'Medium' });

  const [selectedFilterCategoryId, setSelectedFilterCategoryId] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedPaperId, setSelectedPaperId] = useState('');
  const [sections, setSections] = useState([]);
  const [questions, setQuestions] = useState([]);

  const [quizCategories, setQuizCategories] = useState([]);
  const [examInfoSections, setExamInfoSections] = useState([]);
  const [editingInfoSection, setEditingInfoSection] = useState({ id: '', examId: '', title: '', content: '', type: 'TEXT', sortOrder: 0 });
  const [examModalActiveTab, setExamModalActiveTab] = useState('general');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleReorder = async (model, items) => {
    try {
      const res = await fetch('/api/admin/mock-reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, items: items.map((item, idx) => ({ id: item.id, sortOrder: idx })) })
      });
      if (!res.ok) throw new Error("Failed to sync order");
    } catch (err) {
      console.error(err);
      alert("Order sync failed. Please refresh.");
    }
  };

  const onDragEnd = (event, type) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    let setter, list;
    if (type === 'categories') { setter = setCategories; list = categories; }
    else if (type === 'exams') { setter = setExams; list = exams; }
    else if (type === 'papers') { setter = setPapers; list = papers; }
    else if (type === 'questions') { setter = setQuestions; list = questions; }

    if (!setter) return;

    const oldIdx = list.findIndex(i => i.id === active.id);
    const newIdx = list.findIndex(i => i.id === over.id);

    const newList = arrayMove(list, oldIdx, newIdx);
    setter(newList);

    const modelMap = {
      'categories': 'category',
      'exams': 'exam',
      'papers': 'paper',
      'questions': 'question'
    };
    handleReorder(modelMap[type], newList);
  };

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [exRes, catRes] = await Promise.all([
        fetch('/api/admin/mock-exams-manager'),
        fetch('/api/admin/mock-categories')
      ]);
      if (exRes.ok) setExams(await exRes.json());
      if (catRes.ok) setCategories(await catRes.json());

      const quizCatRes = await fetch('/api/admin/fun-facts/categories');
      if (quizCatRes.ok) setQuizCategories(await quizCatRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPapers = async () => {
    if (!selectedExamId) { setPapers([]); return; }
    try {
      const res = await fetch(`/api/admin/mock-papers?examId=${selectedExamId}`);
      if (res.ok) setPapers(await res.json());
    } catch (error) { console.error(error); }
  };

  const fetchSections = async () => {
    if (!selectedPaperId) { setSections([]); return; }
    try {
      const res = await fetch(`/api/admin/mock-sections?paperId=${selectedPaperId}`);
      if (res.ok) setSections(await res.json());
    } catch (error) { console.error(error); }
  };

  const refreshExamSections = async (examId) => {
    if (!examId) { setExamInfoSections([]); return; }
    try {
      const res = await fetch(`/api/admin/mock-exam-sections?examId=${examId}`);
      if (res.ok) setExamInfoSections(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchQuestions = async () => {
    if (!selectedPaperId) { setQuestions([]); return; }
    try {
      const res = await fetch(`/api/admin/mock-questions?paperId=${selectedPaperId}`);
      if (res.ok) setQuestions(await res.json());
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if (activeTab === 'papers') fetchPapers();
  }, [selectedExamId, activeTab]);

  useEffect(() => {
    if (activeTab === 'questions') {
      fetchSections();
      fetchQuestions();
    }
  }, [selectedPaperId, activeTab]);

  useEffect(() => {
    if (isExamModalOpen && examForm.id) {
      refreshExamSections(examForm.id);
    } else if (isExamModalOpen && !examForm.id) {
      setExamInfoSections([]);
    }
  }, [isExamModalOpen, examForm.id]);

  const saveExam = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/mock-exams-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examForm)
      });
      if (res.ok) {
        setIsExamModalOpen(false);
        fetchData();
      } else {
        alert("Failed to save exam");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveInfoSection = async (e) => {
    if (e) e.preventDefault();
    if (!examForm.id || !editingInfoSection.title) return;
    try {
      const res = await fetch('/api/admin/mock-exam-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingInfoSection, examId: examForm.id })
      });
      if (res.ok) {
        setEditingInfoSection({ id: '', examId: examForm.id, title: '', content: '', type: 'TEXT', sortOrder: 0 });
        refreshExamSections(examForm.id);
      }
    } catch (err) {
      console.error("Failed to save info section:", err);
    }
  };

  const deleteInfoSection = async (id) => {
    if (!confirm('Delete this section?')) return;
    try {
      const res = await fetch(`/api/admin/mock-exam-sections?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        refreshExamSections(examForm.id);
      }
    } catch (err) {
      console.error("Failed to delete info section:", err);
    }
  };

  const handleBulkAction = (action, selectedIds) => {
    console.log("Bulk action:", action, selectedIds);
  };

  const deleteExam = async (id) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;
    await fetch(`/api/admin/mock-exams-manager?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/mock-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      });
      if (res.ok) {
        setIsCategoryModalOpen(false);
        fetchData();
      } else {
        alert("Failed to save category");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteCategory = async (id) => {
    if (!confirm('Are you sure you want to delete this category? Ensure no exams are linked before deleting.')) return;
    await fetch(`/api/admin/mock-categories?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const savePaper = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/mock-papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paperForm)
      });
      if (res.ok) {
        setIsPaperModalOpen(false);
        fetchPapers();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save paper");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deletePaper = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Mock Test? This will permanently delete all its sections and questions.')) return;
    await fetch(`/api/admin/mock-papers?id=${id}`, { method: 'DELETE' });
    fetchPapers();
  };

  const clonePaper = async (id) => {
    try {
      const res = await fetch('/api/admin/mock-papers/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalPaperId: id })
      });
      if (res.ok) {
        alert("Mock Test Cloned Successfully!");
        fetchPapers();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to clone paper");
      }
    } catch (e) {
      console.error(e);
      alert("Error cloning paper");
    }
  };

  const saveQuestion = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/mock-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...questionForm, paperId: selectedPaperId })
      });
      if (res.ok) {
        setIsQuestionModalOpen(false);
        fetchQuestions();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save question");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteQuestion = async (id) => {
    if (!confirm('Delete this question?')) return;
    await fetch(`/api/admin/mock-questions?id=${id}`, { method: 'DELETE' });
    fetchQuestions();
  };

  const handleImageUpload = async (e, type, index = null) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        if (type === 'question') {
          setQuestionForm(prev => ({ ...prev, image: data.url }));
        } else if (type === 'option') {
          const nOpt = [...questionForm.options];
          nOpt[index] = data.url;
          setQuestionForm(prev => ({ ...prev, options: nOpt }));
        }
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Upload error");
    }
  };

  const [bulkFile, setBulkFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile || !selectedPaperId) return alert("Select file and paper first");

    setIsUploading(true);
    try {
      const XLSXModule = await import("xlsx");
      const XLSX = XLSXModule.default || XLSXModule;
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const bData = XLSX.utils.sheet_to_json(ws);

        if (bData.length === 0) { setIsUploading(false); return alert("File is empty"); }

        const transformed = bData.map(row => ({
          text: row["Question (EN)"] || "",
          textHi: row["Question (HI)"] || "",
          options: [row["Option 1 (EN)"] || "", row["Option 2 (EN)"] || "", row["Option 3 (EN)"] || "", row["Option 4 (EN)"] || ""],
          optionsHi: [row["Option 1 (HI)"] || "", row["Option 2 (HI)"] || "", row["Option 3 (HI)"] || "", row["Option 4 (HI)"] || ""],
          answer: (parseInt(row["Correct Answer (1-4)"]) - 1) || 0,
          sectionName: row["Section Name"] || "",
          difficulty: row["Difficulty"] || "Medium",
          explanation: row["Explanation (EN)"] || "",
          explanationHi: row["Explanation (HI)"] || "",
          image: row["Image URL"] || ""
        }));

        setSandboxData(transformed);
        setIsSandboxOpen(true);
        setIsBulkModalOpen(false);
        setIsUploading(false);
      };
      reader.readAsBinaryString(bulkFile);
    } catch (err) {
      console.error(err);
      setIsUploading(false);
    }
  };

  const downloadSampleTemplate = async () => {
    try {
      const XLSXModule = await import("xlsx");
      const XLSX = XLSXModule.default || XLSXModule;
      const headers = [
        "Section Name", "Question (EN)",
        "Option 1 (EN)", "Option 2 (EN)", "Option 3 (EN)", "Option 4 (EN)", "Explanation (EN)",
        "Question (HI)",
        "Option 1 (HI)", "Option 2 (HI)", "Option 3 (HI)", "Option 4 (HI)", "Explanation (HI)",
        "Correct Answer (1-4)", "Difficulty", "Image URL"
      ];
      const dummyData = [
        {
          "Section Name": "General Intelligence",
          "Question (EN)": "Which number comes next in the sequence: 2, 4, 8, 16, ...?",
          "Option 1 (EN)": "24", "Option 2 (EN)": "32", "Option 3 (EN)": "64", "Option 4 (EN)": "128",
          "Explanation (EN)": "Each number is multiplied by 2. Next is 16 * 2 = 32.",
          "Question (HI)": "श्रृंखला में अगला नंबर कौन सा आता है: 2, 4, 8, 16, ...?",
          "Option 1 (HI)": "24", "Option 2 (HI)": "32", "Option 3 (HI)": "64", "Option 4 (HI)": "128",
          "Explanation (HI)": "प्रत्येक संख्या को 2 से गुणा किया जाता है। अगला 16 * 2 = 32 है।",
          "Correct Answer (1-4)": 2,
          "Difficulty": "Easy",
          "Image URL": ""
        }
      ];
      const ws = XLSX.utils.json_to_sheet(dummyData, { header: headers });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "BilingualQuestions");
      XLSX.writeFile(wb, "Mock_Test_Bilingual_Template.xlsx");
    } catch (err) { console.error(err); }
  };

  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeExams = Array.isArray(exams) ? exams : [];
  const safePapers = Array.isArray(papers) ? papers : [];
  const safeSections = Array.isArray(sections) ? sections : [];
  const safeQuestions = Array.isArray(questions) ? questions : [];

  if (!mounted) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-secondary)", fontWeight: 700 }}>
          Initializing Mock Tests Engine...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header Banner */}
      <div className={styles.headerRow}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.badgeHeader}>
            <Award size={14} />
            <span>🏆 FLAGSHIP MOCK TESTS ENGINE</span>
          </div>
          <h1 className={styles.title}>Mock Tests & Exam Series</h1>
          <p className={styles.subtitle}>
            Build bilingual mock papers, manage exam hierarchy, and configure live home page trial tests.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className={styles.secondaryBtn} onClick={downloadSampleTemplate}>
            <Download size={16} />
            <span>📥 Download Excel Template</span>
          </button>
        </div>
      </div>

      {/* Executive KPI Overview Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(99, 102, 241, 0.12)", color: "#6366f1" }}>📚</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>{safeCategories.length}</div>
            <div className={styles.kpiLabel}>Exam Categories</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>🎯</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>{safeExams.length}</div>
            <div className={styles.kpiLabel}>Target Sub-Exams</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(168, 85, 247, 0.12)", color: "#a855f7" }}>📄</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>{safePapers.length}</div>
            <div className={styles.kpiLabel}>Paper Inventory</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>🌐</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>100%</div>
            <div className={styles.kpiLabel}>Bilingual Coverage</div>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className={styles.tabsHeader}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'categories' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <Layers size={16} />
          <span>Exam Hierarchy & Categories</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'papers' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('papers')}
        >
          <FileSpreadsheet size={16} />
          <span>Mock Papers Inventory</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'questions' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          <Globe size={16} />
          <span>Bilingual Question Bank</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-secondary)" }}>
          Initializing Mock Tests Engine...
        </div>
      ) : activeTab === 'categories' ? (
        <div className={styles.cardSection}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 className={styles.cardTitle}>Exam Hierarchy Manager</h2>
              <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                Manage main exam categories (SSC, Banking, Railways) and link sub-exams.
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className={styles.secondaryBtn}
                onClick={() => {
                  setCategoryForm({ id: '', name: '', slug: '', icon: '📚', sortOrder: 0 });
                  setIsCategoryModalOpen(true);
                }}
              >
                + New Main Category
              </button>
              <button
                className={styles.primaryBtn}
                onClick={() => {
                  setExamForm({ id: '', name: '', slug: '', emoji: '📝', description: '', categoryId: '', sortOrder: 0, hidden: false, quizCategoryIds: [], booksJson: '[]', studyMaterialJson: '[]' });
                  setIsExamModalOpen(true);
                }}
              >
                + Add Sub-Exam
              </button>
            </div>
          </div>

          <CategoryTreeTable
            categories={safeCategories}
            exams={safeExams}
            onReorder={(type, newList) => handleReorder(type, newList)}
            onEditCategory={(cat) => { setCategoryForm(cat); setIsCategoryModalOpen(true); }}
            onDeleteCategory={deleteCategory}
            onEditExam={(ex) => {
              setExamForm({ ...ex, categoryId: ex.categoryId || '', quizCategoryIds: ex.quizCategoryIds || [], booksJson: ex.booksJson || '[]', studyMaterialJson: ex.studyMaterialJson || '[]' });
              refreshExamSections(ex.id);
              setIsExamModalOpen(true);
            }}
            onDeleteExam={deleteExam}
            onBulkAction={handleBulkAction}
          />
        </div>
      ) : activeTab === 'papers' ? (
        <div className={styles.cardSection}>
          <HorizontalFilterBar
            categories={safeCategories}
            exams={safeExams}
            selectedCategoryId={selectedFilterCategoryId}
            selectedExamId={selectedExamId}
            onCategoryChange={(catId) => {
              setSelectedFilterCategoryId(catId);
              setSelectedExamId('');
            }}
            onExamChange={(exId) => setSelectedExamId(exId)}
            activeCount={safePapers.filter(p => p.isLive).length}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 className={styles.cardTitle}>Paper Inventory ({safePapers.length})</h3>
              <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                Configure test time limit, marks, TCS negative marking, and trial availability.
              </p>
            </div>

            <button
              disabled={!selectedExamId}
              className={styles.primaryBtn}
              style={{ opacity: selectedExamId ? 1 : 0.5 }}
              onClick={() => {
                setPaperForm({ id: '', examId: selectedExamId, title: '', slug: '', timeLimit: 60, totalMarks: 100, negativeMarking: 0.25, positiveMarking: 1.0, instructionType: 'TCS', instructions: '', isLive: false, showSolutions: false });
                setIsPaperModalOpen(true);
              }}
            >
              ⚡ + Create Mock Test
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left", fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 16px" }}>Paper Title</th>
                  <th style={{ padding: "12px 16px" }}>Timing & Marks</th>
                  <th style={{ padding: "12px 16px", textAlign: "center" }}>Questions</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {safePapers.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>{p.title}</strong>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>/{p.slug}</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      ⏱️ {p.timeLimit} mins • 🎯 {p.totalMarks} Marks
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 800, color: "#6366f1" }}>
                      {p._count?.questions || 0} Qs
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        background: p.isLive ? "rgba(16, 185, 129, 0.12)" : "rgba(148, 163, 184, 0.12)",
                        color: p.isLive ? "#10b981" : "#64748b"
                      }}>
                        {p.isLive ? "🟢 LIVE" : "⚪ DRAFT"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          className={styles.secondaryBtn}
                          style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                          onClick={() => { setSelectedPaperId(p.id); setActiveTab('questions'); }}
                        >
                          🚀 Questions
                        </button>
                        <button
                          className={styles.secondaryBtn}
                          style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                          onClick={() => { setPaperForm(p); setIsPaperModalOpen(true); }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className={styles.secondaryBtn}
                          style={{ padding: "4px 10px", fontSize: "0.78rem", color: "#f43f5e", borderColor: "rgba(244,63,94,0.3)" }}
                          onClick={() => deletePaper(p.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {safePapers.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)", fontStyle: "italic" }}>
                      Select a sub-exam to view paper inventory.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className={styles.cardSection}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", minWidth: "300px" }}>
              <select
                value={selectedPaperId}
                onChange={e => setSelectedPaperId(e.target.value)}
                style={{ padding: "10px 14px", border: "1.5px solid var(--card-border)", borderRadius: "12px", width: "100%", background: "var(--bg-primary)", color: "var(--text-primary)", fontWeight: 700 }}
              >
                <option value="">-- Select Mock Test Paper --</option>
                {safePapers.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                disabled={!selectedPaperId}
                className={styles.primaryBtn}
                onClick={() => {
                  setQuestionForm({ id: '', paperId: selectedPaperId, sectionId: '', text: '', textHi: '', options: ["", "", "", ""], optionsHi: ["", "", "", ""], answer: 0, explanation: '', explanationHi: '', image: '', type: 'MCQ', difficulty: 'Medium' });
                  setIsQuestionModalOpen(true);
                }}
              >
                + Manual Add Question
              </button>
              <button
                disabled={!selectedPaperId}
                className={styles.secondaryBtn}
                style={{ background: "#4f46e5", color: "#fff", border: "none" }}
                onClick={() => setIsBulkModalOpen(true)}
              >
                <Upload size={16} />
                <span>Bulk Excel Importer</span>
              </button>
            </div>
          </div>

          <QuestionBankManager
            questions={safeQuestions}
            sections={safeSections.filter(s => s.paperId === selectedPaperId)}
            onReorder={(newList) => {
              setQuestions(newList);
              handleReorder('question', newList);
            }}
            onEditQuestion={(q) => {
              setQuestionForm({
                ...q,
                options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
                optionsHi: typeof q.optionsHi === 'string' ? JSON.parse(q.optionsHi) : (q.optionsHi || ["", "", "", ""])
              });
              setIsQuestionModalOpen(true);
            }}
            onDeleteQuestion={deleteQuestion}
          />
        </div>
      )}

      {/* Drawers and Modals */}
      <CategoryDrawer
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categoryForm={categoryForm}
        setCategoryForm={setCategoryForm}
        onSave={saveCategory}
      />

      <SubCategoryDrawer
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        examForm={examForm}
        setExamForm={setExamForm}
        categories={safeCategories}
        onSave={saveExam}
        examModalActiveTab={examModalActiveTab}
        setExamModalActiveTab={setExamModalActiveTab}
        quizCategories={quizCategories}
        examInfoSections={examInfoSections}
        editingInfoSection={editingInfoSection}
        setEditingInfoSection={setEditingInfoSection}
        saveInfoSection={saveInfoSection}
        deleteInfoSection={deleteInfoSection}
      />

      <PaperDrawer
        isOpen={isPaperModalOpen}
        onClose={() => setIsPaperModalOpen(false)}
        paperForm={paperForm}
        setPaperForm={setPaperForm}
        onSave={savePaper}
      />

      <QuestionDrawer
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        questionForm={questionForm}
        setQuestionForm={setQuestionForm}
        sections={sections}
        onSave={saveQuestion}
        onImageUpload={handleImageUpload}
      />

      {/* Bulk Upload Modal */}
      {isBulkModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          <div style={{ background: "var(--bg-primary)", border: "1px solid var(--card-border)", borderRadius: "20px", padding: "28px", maxWidth: "520px", width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800 }}>📊 Bilingual Excel Bulk Upload</h3>
              <button onClick={() => setIsBulkModalOpen(false)} style={{ border: "none", background: "transparent", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.88rem" }}>
              Upload questions in English and Hindi simultaneously using our Excel template.
            </p>

            <button className={styles.secondaryBtn} onClick={downloadSampleTemplate} style={{ justifyContent: "center" }}>
              <Download size={16} /> <span>Download Sample Template (.xlsx)</span>
            </button>

            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setBulkFile(e.target.files[0])}
              style={{ padding: "10px", border: "1px dashed var(--card-border)", borderRadius: "12px" }}
            />

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button className={styles.primaryBtn} onClick={handleBulkUpload} disabled={isUploading} style={{ flex: 1 }}>
                {isUploading ? "Reading File..." : "🚀 Validate in Sandbox"}
              </button>
              <button className={styles.secondaryBtn} onClick={() => setIsBulkModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Sandbox Modal */}
      <BulkValidationSandbox
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        sandboxData={sandboxData}
        setSandboxData={setSandboxData}
        sections={safeSections}
        paperId={selectedPaperId}
        onImportSuccess={() => {
          setIsSandboxOpen(false);
          fetchQuestions();
        }}
      />
    </div>
  );
}
