"use client";

import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Rocket, X, Download, Upload, Trash2, Edit, Copy, Settings, Check, ChevronRight, GripVertical, Clock, Target, Image as ImageIcon } from "lucide-react";
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
import styles from '@/styles/GovtExamManagement.module.css';

// New Restructured Components
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


// --- Page Component ---
export default function MockTestsManager() {
  const [exams, setExams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('categories'); // 'categories', 'papers', 'questions'
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

  // Selection states for filtering
  const [selectedFilterCategoryId, setSelectedFilterCategoryId] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedPaperId, setSelectedPaperId] = useState('');
  const [sections, setSections] = useState([]);
  const [questions, setQuestions] = useState([]);
  
  // Wizard States
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardSections, setWizardSections] = useState([
    { name: 'General Intelligence', timeLimit: 0, totalMarks: 0, totalQuestions: 0 },
    { name: 'General Awareness', timeLimit: 0, totalMarks: 0, totalQuestions: 0 },
    { name: 'Quantitative Aptitude', timeLimit: 0, totalMarks: 0, totalQuestions: 0 },
    { name: 'English Comprehension', timeLimit: 0, totalMarks: 0, totalQuestions: 0 }
  ]);
  const [isSlugEdited, setIsSlugEdited] = useState(false);

  const EXAM_TEMPLATES = {
    'SSC_CGL': [
      { name: 'General Intelligence', timeLimit: 15, totalMarks: 50, totalQuestions: 25 },
      { name: 'General Awareness', timeLimit: 15, totalMarks: 50, totalQuestions: 25 },
      { name: 'Quantitative Aptitude', timeLimit: 15, totalMarks: 50, totalQuestions: 25 },
      { name: 'English Comprehension', timeLimit: 15, totalMarks: 50, totalQuestions: 25 },
    ],
    'SSC_CHSL': [
      { name: 'General Intelligence', timeLimit: 15, totalMarks: 50, totalQuestions: 25 },
      { name: 'General Awareness', timeLimit: 15, totalMarks: 50, totalQuestions: 25 },
      { name: 'Quantitative Aptitude', timeLimit: 15, totalMarks: 50, totalQuestions: 25 },
      { name: 'English Language', timeLimit: 15, totalMarks: 50, totalQuestions: 25 },
    ],
    'BANK_PO': [
      { name: 'English Language', timeLimit: 20, totalMarks: 30, totalQuestions: 30 },
      { name: 'Quantitative Aptitude', timeLimit: 20, totalMarks: 35, totalQuestions: 35 },
      { name: 'Reasoning Ability', timeLimit: 20, totalMarks: 35, totalQuestions: 35 },
    ]
  };
  const [selectedSectionTabId, setSelectedSectionTabId] = useState('all');
  const [examModalActiveTab, setExamModalActiveTab] = useState('general'); // 'general', 'info', 'quizzes', 'books', 'materials'

  const [quizCategories, setQuizCategories] = useState([]);
  const [examInfoSections, setExamInfoSections] = useState([]);
  const [editingInfoSection, setEditingInfoSection] = useState({ id: '', examId: '', title: '', content: '', type: 'TEXT', sortOrder: 0 });

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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

    // Sync with DB
    const modelMap = {
      'categories': 'category',
      'exams': 'exam',
      'papers': 'paper',
      'questions': 'question'
    };
    handleReorder(modelMap[type], newList);
  };

  useEffect(() => {
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

  const [questionForm, setQuestionForm] = useState({
    id: '', paperId: '', sectionId: '', text: '', textHi: '',
    options: ["", "", "", ""], optionsHi: ["", "", "", ""],
    optionTypes: ["text", "text", "text", "text"], // Tracking text vs image for each option
    answer: 0, explanation: '', explanationHi: '', image: '', type: 'MCQ', difficulty: 'Medium'
  });

  const saveQuestion = async (e) => {
    e.preventDefault();
    try {
      // Map options to current format (preserving text vs image in the same field or separate if needed)
      // The backend expects an array of strings. We'll handle image URLs as strings.
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
          const nTypes = [...questionForm.optionTypes];
          nTypes[index] = 'image';
          setQuestionForm(prev => ({ ...prev, options: nOpt, optionTypes: nTypes }));
        }
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Upload error");
    }
  };

  const saveInfoSection = async (e) => {
    e.preventDefault();
    if (!examForm.id) return alert("Save the exam basic details first!");
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
    } catch (e) { console.error(e); }
  };

  const deleteInfoSection = async (id) => {
    if (!confirm('Delete this section?')) return;
    await fetch(`/api/admin/mock-exam-sections?id=${id}`, { method: 'DELETE' });
    refreshExamSections(examForm.id);
  };

  const handleBulkAction = async (action, ids) => {
    if (action === 'toggleStatus') {
      try {
        const proms = ids.map(id => {
          const ex = exams.find(e => e.id === id);
          return fetch('/api/admin/mock-exams-manager', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...ex, hidden: !ex.hidden })
          });
        });
        await Promise.all(proms);
        fetchData();
      } catch (err) { console.error(err); }
    }
  };

  // Bulk Upload logic
  const [bulkFile, setBulkFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile || !selectedPaperId) return alert("Select file and paper first");

    setIsUploading(true);
    try {
      const XLSX = await import("xlsx");
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const bData = XLSX.utils.sheet_to_json(ws);

        if (bData.length === 0) { setIsUploading(false); return alert("File is empty"); }

        // Transform Excel headers to internal format for sandbox
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

  const saveWizard = async () => {
    // 1. Save Paper
    try {
      const pRes = await fetch('/api/admin/mock-papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...paperForm, isLive: false }) // Create as draft initially
      });
      const paper = await pRes.json();
      if (!pRes.ok) throw new Error(paper.error || "Failed to create paper");

      // 2. Save Sections
      const sProms = wizardSections
        .filter(s => s.name.trim() !== '')
        .map((s, idx) => fetch('/api/admin/mock-sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paperId: paper.id,
            name: s.name,
            order: idx,
            timeLimit: Number(s.timeLimit) || 0,
            totalMarks: Number(s.totalMarks) || 0,
            totalQuestions: Number(s.totalQuestions) || 0
          })
        }));

      await Promise.all(sProms);

      alert("Test Created Successfully! Now add questions.");
      setSelectedPaperId(paper.id);
      setIsPaperModalOpen(false);
      setWizardStep(3); // Move to question entry tab logic
      setActiveTab('questions');
      fetchPapers();
    } catch (err) {
      alert(err.message);
    }
  };

  const downloadSampleTemplate = async () => {
    try {
      const XLSX = await import("xlsx");
      const headers = [
        "Section Name", "Question (EN)",
        "Option 1 (EN)", "Option 2 (EN)", "Option 3 (EN)", "Option 4 (EN)", "Explanation (EN)",
        "Question (HI)",
        "Option 1 (HI)", "Option 2 (HI)", "Option 3 (HI)", "Option 4 (HI)", "Explanation (HI)",
        "Correct Answer (1-4)", "Image URL"
      ];
      const dummyData = [
        {
          "Section Name": "General Intelligence",
          "Question (EN)": "Sample Question?",
          "Option 1 (EN)": "A", "Option 2 (EN)": "B", "Option 3 (EN)": "C", "Option 4 (EN)": "D",
          "Explanation (EN)": "Sample explanation",
          "Question (HI)": "नमूना प्रश्न?",
          "Option 1 (HI)": "अ", "Option 2 (HI)": "ब", "Option 3 (HI)": "स", "Option 4 (HI)": "द",
          "Explanation (HI)": "विवरण",
          "Correct Answer (1-4)": 1,
          "Image URL": ""
        }
      ];
      const ws = XLSX.utils.json_to_sheet(dummyData, { header: headers });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Questions");
      XLSX.writeFile(wb, "Mock_Test_Template.xlsx");
    } catch (err) { console.error(err); }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Mock Tests Engine</h1>
          <p className={styles.subtitle}>Manage test categories, exam configurations, and SEO sections.</p>
        </div>
      </header>

      <div className={styles.tabsHeader}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'categories' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Main Categories & Exams
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'papers' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('papers')}
        >
          Mock Tests (Papers)
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'questions' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          Question Bank
        </button>
      </div>

      {loading ? (
        <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">
          Initializing Engine...
        </div>
      ) : activeTab === 'categories' ? (
        <div className="space-y-12">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Exam Hierarchy</h2>
              <p className="text-slate-400 text-sm font-medium">Manage main categories and their linked sub-categories.</p>
            </div>
            <div className="flex gap-2">
              <button
                className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition"
                onClick={() => {
                  setCategoryForm({ id: '', name: '', slug: '', icon: '📚', sortOrder: 0 });
                  setIsCategoryModalOpen(true);
                }}
              >
                New Category
              </button>
              <button
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition"
                onClick={() => {
                  setExamForm({ id: '', name: '', slug: '', emoji: '📝', description: '', categoryId: '', sortOrder: 0, hidden: false, quizCategoryIds: [], booksJson: '[]', studyMaterialJson: '[]' });
                  setIsExamModalOpen(true);
                }}
              >
                + Add Sub Category
              </button>
            </div>
          </div>

          <CategoryTreeTable
            categories={categories}
            exams={exams}
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
        <div>
            <HorizontalFilterBar 
               categories={categories}
               exams={exams}
               selectedCategoryId={selectedFilterCategoryId}
               selectedExamId={selectedExamId}
               onCategoryChange={(catId) => {
                 setSelectedFilterCategoryId(catId);
                 setSelectedExamId('');
               }}
               onExamChange={(exId) => setSelectedExamId(exId)}
               activeCount={papers.filter(p => p.isLive).length}
            />

            <div className="flex justify-between items-center mb-6 px-2">
               <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Paper Inventory</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Manage high-fidelity mock test papers</p>
               </div>
               <button 
                  disabled={!selectedExamId}
                  className={styles.addBtn}
                  style={{ opacity: selectedExamId ? 1 : 0.5, padding: '0.75rem 2rem' }}
                  onClick={() => {
                    setPaperForm({ id: '', examId: selectedExamId, title: '', slug: '', timeLimit: 60, totalMarks: 100, negativeMarking: 0.25, positiveMarking: 1.0, instructionType: 'TCS', instructions: '', isLive: false, showSolutions: false });
                    setWizardStep(1);
                    setIsWizardOpen(true);
                  }}
               >
                  + Create Mock Test
               </button>
            </div>

            <div className={`${styles.tableContainer} ${styles.compactTable}`}>
               <table className={styles.table}>
                  <thead>
                     <tr>
                        <th className="w-10"></th>
                        <th className="w-[45%] text-left p-4">Paper Inventory Detail</th>
                        <th className="w-[15%]">Configuration</th>
                        <th className="w-[15%] text-center">Stats</th>
                        <th className="w-[10%]">Status</th>
                        <th className="w-[15%]">Actions</th>
                     </tr>
                  </thead>
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => onDragEnd(e, 'papers')}
                  >
                    <SortableContext 
                      items={papers.map(p => p.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <tbody>
                         {papers.map(p => (
                            <DraggableRow key={p.id} id={p.id} className="hover:bg-slate-50/50">
                               <td>
                                 <div className="flex flex-col">
                                   <div className={`${styles.truncated} font-black text-slate-700`} title={p.title}>
                                     {p.title}
                                   </div>
                                   <div className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter">
                                     /{p.slug}
                                   </div>
                                 </div>
                               </td>
                               <td>
                                 <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                   <Clock size={12} className="text-slate-300" /> {p.timeLimit}m 
                                   <span className="text-slate-200">|</span>
                                   <Target size={12} className="text-slate-300" /> {p.totalMarks} Marks
                                 </div>
                               </td>
                               <td className="text-center">
                                 <div className="inline-flex flex-col items-center">
                                   <span className="text-xs font-black text-indigo-600">{p._count?.questions || 0}Q</span>
                                   <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{p._count?.sections || 0} Sec</span>
                                 </div>
                               </td>
                               <td>
                                 <div className="flex items-center gap-2">
                                   <div className={`w-2 h-2 rounded-full ${p.isLive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-300'}`} />
                                   <span className={`text-[10px] font-black uppercase tracking-widest ${p.isLive ? 'text-emerald-600' : 'text-slate-400'}`}>
                                     {p.isLive ? "Live" : "Draft"}
                                   </span>
                                 </div>
                               </td>
                               <td>
                                 <div className="flex gap-2 items-center">
                                    <button 
                                      className={styles.actionIcon} 
                                      title="Manage Questions"
                                      onClick={() => { 
                                        setSelectedPaperId(p.id); 
                                        setActiveTab('questions'); 
                                      }}
                                    >
                                      <Rocket size={16} />
                                    </button>
                                    <button 
                                      className={styles.actionIcon} 
                                      title="Configure Settings"
                                      onClick={() => {
                                        setPaperForm(p);
                                        setIsPaperModalOpen(true);
                                      }}
                                    >
                                      <Settings size={16} />
                                    </button>
                                    <button 
                                      className={styles.actionIcon} 
                                      title="Clone Exam"
                                      onClick={() => clonePaper(p.id)}
                                    >
                                      <Copy size={16} />
                                    </button>
                                    <button 
                                      className={`${styles.actionIcon} ${styles.delete}`} 
                                      title="Danger: Delete"
                                      onClick={() => deletePaper(p.id)}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                 </div>
                               </td>
                            </DraggableRow>
                         ))}
                         {papers.length === 0 && <tr><td colSpan="6" className="text-center p-12 text-slate-300 font-bold italic uppercase text-xs tracking-widest">Select a sub-category to view paper inventory</td></tr>}
                      </tbody>
                    </SortableContext>
                  </DndContext>
               </table>
            </div>
        </div>
      ) : (
        <div>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className={styles.formGroup} style={{ marginBottom: 0 }}>
              <label className="text-sm font-bold block mb-1">Select Mock Test (Paper)</label>
              <select
                value={selectedPaperId}
                onChange={e => setSelectedPaperId(e.target.value)}
                className={styles.input}
              >
                <option value="">-- Choose Paper --</option>
                {papers.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2 col-span-1 lg:col-span-2 justify-end">
              <button
                disabled={!selectedPaperId}
                className={styles.addBtn}
                onClick={() => {
                  setQuestionForm({ id: '', paperId: selectedPaperId, sectionId: '', text: '', textHi: '', options: ["", "", "", ""], optionsHi: ["", "", "", ""], optionTypes: ["text", "text", "text", "text"], answer: 0, explanation: '', explanationHi: '', image: '', type: 'MCQ', difficulty: 'Medium' });
                  setIsQuestionModalOpen(true);
                }}
              >
                + Manual Add
              </button>
              <button
                disabled={!selectedPaperId}
                className={styles.addBtn}
                style={{ background: '#4f46e5' }}
                onClick={() => setIsBulkModalOpen(true)}
              >
                Bulk Upload (Excel)
              </button>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <QuestionBankManager
              questions={questions}
              sections={sections.filter(s => s.paperId === selectedPaperId)}
              onReorder={(newList) => {
                setQuestions(newList);
                handleReorder('question', newList);
              }}
              onEdit={(q) => {
                let opt = ["", "", "", ""];
                try { opt = JSON.parse(q.options || "[]"); } catch (e) { }
                let optHi = ["", "", "", ""];
                try { optHi = JSON.parse(q.optionsHi || "[]"); } catch (e) { }
                setQuestionForm({
                  ...q,
                  options: opt,
                  optionsHi: optHi,
                  optionTypes: opt.map(v => v?.startsWith('http') ? 'image' : 'text')
                });
                setIsQuestionModalOpen(true);
              }}
              onDelete={deleteQuestion}
              onBulkDelete={async (ids) => {
                if (!confirm(`Delete ${ids.length} questions?`)) return;
                await Promise.all(ids.map(id => fetch(`/api/admin/mock-questions?id=${id}`, { method: 'DELETE' })));
                fetchQuestions();
              }}
              onBulkMove={async (ids) => {
                const newSecId = prompt("Enter Target Section ID (or name if you prefer implementing search later):");
                if (!newSecId) return;
                // Simplified move logic for now
                await Promise.all(ids.map(id => fetch('/api/admin/mock-questions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id, sectionId: newSecId })
                })));
                fetchQuestions();
              }}
              selectedPaperTitle={papers.find(p => p.id === selectedPaperId)?.title}
            />
          </div>
        </div>
      )}

      {/* PROFESSIONAL PAPER SETTINGS DRAWER */}
      <PaperDrawer 
        isOpen={isPaperModalOpen}
        onClose={() => setIsPaperModalOpen(false)}
        form={paperForm}
        setForm={setPaperForm}
        onSave={savePaper}
        isLoading={loading}
      />

      {/* NEW RESTACKED DRAWERS */}
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
        categories={categories}
        quizCategories={quizCategories}
        examInfoSections={examInfoSections}
        onSave={saveExam}
        onSaveInfoSection={saveInfoSection}
        onDeleteInfoSection={deleteInfoSection}
        editingInfoSection={editingInfoSection}
        setEditingInfoSection={setEditingInfoSection}
      />

      {/* FULL SCREEN WIZARD FOR MOCK TEST CREATION */}
      {isWizardOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>✨ Guided Design: New Mock Test</h2>
              <button className={styles.modalClose} onClick={() => setIsWizardOpen(false)}><X /></button>
            </div>

            <div className={styles.modalForm} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 70px)' }}>
              <div className="flex justify-center py-6 bg-slate-50/50 border-b">
                <div className={styles.wizardSteps} style={{ margin: 0 }}>
                  {[1, 2, 3].map((step) => (
                    <button 
                      key={step}
                      disabled={step > wizardStep && !paperForm.title}
                      onClick={() => setWizardStep(step)}
                      className={`${styles.stepItem} ${styles.stepBubble} ${wizardStep === step ? styles.active : (wizardStep > step ? styles.completed : '')}`}
                      style={{ background: 'none', border: 'none', padding: 0 }}
                    >
                      <div className={styles.stepBadge}>{wizardStep > step ? <Check size={16} /> : step}</div>
                      <span className={styles.stepLabel}>{step === 1 ? 'Basic Details' : step === 2 ? 'Sections Configuration' : 'Confirm'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                {wizardStep === 1 && (
                  <div className="max-w-6xl mx-auto flex gap-8">
                    {/* Left: Form Fields (Strict 12-col Grid) */}
                    <div className="flex-[2] space-y-6">
                      <div className={styles.standardGrid}>
                        <div className="col-span-8">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">1. Exam Title</label>
                          <input 
                            type="text" 
                            value={paperForm.title} 
                            onChange={e => {
                              const val = e.target.value;
                              const updates = { title: val };
                              if (!isSlugEdited) {
                                updates.slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                              }
                              setPaperForm(prev => ({ ...prev, ...updates }));
                            }} 
                            className={styles.input} 
                            placeholder="e.g. SSC CGL 2025 - Tier I Full Mock #01" 
                          />
                        </div>
                        <div className="col-span-4 relative">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            2. Slug
                            <button 
                              className={styles.pencilBtn} 
                              onClick={() => setIsSlugEdited(!isSlugEdited)}
                              title="Toggle Manual Edit"
                            >
                              {isSlugEdited ? <Check size={14} className="text-emerald-500" /> : <Edit size={14} />}
                            </button>
                          </label>
                          <input 
                            type="text" 
                            disabled={!isSlugEdited}
                            value={paperForm.slug} 
                            onChange={e => setPaperForm(prev => ({ ...prev, slug: e.target.value }))} 
                            className={`${styles.input} ${!isSlugEdited ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`} 
                            placeholder="ssc-cgl-mock-1" 
                          />
                        </div>

                        <div className="col-span-6">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">3. Paper Classification</label>
                          <select
                            value={paperForm.paperType}
                            onChange={e => setPaperForm(prev => ({ ...prev, paperType: e.target.value }))}
                            className={styles.input}
                          >
                            <option value="MOCK">Official Mock Simulation</option>
                            <option value="PYP">Authentic Previous Year Paper</option>
                          </select>
                        </div>
                        <div className="col-span-6">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">4. Edition Year</label>
                          <input type="number" value={paperForm.year} onChange={e => setPaperForm(prev => ({ ...prev, year: parseInt(e.target.value) }))} className={styles.input} />
                        </div>

                        <div className="col-span-4">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">5. Time (Min)</label>
                          <input type="number" value={paperForm.timeLimit} onChange={e => setPaperForm(prev => ({ ...prev, timeLimit: e.target.value }))} className={styles.input} />
                        </div>
                        <div className="col-span-4">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">6. Max Marks</label>
                          <input type="number" value={paperForm.totalMarks} onChange={e => setPaperForm(prev => ({ ...prev, totalMarks: e.target.value }))} className={styles.input} />
                        </div>
                        <div className="col-span-4">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">7. Correct (+)</label>
                          <input type="number" step="0.1" value={paperForm.positiveMarking} onChange={e => setPaperForm(prev => ({ ...prev, positiveMarking: e.target.value }))} className={styles.input} />
                        </div>

                        <div className="col-span-12">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">8. Detailed Instructions</label>
                          <textarea 
                            value={paperForm.instructions} 
                            onChange={e => setPaperForm(prev => ({ ...prev, instructions: e.target.value }))} 
                            className={styles.textarea} 
                            rows="6" 
                            placeholder="Standard TCS/SSC exam instructions set..." 
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-6">
                        <button 
                          onClick={() => setWizardStep(2)} 
                          className={styles.addBtn}
                          style={{ background: 'var(--brand-primary, #6366f1)', padding: '0.8rem 2.5rem' }}
                        >
                          Define Sections & Metrics <ArrowRight size={18} className="ml-2" />
                        </button>
                      </div>
                    </div>

                    {/* Right: Real-time Context Sidebar */}
                    <div className="flex-1">
                      <div className={styles.summaryCard}>
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-4 flex items-center gap-2">
                           <Sparkles size={12} /> Live Test Intelligence
                        </div>
                        <h4 className="text-lg font-black leading-tight mb-6">{paperForm.title || "Untitled Paper"}</h4>
                        
                        <div className="space-y-4">
                          <div className="flex justify-between items-center border-b border-white/10 pb-3">
                            <span className="text-xs font-bold text-slate-400">Target Year</span>
                            <span className="text-sm font-black">{paperForm.year}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-white/10 pb-3">
                            <span className="text-xs font-bold text-slate-400">Allocation</span>
                            <span className="text-sm font-black text-emerald-400">{paperForm.timeLimit} Minutes</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-white/10 pb-3">
                            <span className="text-xs font-bold text-slate-400">Score Cap</span>
                            <span className="text-sm font-black text-amber-400">{paperForm.totalMarks} Marks</span>
                          </div>
                        </div>

                        <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/5 text-[10px] text-slate-400 leading-relaxed italic">
                          "Administrators use this summary to verify SEO slugs and mathematical parity before distributing live exams."
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {wizardStep === 2 && (
                <div className="max-w-5xl mx-auto py-4">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight">Section Configuration</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Configure subjects, timing, and marking metrics.</p>
                    </div>
                    
                    <div className="flex gap-3">
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 flex items-center">Load Template:</div>
                       {Object.keys(EXAM_TEMPLATES).map(key => (
                         <button 
                           key={key}
                           onClick={() => setWizardSections(EXAM_TEMPLATES[key])}
                           className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
                         >
                           {key.replace('_', ' ')}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-12 gap-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <div className="col-span-1 text-center">Pos</div>
                      <div className="col-span-4">Subject Name</div>
                      <div className="col-span-2">Time (Min)</div>
                      <div className="col-span-2">Max Marks</div>
                      <div className="col-span-2">Ques Limit</div>
                      <div className="col-span-1 text-center font-serif italic text-[12px]">X</div>
                    </div>

                    <DndContext 
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(e) => {
                        const { active, over } = e;
                        if (!over || active.id === over.id) return;
                        const oldIdx = wizardSections.findIndex((_, idx) => `wiz-sec-${idx}` === active.id);
                        const newIdx = wizardSections.findIndex((_, idx) => `wiz-sec-${idx}` === over.id);
                        setWizardSections(arrayMove(wizardSections, oldIdx, newIdx));
                      }}
                    >
                      <SortableContext 
                        items={wizardSections.map((_, idx) => `wiz-sec-${idx}`)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                           {wizardSections.map((sec, idx) => (
                             <WizardSectionRow 
                               key={`wiz-sec-${idx}`}
                               id={`wiz-sec-${idx}`}
                               index={idx}
                               section={sec}
                               onChange={(i, field, val) => {
                                 const n = [...wizardSections];
                                 n[i][field] = val;
                                 setWizardSections(n);
                               }}
                               onRemove={(i) => setWizardSections(prev => prev.filter((_, idx) => idx !== i))}
                             />
                           ))}
                        </div>
                      </SortableContext>
                    </DndContext>

                    <button
                      onClick={() => setWizardSections(prev => [...prev, { name: '', timeLimit: 0, totalMarks: 0, totalQuestions: 0 }])}
                      className="w-full py-3 border-2 border-dashed border-slate-100 rounded-xl text-slate-300 font-bold hover:bg-slate-50 transition text-sm"
                    >+ Append New Subject Row</button>

                    {/* Inline Totals & Math Validation */}
                    <div className={styles.runningTotal}>
                       <div className="col-span-5 text-right pr-4 uppercase tracking-widest text-[10px]">Running Metrics Total:</div>
                       <div className={`col-span-2 flex items-center gap-2 ${parseInt(wizardSections.reduce((acc, s) => acc + (s.timeLimit || 0), 0)) === parseInt(paperForm.timeLimit) ? styles.mathValid : styles.mathInvalid}`}>
                         {wizardSections.reduce((acc, s) => acc + (s.timeLimit || 0), 0)}m 
                         <span className="text-slate-200">/</span> {paperForm.timeLimit}m
                       </div>
                       <div className={`col-span-2 flex items-center gap-2 ${parseInt(wizardSections.reduce((acc, s) => acc + (s.totalMarks || 0), 0)) === parseInt(paperForm.totalMarks) ? styles.mathValid : styles.mathInvalid}`}>
                         {wizardSections.reduce((acc, s) => acc + (s.totalMarks || 0), 0)} Marks 
                         <span className="text-slate-200">/</span> {paperForm.totalMarks}
                       </div>
                       <div className="col-span-2 text-indigo-500">
                         {wizardSections.reduce((acc, s) => acc + (s.totalQuestions || 0), 0)} Questions
                       </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-10 border-t mt-12 bg-white sticky bottom-0 pb-4">
                    <button 
                      onClick={() => setWizardStep(1)} 
                      className="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition"
                    >
                      Back to Basic Details
                    </button>
                    
                    <button 
                      onClick={saveWizard} 
                      className={styles.addBtn}
                      style={{ background: 'var(--brand-primary, #6366f1)', padding: '0.8rem 3rem' }}
                    >
                      🚀 Finalize & Create Exam
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="max-w-2xl mx-auto py-20 text-center">
                   <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                     <Check size={48} strokeWidth={3} />
                   </div>
                   <h3 className="text-3xl font-black text-slate-800 mb-4">Exam Infrastructure Ready!</h3>
                   <p className="text-slate-500 mb-12 leading-relaxed">
                     The mock test framework and sections have been established. Your next workflow step is to populate the question bank.
                   </p>
                   
                   <div className="flex flex-col gap-4 max-w-sm mx-auto">
                     <button 
                       onClick={() => {
                         setIsWizardOpen(false);
                         setActiveTab('questions');
                       }}
                       className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                     >
                       <Rocket size={20} /> Launch Question Manager
                     </button>
                     <button 
                       onClick={() => setIsWizardOpen(false)}
                       className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition"
                     >
                       Return to Dashboard
                     </button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

      <QuestionDrawer
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        questionForm={questionForm}
        setQuestionForm={setQuestionForm}
        sections={sections.filter(s => s.paperId === selectedPaperId)}
        onSave={saveQuestion}
        onImageUpload={handleImageUpload}
      />

      <BulkValidationSandbox
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        data={sandboxData}
        sections={sections.filter(s => s.paperId === selectedPaperId)}
        onConfirm={async (finalData) => {
          setIsSandboxOpen(false);
          setLoading(true);
          try {
            const res = await fetch('/api/admin/mock-questions/bulk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paperId: selectedPaperId, rows: finalData })
            });
            if (res.ok) {
              alert("Bulk upload successful!");
              fetchQuestions();
            } else {
              const err = await res.json();
              alert(err.error || "Bulk upload failed");
            }
          } catch (err) { console.error(err); }
          finally { setLoading(false); }
        }}
      />

      {isBulkModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>📦 High-Volume Bulk Selection</h2>
              <button className={styles.modalClose} onClick={() => setIsBulkModalOpen(false)}><X /></button>
            </div>
            <div className={styles.modalForm}>
              <div className="max-w-4xl mx-auto py-20 text-center">
                <div className="mb-12">
                  <h3 className="text-3xl font-black text-slate-800 mb-4">Ingest Bilingual Questions</h3>
                  <p className="text-slate-500 max-w-2xl mx-auto px-4">Upload your formatted Excel file. You will be able to review and fix errors in the next step.</p>
                </div>

                <div className="relative border-4 border-dashed border-slate-100 p-20 rounded-[3rem] bg-slate-50/50 hover:bg-slate-50 transition-all group mx-4">
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <Upload className="text-indigo-600 mb-4 group-hover:scale-110 transition" size={64} />
                    <p className="font-bold text-slate-800 text-xl">{bulkFile ? bulkFile.name : "Drag & Drop Excel File here"}</p>
                    <p className="text-slate-400 mt-2">Only .xlsx or .xls support</p>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={e => setBulkFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>

                <div className="mt-16 flex gap-6 justify-center">
                  <button type="button" onClick={() => setIsBulkModalOpen(false)} className={styles.cancelButton} disabled={isUploading}>Cancel</button>
                  <button type="button" onClick={handleBulkUpload} className={styles.submitButton} disabled={isUploading} style={{ minWidth: '300px' }}>
                    {isUploading ? "🔥 Engines Cooking..." : "🚀 Next: Pre-flight Review"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
