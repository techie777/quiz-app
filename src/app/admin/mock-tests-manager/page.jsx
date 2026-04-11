"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, ArrowRight, Rocket, X, Download, Upload, Trash2, Edit, Copy, Settings, Check, ChevronRight, GripVertical, Image as ImageIcon } from "lucide-react";
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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from '@/styles/GovtExamManagement.module.css';

// --- Reusable Draggable Row Component ---
function DraggableRow({ id, children, className }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    position: isDragging ? 'relative' : 'initial',
    background: isDragging ? '#f8fafc' : 'transparent',
    boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
  };

  return (
    <tr ref={setNodeRef} style={style} className={className}>
      <td className="w-10">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing p-2 text-slate-300 hover:text-indigo-400 transition-colors"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </button>
      </td>
      {children}
    </tr>
  );
}

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
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  
  const [examForm, setExamForm] = useState({ id: '', name: '', slug: '', emoji: '📝', description: '', categoryId: '', sortOrder: 0, hidden: false, quizCategoryIds: [], booksJson: '[]', studyMaterialJson: '[]' });
  const [categoryForm, setCategoryForm] = useState({ id: '', name: '', slug: '', icon: '📚', sortOrder: 0 });
  const [paperForm, setPaperForm] = useState({ id: '', examId: '', title: '', slug: '', timeLimit: 60, totalMarks: 100, negativeMarking: 0.25, positiveMarking: 1.0, instructionType: 'TCS', instructions: '', isLive: false, showSolutions: false, paperType: 'MOCK', year: 2025 });
  
  // Selection states for filtering
  const [selectedFilterCategoryId, setSelectedFilterCategoryId] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedPaperId, setSelectedPaperId] = useState('');
  const [sections, setSections] = useState([]);
  const [questions, setQuestions] = useState([]);
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

  // Wizard States
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardSections, setWizardSections] = useState([
    { name: 'General Intelligence', timeLimit: 0, totalMarks: 0, totalQuestions: 0 },
    { name: 'General Awareness', timeLimit: 0, totalMarks: 0, totalQuestions: 0 },
    { name: 'Quantitative Aptitude', timeLimit: 0, totalMarks: 0, totalQuestions: 0 },
    { name: 'English Comprehension', timeLimit: 0, totalMarks: 0, totalQuestions: 0 }
  ]);

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

  const fetchExamInfoSections = async (examId) => {
    if (!examId) { setExamInfoSections([]); return; }
    try {
      const res = await fetch(`/api/admin/mock-exam-sections?examId=${examId}`);
      if (res.ok) setExamInfoSections(await res.json());
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if (activeTab === 'questions') {
      fetchSections();
      fetchQuestions();
    }
  }, [selectedPaperId, activeTab]);

  useEffect(() => {
    if (isExamModalOpen && examForm.id) {
        fetchExamInfoSections(examForm.id);
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
        fetchExamInfoSections(examForm.id);
      }
    } catch (e) { console.error(e); }
  };

  const deleteInfoSection = async (id) => {
    if (!confirm('Delete this section?')) return;
    await fetch(`/api/admin/mock-exam-sections?id=${id}`, { method: 'DELETE' });
    fetchExamInfoSections(examForm.id);
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
        const data = XLSX.utils.sheet_to_json(ws);
        
        if (data.length === 0) { setIsUploading(false); return alert("File is empty"); }

        const res = await fetch('/api/admin/mock-questions/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paperId: selectedPaperId, rows: data })
        });
        
        if (res.ok) {
          alert("Bulk upload successful!");
          setIsBulkModalOpen(false);
          fetchQuestions();
          fetchSections();
        } else {
          const err = await res.json();
          alert(err.error || "Bulk upload failed");
        }
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
        <div className="p-10 text-center text-slate-500 font-bold">Loading Engine Data...</div>
      ) : activeTab === 'categories' ? (
        <div className="space-y-12">
           {/* MAIN CATEGORIES SECTION */}
           <section>
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold text-slate-800">1. Main Categories</h2>
                 <button 
                    className={styles.addBtn}
                    onClick={() => {
                      setCategoryForm({ id: '', name: '', slug: '', icon: '📚', sortOrder: 0 });
                      setIsCategoryModalOpen(true);
                    }}
                 >
                    + Add Category
                 </button>
              </div>
              
              <div className={styles.tableContainer}>
                 <table className={styles.table}>
                    <thead>
                       <tr>
                          <th className="w-10"></th>
                          <th>Icon</th>
                          <th>Category Name</th>
                          <th>Slug</th>
                          <th>Actions</th>
                       </tr>
                    </thead>
                    <DndContext 
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(e) => onDragEnd(e, 'categories')}
                    >
                      <SortableContext 
                        items={categories.map(c => c.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <tbody>
                           {categories.map(cat => (
                              <DraggableRow key={cat.id} id={cat.id}>
                                 <td className="text-2xl">{cat.icon}</td>
                                 <td><strong>{cat.name}</strong></td>
                                 <td>{cat.slug}</td>
                                 <td>
                                    <div className="flex gap-2">
                                      <button 
                                         className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded transition"
                                         onClick={() => {
                                            setCategoryForm(cat);
                                            setIsCategoryModalOpen(true);
                                         }}
                                      >
                                        Edit
                                      </button>
                                      <button className="text-red-600 hover:bg-red-50 px-3 py-1 rounded transition" onClick={() => deleteCategory(cat.id)}>
                                        Delete
                                      </button>
                                    </div>
                                 </td>
                              </DraggableRow>
                           ))}
                        </tbody>
                      </SortableContext>
                    </DndContext>
                 </table>
              </div>
           </section>

            {/* SUB-CATEGORIES SECTION */}
            <section>
               <div className="flex justify-between items-center mb-4 border-t pt-8">
                  <h2 className="text-xl font-bold text-slate-800">2. Sub categories</h2>
                  <button 
                     className={styles.addBtn}
                     onClick={() => {
                       setExamForm({ id: '', name: '', slug: '', emoji: '📝', description: '', categoryId: '', sortOrder: 0, hidden: false, quizCategoryIds: [], booksJson: '[]', studyMaterialJson: '[]' });
                       setIsExamModalOpen(true);
                     }}
                  >
                     + Add New Sub Category
                  </button>
               </div>
              
              <div className={styles.tableContainer}>
                 <table className={styles.table}>
                     <thead>
                        <tr>
                           <th className="w-10"></th>
                           <th>Main Category</th>
                           <th>Sub category</th>
                           <th className="text-center">Total mock test</th>
                           <th className="text-center">Total PYPs</th>
                           <th>Status</th>
                           <th>Actions</th>
                        </tr>
                     </thead>
                     <DndContext 
                       sensors={sensors}
                       collisionDetection={closestCenter}
                       onDragEnd={(e) => onDragEnd(e, 'exams')}
                     >
                       <SortableContext 
                         items={exams.map(e => e.id)}
                         strategy={verticalListSortingStrategy}
                       >
                         <tbody>
                            {exams.map(ex => (
                               <DraggableRow key={ex.id} id={ex.id}>
                                  <td className="font-bold text-slate-500">{ex.category?.name || 'Uncategorized'}</td>
                                  <td>
                                    <div className="flex items-center gap-3">
                                      <span className="text-xl">{ex.emoji}</span>
                                      <div>
                                        <div className="font-black text-slate-900">{ex.name}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">/{ex.slug}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="text-center font-bold text-indigo-600">{ex.mockCount || 0}</td>
                                  <td className="text-center font-bold text-emerald-600">{ex.pypCount || 0}</td>
                                  <td>
                                     <span className={ex.hidden ? "text-amber-600 bg-amber-50 p-1 px-2 rounded font-bold text-[10px] uppercase tracking-wider" : "text-emerald-500 bg-emerald-50 p-1 px-2 rounded font-bold text-[10px] uppercase tracking-wider"}>
                                        {ex.hidden ? "Draft" : "Active"}
                                     </span>
                                  </td>
                                  <td>
                                     <div className="flex gap-2">
                                       <button 
                                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                          onClick={() => {
                                             setExamForm({ ...ex, categoryId: ex.categoryId || '', quizCategoryIds: ex.quizCategoryIds || [], booksJson: ex.booksJson || '[]', studyMaterialJson: ex.studyMaterialJson || '[]' });
                                             setIsExamModalOpen(true);
                                          }}
                                          title="Edit Sub Category"
                                       >
                                         <Edit size={16}/>
                                       </button>
                                       <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" onClick={() => deleteExam(ex.id)} title="Delete Sub Category">
                                         <Trash2 size={16}/>
                                       </button>
                                     </div>
                                  </td>
                               </DraggableRow>
                            ))}
                         </tbody>
                      </SortableContext>
                    </DndContext>
                 </table>
              </div>
           </section>
        </div>
      ) : activeTab === 'papers' ? (
        <div>
           <div className="mb-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-slate-50 p-6 rounded-2xl border-2 border-slate-100">
              <div className="col-span-12 md:col-span-4">
                 <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                    <label className="text-sm font-bold block mb-2 text-slate-600">1. Select Main Category</label>
                    <select 
                       value={selectedFilterCategoryId} 
                       onChange={e => {
                         setSelectedFilterCategoryId(e.target.value);
                         setSelectedExamId('');
                       }}
                       className={styles.input}
                    >
                       <option value="">-- All Categories --</option>
                       {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
              </div>

              <div className="col-span-12 md:col-span-4">
                 <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                    <label className="text-sm font-bold block mb-2 text-indigo-600">2. Select Sub-Category (Exam)</label>
                    <select 
                       value={selectedExamId} 
                       onChange={e => setSelectedExamId(e.target.value)}
                       className={styles.input}
                       disabled={!selectedFilterCategoryId}
                       style={{ borderColor: selectedFilterCategoryId ? '#6366f1' : '' }}
                    >
                       <option value="">-- Choose Exam --</option>
                       {exams.filter(ex => ex.categoryId === selectedFilterCategoryId).map(ex => (
                          <option key={ex.id} value={ex.id}>{ex.name}</option>
                       ))}
                    </select>
                 </div>
              </div>

              <div className="col-span-12 md:col-span-2">
                 <div className="flex flex-col items-center justify-center bg-white p-3 rounded-xl border-2 border-indigo-100 shadow-sm h-full">
                    <span className="text-3xl font-black text-indigo-600">{papers.filter(p => p.isLive).length}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-center">Active Tests</span>
                 </div>
              </div>

              <div className="col-span-12 md:col-span-2 flex justify-end h-full">
                 <button 
                    disabled={!selectedExamId}
                    className={styles.addBtn}
                    style={{ width: '100%', height: '100%', minHeight: '65px', opacity: selectedExamId ? 1 : 0.5 }}
                    onClick={() => {
                      setPaperForm({ id: '', examId: selectedExamId, title: '', slug: '', timeLimit: 60, totalMarks: 100, negativeMarking: 0.25, positiveMarking: 1.0, instructionType: 'TCS', instructions: '', isLive: false, showSolutions: false });
                      setWizardStep(1);
                      setIsWizardOpen(true);
                    }}
                 >
                    + Create Mock Test
                 </button>
              </div>
           </div>

           <div className={styles.tableContainer}>
              <table className={styles.table}>
                 <thead>
                    <tr>
                       <th className="w-10"></th>
                       <th>Paper Title</th>
                       <th>Timing & Marks</th>
                       <th>Questions/Sections</th>
                       <th>Mode</th>
                       <th>Actions</th>
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
                           <DraggableRow key={p.id} id={p.id}>
                              <td><strong>{p.title}</strong><br/><small className="text-slate-400">/{p.slug}</small></td>
                              <td>{p.timeLimit}m | {p.totalMarks} Marks</td>
                              <td>{p._count?.questions || 0} Questions<br/><small>{p._count?.sections || 0} Sections</small></td>
                              <td>
                                 <span className={p.isLive ? "text-emerald-500 font-bold" : "text-slate-400"}>
                                    {p.isLive ? "🔴 Live" : "Draft"}
                                 </span>
                              </td>
                              <td>
                                 <div className="flex gap-4 items-center">
                                    <button className="text-blue-600 font-bold hover:text-blue-800 transition" onClick={() => { 
                                      setSelectedPaperId(p.id); 
                                      setActiveTab('questions'); 
                                    }}>Questions</button>
                                    <button className="text-amber-600 font-bold hover:text-amber-800 transition flex items-center gap-1" onClick={() => {
                                      setPaperForm(p);
                                      setIsPaperModalOpen(true);
                                    }}>
                                      <Settings size={14}/> Settings
                                    </button>
                                    <button className="text-indigo-600 font-bold hover:text-indigo-800 transition flex items-center gap-1" onClick={() => clonePaper(p.id)}>
                                      <Copy size={14}/> Clone
                                    </button>
                                    <button className="text-red-600 hover:text-red-800 transition" onClick={() => deletePaper(p.id)}><Trash2 size={14}/></button>
                                 </div>
                              </td>
                           </DraggableRow>
                        ))}
                        {papers.length === 0 && <tr><td colSpan="6" className="text-center p-8 text-slate-400">Select a sub-category to view papers or create a new one.</td></tr>}
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

           {selectedPaperId && sections.filter(s => s.paperId === selectedPaperId).length > 0 && (
             <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                <button 
                   className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${selectedSectionTabId === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-500 border-2 border-slate-100 hover:border-indigo-200'}`}
                   onClick={() => setSelectedSectionTabId('all')}
                >
                   All Sections
                </button>
                {sections.filter(s => s.paperId === selectedPaperId).map(s => (
                   <button 
                      key={s.id}
                      className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${selectedSectionTabId === s.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-500 border-2 border-slate-100 hover:border-indigo-200'}`}
                      onClick={() => setSelectedSectionTabId(s.id)}
                   >
                      {s.name}
                   </button>
                ))}
             </div>
           )}

           <div className={styles.tableContainer}>
              <table className={styles.table}>
                 <thead>
                    <tr>
                       <th className="w-10"></th>
                       <th style={{ width: '40%' }}>Question (Bilingual)</th>
                       <th style={{ width: '15%' }}>Section</th>
                       <th style={{ width: '15%' }}>Correct Ans</th>
                       <th style={{ width: '15%' }}>Media</th>
                       <th style={{ width: '15%' }}>Actions</th>
                    </tr>
                 </thead>
                 <DndContext 
                   sensors={sensors}
                   collisionDetection={closestCenter}
                   onDragEnd={(e) => onDragEnd(e, 'questions')}
                 >
                   <SortableContext 
                     items={questions.filter(q => selectedSectionTabId === 'all' || q.sectionId === selectedSectionTabId).map(q => q.id)}
                     strategy={verticalListSortingStrategy}
                   >
                     <tbody>
                        {questions
                           .filter(q => selectedSectionTabId === 'all' || q.sectionId === selectedSectionTabId)
                           .map((q, idx) => (
                           <DraggableRow key={q.id} id={q.id} className="hover:bg-slate-50">
                              <td className="py-4">
                                 <div className="font-bold text-slate-800">Q{idx+1}. {q.text}</div>
                                 <div className="text-slate-500 text-sm mt-1">H: {q.textHi}</div>
                              </td>
                              <td><span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs font-bold">{q.section?.name || "General"}</span></td>
                              <td><span className="font-mono text-emerald-600 font-bold">Opt {q.answer + 1}</span></td>
                              <td>
                                 {q.image && <img src={q.image} alt="Q" className="w-12 h-12 object-cover rounded border" />}
                                 {!q.image && <span className="text-slate-300 text-xs italic">No Image</span>}
                              </td>
                              <td>
                                 <div className="flex gap-3">
                                    <button className="text-indigo-600 hover:scale-110 transition" onClick={() => {
                                      let opt = ["", "", "", ""];
                                      try { opt = JSON.parse(q.options || "[]"); } catch(e){}
                                      let optHi = ["", "", "", ""];
                                      try { optHi = JSON.parse(q.optionsHi || "[]"); } catch(e){}
                                      
                                      setQuestionForm({ 
                                        ...q, 
                                        options: opt, 
                                        optionsHi: optHi, 
                                        optionTypes: opt.map(v => v.startsWith('http') ? 'image' : 'text') 
                                      });
                                      setIsQuestionModalOpen(true);
                                    }}>Edit</button>
                                    <button className="text-rose-600 hover:scale-110 transition" onClick={() => deleteQuestion(q.id)}>Delete</button>
                                 </div>
                              </td>
                           </DraggableRow>
                        ))}
                        {questions.length === 0 && <tr><td colSpan="6" className="text-center p-12 text-slate-400 font-medium">✨ No questions found. Start adding manually or via bulk upload!</td></tr>}
                     </tbody>
                   </SortableContext>
                 </DndContext>
              </table>
           </div>
        </div>
      )}

       {/* Editor Drawer for Mock Tests (Papers) Settings */}
       {isPaperModalOpen && (
         <div className={styles.drawerOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setIsPaperModalOpen(false); }}>
           <div className={styles.drawer} style={{ maxWidth: '700px' }}>
              <div className={styles.drawerHeader}>
                 <h2 className={styles.drawerTitle}>Edit Mock Test Settings</h2>
                 <button type="button" className={styles.drawerClose} onClick={() => setIsPaperModalOpen(false)}><X size={20}/></button>
              </div>
              <div className={styles.drawerContent}>
                 <form onSubmit={savePaper}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className={styles.formGroup}>
                         <label>Mock Test Title</label>
                         <input type="text" value={paperForm.title} onChange={e => {
                           const val = e.target.value;
                           const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                           setPaperForm(prev => ({...prev, title: val, slug}));
                         }} required className={styles.input} />
                      </div>
                      <div className={styles.formGroup}>
                         <label>Unique Slug</label>
                         <input type="text" value={paperForm.slug} onChange={e => setPaperForm(prev => ({...prev, slug: e.target.value}))} required className={styles.input} />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className={styles.formGroup}>
                         <label>Time (Mins)</label>
                         <input type="number" value={paperForm.timeLimit} onChange={e => setPaperForm(prev => ({...prev, timeLimit: parseInt(e.target.value)}))} required className={styles.input} />
                      </div>
                      <div className={styles.formGroup}>
                         <label>Max Marks</label>
                         <input type="number" value={paperForm.totalMarks} onChange={e => setPaperForm(prev => ({...prev, totalMarks: parseInt(e.target.value)}))} required className={styles.input} />
                      </div>
                      <div className={styles.formGroup}>
                         <label>Paper Type</label>
                         <select value={paperForm.paperType} onChange={e => setPaperForm(prev => ({...prev, paperType: e.target.value}))} className={styles.input}>
                            <option value="MOCK">Mock Test</option>
                            <option value="PYP">Previous Year Paper</option>
                         </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className={styles.formGroup}>
                         <label>Correct Mark (+)</label>
                         <input type="number" step="0.01" value={paperForm.positiveMarking} onChange={e => setPaperForm(prev => ({...prev, positiveMarking: parseFloat(e.target.value)}))} required className={styles.input} />
                      </div>
                      <div className={styles.formGroup}>
                         <label>Negative Mark (-)</label>
                         <input type="number" step="0.01" value={paperForm.negativeMarking} onChange={e => setPaperForm(prev => ({...prev, negativeMarking: parseFloat(e.target.value)}))} required className={styles.input} />
                      </div>
                      <div className={styles.formGroup}>
                         <label>Year</label>
                         <input type="number" value={paperForm.year} onChange={e => setPaperForm(prev => ({...prev, year: parseInt(e.target.value)}))} required className={styles.input} />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                       <label>Exam Instructions</label>
                       <textarea value={paperForm.instructions} onChange={e => setPaperForm(prev => ({...prev, instructions: e.target.value}))} className={styles.textarea} rows="4" placeholder="Detailed instructions for student..."></textarea>
                    </div>

                    <div className="flex gap-6 mb-8 mt-2">
                       <div className="flex items-center gap-2">
                          <input type="checkbox" id="paperLive" checked={paperForm.isLive} onChange={e => setPaperForm(prev => ({...prev, isLive: e.target.checked}))} />
                          <label htmlFor="paperLive" className="font-bold cursor-pointer transition text-emerald-600">Active / Live</label>
                       </div>
                       <div className="flex items-center gap-2">
                          <input type="checkbox" id="showSol" checked={paperForm.showSolutions} onChange={e => setPaperForm(prev => ({...prev, showSolutions: e.target.checked}))} />
                          <label htmlFor="showSol" className="font-bold cursor-pointer">Show Solutions</label>
                       </div>
                    </div>

                    <div className={styles.actionButtons}>
                       <button type="button" onClick={() => setIsPaperModalOpen(false)} className={styles.cancelBtn}>Cancel</button>
                       <button type="submit" className={styles.saveBtn} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>Update Mock Test</button>
                    </div>
                 </form>
              </div>
           </div>
         </div>
       )}

      {/* Editor Drawer for Exams */}
      {isExamModalOpen && (
        <div className={styles.drawerOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setIsExamModalOpen(false); }}>
          <div className={styles.drawer} style={{ maxWidth: '600px' }}>
             <div className={styles.drawerHeader}>
                <h2 className={styles.drawerTitle}>{examForm.id ? "Edit Mock Sub-Category" : "Create Mock Sub-Category"}</h2>
                <button type="button" className={styles.drawerClose} onClick={() => setIsExamModalOpen(false)}><X size={20}/></button>
             </div>
             <div className={styles.drawerContent}>
                <form onSubmit={saveExam}>
                   <div className="flex gap-4 mb-6 border-b pb-2 overflow-x-auto">
                      <button type="button" onClick={() => setExamModalActiveTab('general')} className={`px-4 py-2 font-bold transition-all ${examModalActiveTab === 'general' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>General</button>
                      <button type="button" onClick={() => setExamModalActiveTab('info')} className={`px-4 py-2 font-bold transition-all ${examModalActiveTab === 'info' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>Info Hub</button>
                      <button type="button" onClick={() => setExamModalActiveTab('quizzes')} className={`px-4 py-2 font-bold transition-all ${examModalActiveTab === 'quizzes' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>Quizzes</button>
                      <button type="button" onClick={() => setExamModalActiveTab('books')} className={`px-4 py-2 font-bold transition-all ${examModalActiveTab === 'books' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>Books</button>
                      <button type="button" onClick={() => setExamModalActiveTab('materials')} className={`px-4 py-2 font-bold transition-all ${examModalActiveTab === 'materials' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>Materials</button>
                   </div>

                   {examModalActiveTab === 'general' && (
                    <>
                       <div className="grid grid-cols-2 gap-4 mb-4">
                         <div className={styles.formGroup}>
                            <label>Sub-Category Name</label>
                            <input type="text" value={examForm.name} onChange={e => {
                              const val = e.target.value;
                              const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                              setExamForm(prev => ({...prev, name: val, slug}));
                            }} required className={styles.input} />
                         </div>
                         <div className={styles.formGroup}>
                            <label>Slug (URL Friendly)</label>
                            <input type="text" value={examForm.slug} onChange={e => setExamForm(prev => ({...prev, slug: e.target.value}))} required className={styles.input} />
                         </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4 mb-4">
                         <div className={styles.formGroup}>
                            <label>Emoji Icon</label>
                            <input type="text" value={examForm.emoji} onChange={e => setExamForm(prev => ({...prev, emoji: e.target.value}))} required className={styles.input} />
                         </div>
                         <div className={styles.formGroup}>
                            <label>Main Category</label>
                            <select value={examForm.categoryId} onChange={e => setExamForm(prev => ({...prev, categoryId: e.target.value}))} className={styles.input}>
                               <option value="">-- No Category --</option>
                               {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                         </div>
                       </div>
                       <div className={styles.formGroup}>
                          <label>Description</label>
                          <textarea value={examForm.description} onChange={e => setExamForm(prev => ({...prev, description: e.target.value}))} className={styles.textarea} rows="3"></textarea>
                       </div>
                       <div className="grid grid-cols-2 gap-4 mb-6">
                         <div className={styles.formGroup}>
                            <label>Sort Order</label>
                            <input type="number" value={examForm.sortOrder} onChange={e => setExamForm(prev => ({...prev, sortOrder: parseInt(e.target.value)}))} className={styles.input} />
                         </div>
                         <div className="flex items-center gap-2 mt-8">
                            <input type="checkbox" id="hiddenFlag" checked={examForm.hidden} onChange={e => setExamForm(prev => ({...prev, hidden: e.target.checked}))} />
                            <label htmlFor="hiddenFlag" className="font-bold cursor-pointer">Hide from public (Draft)</label>
                         </div>
                       </div>
                    </>
                   )}

                   {examModalActiveTab === 'info' && (
                     <div className="space-y-6">
                        {!examForm.id && <div className="p-4 bg-amber-50 text-amber-700 rounded-xl font-bold text-sm">⚠️ Please save the basic exam details first before adding info tabs.</div>}
                        
                        {examForm.id && (
                          <>
                            <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 mb-8">
                               <h4 className="font-black text-slate-800 mb-4 uppercase tracking-widest text-xs">Add/Edit Data Section</h4>
                               <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                     <input 
                                       type="text" 
                                       placeholder="Section Title (e.g. Exam Pattern)" 
                                       value={editingInfoSection.title} 
                                       onChange={e => setEditingInfoSection(p => ({...p, title: e.target.value}))} 
                                       className={styles.input} 
                                       required 
                                     />
                                     <select 
                                       value={editingInfoSection.type} 
                                       onChange={e => setEditingInfoSection(p => ({...p, type: e.target.value}))} 
                                       className={styles.input}
                                     >
                                        <option value="HEADING">Title / Heading</option>
                                        <option value="PARAGRAPH">Paragraph Text</option>
                                        <option value="LIST">Bullet Point List (JSON)</option>
                                        <option value="TABLE">Data Table (HTML/JSON)</option>
                                        <option value="DATES">Important Dates Grid</option>
                                     </select>
                                  </div>
                                  <textarea 
                                    placeholder="Content (Supports HTML Tags for Tables/Lists)" 
                                    value={editingInfoSection.content} 
                                    onChange={e => setEditingInfoSection(p => ({...p, content: e.target.value}))} 
                                    className={styles.textarea} 
                                    rows="4" 
                                  />
                                  <div className="flex justify-between items-center">
                                     <input 
                                       type="number" 
                                       placeholder="Sort Order" 
                                       value={editingInfoSection.sortOrder} 
                                       onChange={e => setEditingInfoSection(p => ({...p, sortOrder: parseInt(e.target.value)}))} 
                                       className={`${styles.input} w-32`} 
                                     />
                                     <div className="flex gap-2">
                                        <button type="button" onClick={() => setEditingInfoSection({ id: '', examId: examForm.id, title: '', content: '', type: 'TEXT', sortOrder: 0 })} className="px-4 py-2 text-sm font-bold text-slate-400">Clear</button>
                                        <button type="button" onClick={saveInfoSection} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition">Save Section</button>
                                     </div>
                                  </div>
                               </div>
                            </div>

                            <div className="space-y-3">
                               <label className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Existing Sections ({examInfoSections.length})</label>
                               {examInfoSections.map(sec => (
                                 <div key={sec.id} className="flex items-center justify-between p-4 bg-white border-2 border-slate-50 rounded-2xl hover:border-indigo-100 transition group">
                                    <div className="flex items-center gap-4">
                                       <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500">{sec.sortOrder}</div>
                                       <div>
                                          <div className="font-bold text-slate-800">{sec.title}</div>
                                          <div className="text-[10px] text-slate-400 uppercase font-black">{sec.type}</div>
                                       </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                       <button type="button" onClick={() => setEditingInfoSection(sec)} className="text-indigo-600 font-bold text-xs hover:bg-indigo-50 p-2 rounded-lg">Edit</button>
                                       <button type="button" onClick={() => deleteInfoSection(sec.id)} className="text-rose-500 font-bold text-xs hover:bg-rose-50 p-2 rounded-lg">Delete</button>
                                    </div>
                                 </div>
                               ))}
                               {examInfoSections.length === 0 && <div className="text-center py-10 text-slate-300 font-bold uppercase tracking-widest text-xs">No info sections created yet</div>}
                            </div>
                          </>
                        )}
                     </div>
                   )}

                   {examModalActiveTab === 'quizzes' && (
                     <div className="space-y-4">
                        <label className="font-bold text-slate-700 block mb-2">Tag Existing Quiz Categories</label>
                        <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto p-2 border rounded-xl bg-slate-50">
                            {Array.isArray(quizCategories) && quizCategories.map(qc => (
                              <label key={qc.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:border-indigo-300 cursor-pointer transition">
                                <input 
                                  type="checkbox" 
                                  checked={examForm.quizCategoryIds?.includes(qc.id)} 
                                  onChange={e => {
                                    const checked = e.target.checked;
                                    setExamForm(prev => ({
                                      ...prev, 
                                      quizCategoryIds: checked 
                                        ? [...(prev.quizCategoryIds || []), qc.id]
                                        : (prev.quizCategoryIds || []).filter(id => id !== qc.id)
                                    }));
                                  }}
                                  className="w-4 h-4 accent-indigo-600"
                                />
                                <div>
                                  <div className="font-bold text-sm">{qc.icon} {qc.name}</div>
                                  <div className="text-[10px] text-slate-400 uppercase tracking-tighter">{qc.slug}</div>
                                </div>
                              </label>
                            ))}
                        </div>
                     </div>
                   )}

                   {examModalActiveTab === 'books' && (
                     <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <label className="font-bold text-slate-700">Expert Suggested Books</label>
                          <button 
                            type="button" 
                            onClick={() => {
                              const current = JSON.parse(examForm.booksJson || '[]');
                              setExamForm(prev => ({ ...prev, booksJson: JSON.stringify([...current, { title: '', link: '', image: '' }]) }));
                            }}
                            className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg font-bold text-xs hover:bg-emerald-100 transition"
                          >+ Add New Book</button>
                        </div>
                        
                        <div className="space-y-4 max-h-[400px] overflow-y-auto p-1 custom-scrollbar">
                          {JSON.parse(examForm.booksJson || '[]').map((book, idx) => (
                            <div key={idx} className="p-4 bg-white rounded-2xl border-2 border-slate-50 relative group shadow-sm">
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    const current = JSON.parse(examForm.booksJson || '[]');
                                    setExamForm(prev => ({ ...prev, booksJson: JSON.stringify(current.filter((_, i) => i !== idx)) }));
                                  }}
                                  className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
                                ><X size={12}/></button>
                                
                                <input 
                                  type="text" 
                                  placeholder="Book Title (e.g. Quantitative Aptitude by RS Aggarwal)" 
                                  value={book.title} 
                                  onChange={e => {
                                    const current = JSON.parse(examForm.booksJson || '[]');
                                    current[idx].title = e.target.value;
                                    setExamForm(prev => ({ ...prev, booksJson: JSON.stringify(current) }));
                                  }}
                                  className={`${styles.input} mb-2 border-slate-200 focus:border-emerald-400`}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <input 
                                    type="text" 
                                    placeholder="Image URL" 
                                    value={book.image} 
                                    onChange={e => {
                                      const current = JSON.parse(examForm.booksJson || '[]');
                                      current[idx].image = e.target.value;
                                      setExamForm(prev => ({ ...prev, booksJson: JSON.stringify(current) }));
                                    }}
                                    className="text-xs p-2 rounded-xl border border-slate-100 bg-slate-50"
                                  />
                                  <input 
                                    type="text" 
                                    placeholder="Buy Link (Amazon/Flipkart)" 
                                    value={book.link} 
                                    onChange={e => {
                                      const current = JSON.parse(examForm.booksJson || '[]');
                                      current[idx].link = e.target.value;
                                      setExamForm(prev => ({ ...prev, booksJson: JSON.stringify(current) }));
                                    }}
                                    className="text-xs p-2 rounded-xl border border-slate-100 bg-slate-50"
                                  />
                                </div>
                            </div>
                          ))}
                          {JSON.parse(examForm.booksJson || '[]').length === 0 && (
                            <div className="text-center py-10 text-slate-300 font-bold uppercase tracking-widest text-xs border-2 border-dashed rounded-2xl">No books recommended yet</div>
                          )}
                        </div>
                     </div>
                   )}

                   {examModalActiveTab === 'materials' && (
                     <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <label className="font-bold text-slate-700">Study Materials & Useful Links</label>
                          <button 
                            type="button" 
                            onClick={() => {
                              const current = JSON.parse(examForm.studyMaterialJson || '[]');
                              setExamForm(prev => ({ ...prev, studyMaterialJson: JSON.stringify([...current, { title: '', link: '', description: '' }]) }));
                            }}
                            className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg font-bold text-xs hover:bg-indigo-100 transition"
                          >+ Add Material</button>
                        </div>
                        
                        <div className="space-y-4 max-h-[400px] overflow-y-auto p-1 custom-scrollbar">
                          {JSON.parse(examForm.studyMaterialJson || '[]').map((item, idx) => (
                            <div key={idx} className="p-4 bg-white rounded-2xl border-2 border-slate-50 relative group shadow-sm">
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    const current = JSON.parse(examForm.studyMaterialJson || '[]');
                                    setExamForm(prev => ({ ...prev, studyMaterialJson: JSON.stringify(current.filter((_, i) => i !== idx)) }));
                                  }}
                                  className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
                                ><X size={12}/></button>
                                
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  <input 
                                    type="text" 
                                    placeholder="Title (e.g. Current Affairs 2024 PDF)" 
                                    value={item.title} 
                                    onChange={e => {
                                      const current = JSON.parse(examForm.studyMaterialJson || '[]');
                                      current[idx].title = e.target.value;
                                      setExamForm(prev => ({ ...prev, studyMaterialJson: JSON.stringify(current) }));
                                    }}
                                    className={`${styles.input} border-slate-200 focus:border-indigo-400`}
                                  />
                                  <input 
                                    type="text" 
                                    placeholder="Link URL" 
                                    value={item.link} 
                                    onChange={e => {
                                      const current = JSON.parse(examForm.studyMaterialJson || '[]');
                                      current[idx].link = e.target.value;
                                      setExamForm(prev => ({ ...prev, studyMaterialJson: JSON.stringify(current) }));
                                    }}
                                    className={`${styles.input} border-slate-200 focus:border-indigo-400`}
                                  />
                                </div>
                                <input 
                                  type="text" 
                                  placeholder="Brief Description (Optional)" 
                                  value={item.description} 
                                  onChange={e => {
                                    const current = JSON.parse(examForm.studyMaterialJson || '[]');
                                    current[idx].description = e.target.value;
                                    setExamForm(prev => ({ ...prev, studyMaterialJson: JSON.stringify(current) }));
                                  }}
                                  className="text-xs p-2 rounded-xl border border-slate-100 bg-slate-50 w-full"
                                />
                            </div>
                          ))}
                          {JSON.parse(examForm.studyMaterialJson || '[]').length === 0 && (
                            <div className="text-center py-10 text-slate-300 font-bold uppercase tracking-widest text-xs border-2 border-dashed rounded-2xl">No study materials linked yet</div>
                          )}
                        </div>
                     </div>
                   )}

                   <div className={styles.actionButtons}>
                      <button type="button" onClick={() => setIsExamModalOpen(false)} className={styles.cancelBtn}>Cancel</button>
                      <button type="submit" className={styles.saveBtn}>Save Settings</button>
                   </div>
                </form>
             </div>
          </div>
        </div>
      )}

      {/* Editor Drawer for Categories */}
      {isCategoryModalOpen && (
        <div className={styles.drawerOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setIsCategoryModalOpen(false); }}>
          <div className={styles.drawer} style={{ maxWidth: '400px' }}>
             <div className={styles.drawerHeader}>
                <h2 className={styles.drawerTitle}>{categoryForm.id ? "Edit Category" : "Create Category"}</h2>
                <button type="button" className={styles.drawerClose} onClick={() => setIsCategoryModalOpen(false)}><X size={20}/></button>
             </div>
             <div className={styles.drawerContent}>
                <form onSubmit={saveCategory}>
                   <div className={styles.formGroup}>
                      <label>Category Name</label>
                      <input type="text" value={categoryForm.name} onChange={e => {
                          const val = e.target.value;
                          const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                          setCategoryForm(prev => ({...prev, name: val, slug}));
                      }} required className={styles.input} />
                   </div>
                   <div className={styles.formGroup}>
                      <label>Slug</label>
                      <input type="text" value={categoryForm.slug} onChange={e => setCategoryForm(prev => ({...prev, slug: e.target.value}))} required className={styles.input} />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className={styles.formGroup}>
                        <label>Icon</label>
                        <input type="text" value={categoryForm.icon} onChange={e => setCategoryForm(prev => ({...prev, icon: e.target.value}))} required className={styles.input} />
                     </div>
                     <div className={styles.formGroup}>
                        <label>Order</label>
                        <input type="number" value={categoryForm.sortOrder} onChange={e => setCategoryForm(prev => ({...prev, sortOrder: parseInt(e.target.value)}))} className={styles.input} />
                     </div>
                   </div>
                   <div className={styles.actionButtons}>
                      <button type="button" onClick={() => setIsCategoryModalOpen(false)} className={styles.cancelBtn}>Cancel</button>
                      <button type="submit" className={styles.saveBtn}>Save Category</button>
                   </div>
                </form>
             </div>
          </div>
        </div>
      )}

      {/* FULL SCREEN WIZARD FOR MOCK TEST CREATION */}
      {isWizardOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
             <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>✨ Guided Design: New Mock Test</h2>
                <button className={styles.modalClose} onClick={() => setIsWizardOpen(false)}><X /></button>
             </div>
             
             <div className={styles.modalForm}>
                <div className={styles.wizardSteps}>
                   <div className={`${styles.stepItem} ${wizardStep === 1 ? styles.active : (wizardStep > 1 ? styles.completed : '')}`}>
                      <div className={styles.stepBadge}>{wizardStep > 1 ? <Check size={16}/> : 1}</div>
                      <span className={styles.stepLabel}>Basic Details</span>
                   </div>
                   <div className={`${styles.stepItem} ${wizardStep === 2 ? styles.active : (wizardStep > 2 ? styles.completed : '')}`}>
                      <div className={styles.stepBadge}>{wizardStep > 2 ? <Check size={16}/> : 2}</div>
                      <span className={styles.stepLabel}>Sections Configuration</span>
                   </div>
                   <div className={`${styles.stepItem} ${wizardStep === 3 ? styles.active : ''}`}>
                      <div className={styles.stepBadge}>3</div>
                      <span className={styles.stepLabel}>Preview & Confirm</span>
                   </div>
                </div>

                {wizardStep === 1 && (
                  <div className="max-w-3xl mx-auto space-y-6 py-8">
                     <div className="grid grid-cols-2 gap-6">
                        <div className={styles.formGroup}>
                           <label>Test Title (e.g., SSC CGL Full Mock 1)</label>
                           <input type="text" value={paperForm.title} onChange={e => {
                                const val = e.target.value;
                                const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                                setPaperForm(prev => ({...prev, title: val, slug}));
                            }} className={styles.input} placeholder="Enter attractive title" />
                        </div>
                        <div className={styles.formGroup}>
                           <label>Unique Slug (URL path)</label>
                           <input type="text" value={paperForm.slug} onChange={e => setPaperForm(prev => ({...prev, slug: e.target.value}))} className={styles.input} placeholder="ssc-cgl-mock-1" />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-6">
                        <div className={styles.formGroup}>
                           <label>Paper Type (Categorization)</label>
                           <select 
                            value={paperForm.paperType} 
                            onChange={e => setPaperForm(prev => ({ ...prev, paperType: e.target.value }))}
                            className={styles.input}
                           >
                            <option value="MOCK">Mock Test Simulation</option>
                            <option value="PYP">Official Previous Year Paper</option>
                           </select>
                        </div>
                        <div className={styles.formGroup}>
                           <label>Exam Year</label>
                           <input type="number" value={paperForm.year} onChange={e => setPaperForm(prev => ({...prev, year: parseInt(e.target.value)}))} className={styles.input} />
                        </div>
                     </div>
                     <div className="grid grid-cols-3 gap-6">
                        <div className={styles.formGroup}>
                           <label>Total Time (Minutes)</label>
                           <input type="number" value={paperForm.timeLimit} onChange={e => setPaperForm(prev => ({...prev, timeLimit: e.target.value}))} className={styles.input} />
                        </div>
                        <div className={styles.formGroup}>
                           <label>Max Marks</label>
                           <input type="number" value={paperForm.totalMarks} onChange={e => setPaperForm(prev => ({...prev, totalMarks: e.target.value}))} className={styles.input} />
                        </div>
                        <div className={styles.formGroup}>
                           <label>Correct Mark (+)</label>
                           <input type="number" step="0.1" value={paperForm.positiveMarking} onChange={e => setPaperForm(prev => ({...prev, positiveMarking: e.target.value}))} className={styles.input} />
                        </div>
                     </div>
                     <div className={styles.formGroup}>
                        <label>Exam Instructions (TCS Style)</label>
                        <textarea value={paperForm.instructions} onChange={e => setPaperForm(prev => ({...prev, instructions: e.target.value}))} className={styles.textarea} rows="6" placeholder="Write detailed instructions for the student..."></textarea>
                     </div>
                     <div className="flex justify-end pt-6 border-t mt-10">
                        <button onClick={() => setWizardStep(2)} className={styles.addButton}>
                           Define Sections & Subjects <ChevronRight size={18} />
                        </button>
                     </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="max-w-5xl mx-auto py-8">
                     <div className="text-center mb-10">
                        <h3 className="text-xl font-bold text-slate-800">Section Configuration</h3>
                        <p className="text-slate-500">Configure subjects, timing, and marking for each section.</p>
                     </div>
                     
                     <div className="space-y-4">
                        <div className="grid grid-cols-12 gap-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                           <div className="col-span-4">Subject Name</div>
                           <div className="col-span-2">Time (Min)</div>
                           <div className="col-span-2">Max Marks</div>
                           <div className="col-span-2">Ques Limit</div>
                           <div className="col-span-2">Action</div>
                        </div>
                        {wizardSections.map((sec, idx) => (
                           <div key={idx} className="grid grid-cols-12 gap-4 bg-white p-4 rounded-2xl border-2 border-slate-100 items-center shadow-sm hover:border-indigo-100 transition">
                              <div className="col-span-4">
                                 <input 
                                    type="text" 
                                    value={sec.name} 
                                    onChange={e => {
                                      const n = [...wizardSections];
                                      n[idx].name = e.target.value;
                                      setWizardSections(n);
                                    }} 
                                    className={styles.input}
                                    placeholder="Section Name"
                                 />
                              </div>
                              <div className="col-span-2">
                                 <input 
                                    type="number" 
                                    value={sec.timeLimit} 
                                    onChange={e => {
                                      const n = [...wizardSections];
                                      n[idx].timeLimit = e.target.value;
                                      setWizardSections(n);
                                    }} 
                                    className={styles.input}
                                 />
                              </div>
                              <div className="col-span-2">
                                 <input 
                                    type="number" 
                                    value={sec.totalMarks} 
                                    onChange={e => {
                                      const n = [...wizardSections];
                                      n[idx].totalMarks = e.target.value;
                                      setWizardSections(n);
                                    }} 
                                    className={styles.input}
                                 />
                              </div>
                              <div className="col-span-2">
                                 <input 
                                    type="number" 
                                    value={sec.totalQuestions} 
                                    onChange={e => {
                                      const n = [...wizardSections];
                                      n[idx].totalQuestions = e.target.value;
                                      setWizardSections(n);
                                    }} 
                                    className={styles.input}
                                 />
                              </div>
                              <div className="col-span-2">
                                 <button 
                                    className="text-rose-500 font-bold text-sm hover:bg-rose-50 px-3 py-2 rounded-lg"
                                    onClick={() => setWizardSections(prev => prev.filter((_, i) => i !== idx))}
                                 >Remove</button>
                              </div>
                           </div>
                        ))}
                        <button 
                           onClick={() => setWizardSections(prev => [...prev, { name: '', timeLimit: 0, totalMarks: 0, totalQuestions: 0 }])}
                           className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:bg-slate-50 transition"
                        >+ Add More Section</button>
                     </div>

                     <div className="flex justify-between pt-12 border-t mt-10">
                        <button onClick={() => setWizardStep(1)} className={styles.cancelButton}>Back to Details</button>
                        <button onClick={saveWizard} className={styles.submitButton} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>🚀 Create & Setup Test</button>
                     </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* FULL SCREEN MANUAl QUESTION EDITOR */}
      {isQuestionModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
             <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>{questionForm.id ? "✏️ Edit Question" : "➕ Add Question"}</h2>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase">Mode: Advanced Manual</span>
                  <button className={styles.modalClose} onClick={() => setIsQuestionModalOpen(false)}><X /></button>
                </div>
             </div>
             
             <div className={styles.modalForm}>
                <div className="max-w-6xl mx-auto">
                   <div className="grid grid-cols-2 gap-10 mb-10">
                      <div className="space-y-4">
                         <div className="flex justify-between items-center">
                            <label className="font-bold text-slate-700">Question Text (English)</label>
                            {questionForm.image && <Check className="text-emerald-500" size={16}/>}
                         </div>
                         <textarea value={questionForm.text} onChange={e => setQuestionForm(prev => ({...prev, text: e.target.value}))} className={styles.textarea} rows="5" required placeholder="Enter English question..."></textarea>
                         
                         <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100">
                            <label className="block text-sm font-bold text-slate-500 mb-2 uppercase">Question Media</label>
                            <div className="flex items-center gap-4">
                               <label className={`${styles.uploadBtn} flex-1`}>
                                  <ImageIcon size={20}/> <span>{questionForm.image ? "Change Image" : "Upload Local Image"}</span>
                                  <input type="file" className="hidden" onChange={e => handleImageUpload(e, 'question')} />
                               </label>
                               {questionForm.image && (
                                 <div className="relative group">
                                    <img src={questionForm.image} className="w-16 h-16 rounded border-2 border-indigo-200 object-cover" />
                                    <button onClick={() => setQuestionForm(prev => ({...prev, image: ''}))} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition">
                                       <X size={12}/>
                                    </button>
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <label className="font-bold text-slate-700">Question Text (Hindi)</label>
                         <textarea value={questionForm.textHi} onChange={e => setQuestionForm(prev => ({...prev, textHi: e.target.value}))} className={styles.textarea} rows="5" placeholder="हिंदी प्रश्न दर्ज करें..."></textarea>
                         
                         <div className="grid grid-cols-3 gap-4">
                            <div className={styles.formGroup}>
                               <label className="text-xs font-bold text-slate-400">Section</label>
                               <select value={questionForm.sectionId} onChange={e => setQuestionForm(prev => ({...prev, sectionId: e.target.value}))} className={styles.input}>
                                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                               </select>
                            </div>
                            <div className={styles.formGroup}>
                               <label className="text-xs font-bold text-slate-400">Difficulty</label>
                               <select value={questionForm.difficulty} onChange={e => setQuestionForm(prev => ({...prev, difficulty: e.target.value}))} className={styles.input}>
                                  <option value="Easy">Easy</option>
                                  <option value="Medium">Medium</option>
                                  <option value="Hard">Hard</option>
                               </select>
                            </div>
                            <div className={styles.formGroup}>
                               <label className="text-xs font-bold text-slate-400">Correct Opt</label>
                               <select value={questionForm.answer} onChange={e => setQuestionForm(prev => ({...prev, answer: parseInt(e.target.value)}))} className={styles.input} style={{ borderColor: '#10b981', background: '#f0fdf4' }}>
                                  <option value={0}>Option 1</option>
                                  <option value={1}>Option 2</option>
                                  <option value={2}>Option 3</option>
                                  <option value={3}>Option 4</option>
                               </select>
                            </div>
                         </div>
                      </div>
                   </div>

                   <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold">4</div>
                      Options Configuration
                   </h3>
                   
                   <div className="grid grid-cols-2 gap-8 mb-10">
                      {questionForm.options.map((opt, idx) => (
                         <div key={idx} className={`p-6 bg-white rounded-3xl border-2 transition ${questionForm.answer === idx ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100'}`}>
                            <div className="flex justify-between items-center mb-4">
                               <span className="font-bold text-slate-400 uppercase tracking-widest text-xs">Option {idx+1}</span>
                               <input 
                                 type="radio" 
                                 checked={questionForm.answer === idx} 
                                 onChange={() => setQuestionForm(prev => ({...prev, answer: idx}))} 
                                 className="w-5 h-5 accent-emerald-500 cursor-pointer"
                               />
                            </div>
                            
                            <div className="space-y-4">
                               <input 
                                 type="text" 
                                 placeholder="Option (EN)" 
                                 value={opt} 
                                 onChange={e => {
                                   const n = [...questionForm.options]; n[idx] = e.target.value;
                                   setQuestionForm(prev => ({...prev, options: n}));
                                 }}
                                 className={styles.input}
                               />
                               <input 
                                 type="text" 
                                 placeholder="Option (HI)" 
                                 value={questionForm.optionsHi[idx]} 
                                 onChange={e => {
                                   const n = [...questionForm.optionsHi]; n[idx] = e.target.value;
                                   setQuestionForm(prev => ({...prev, optionsHi: n}));
                                 }}
                                 className={styles.input}
                               />
                               <label className={styles.uploadBtn}>
                                  <Upload size={16}/> <span>{questionForm.options[idx]?.startsWith('http') ? "Update Image" : "Option Image (Opt)"}</span>
                                  <input type="file" className="hidden" onChange={e => handleImageUpload(e, 'option', idx)} />
                               </label>
                            </div>
                         </div>
                      ))}
                   </div>

                   <div className="grid grid-cols-2 gap-10 mb-10 border-t pt-10">
                      <div className={styles.formGroup}>
                         <label className="font-bold text-slate-700">Explanation / Solution (English)</label>
                         <textarea value={questionForm.explanation} onChange={e => setQuestionForm(prev => ({...prev, explanation: e.target.value}))} className={styles.textarea} rows="4" placeholder="How was it solved?"></textarea>
                      </div>
                      <div className={styles.formGroup}>
                         <label className="font-bold text-slate-700">Explanation / Solution (Hindi)</label>
                         <textarea value={questionForm.explanationHi} onChange={e => setQuestionForm(prev => ({...prev, explanationHi: e.target.value}))} className={styles.textarea} rows="4" placeholder="हल कैसे किया गया?"></textarea>
                      </div>
                   </div>

                   <div className="flex justify-end gap-6 pt-10 border-t mb-20">
                      <button type="button" onClick={() => setIsQuestionModalOpen(false)} className={styles.cancelButton}>Discard Changes</button>
                      <button type="button" onClick={saveQuestion} className={styles.submitButton} style={{ padding: '1rem 4rem' }}>Save & Update Bank</button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* FULL SCREEN BULK INGESTER */}
      {isBulkModalOpen && (
        <div className={styles.modalOverlay}>
           <div className={styles.modal}>
              <div className={styles.modalHeader}>
                 <h2 className={styles.modalTitle}>📦 High-Volume Bulk Ingester</h2>
                 <button className={styles.modalClose} onClick={() => setIsBulkModalOpen(false)}><X /></button>
              </div>
              <div className={styles.modalForm}>
                 <div className="max-w-4xl mx-auto py-20 text-center">
                    <div className="mb-12">
                       <h3 className="text-3xl font-black text-slate-800 mb-4">Ingest Bilingual Questions via Excel</h3>
                       <p className="text-slate-500 max-w-2xl mx-auto">Upload thousands of questions at once. Our engine will automatically create sections, map questions, and process indices.</p>
                       
                       <div className="mt-8 flex justify-center gap-6">
                          <button 
                             onClick={downloadSampleTemplate}
                             className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-6 py-3 rounded-2xl font-bold hover:bg-indigo-100 transition"
                          >
                             <Download size={20}/> Download Sample Template
                          </button>
                       </div>
                    </div>

                    <div className="relative border-4 border-dashed border-slate-100 p-20 rounded-[3rem] bg-slate-50/50 hover:bg-slate-50 transition-all group">
                       <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <Upload className="text-indigo-600 mb-4 group-hover:scale-110 transition" size={64}/>
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
                       <button type="button" onClick={() => setIsBulkModalOpen(false)} className={styles.cancelButton} disabled={isUploading}>Cancel Ingestion</button>
                       <button type="button" onClick={handleBulkUpload} className={styles.submitButton} disabled={isUploading} style={{ minWidth: '300px' }}>
                          {isUploading ? "🔥 Engines Cooking..." : "🚀 Ignite Batch Process"}
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
