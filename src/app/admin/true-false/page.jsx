"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import { CheckCircle, Plus, Edit, Trash2, Upload, Download, Search, Filter, Globe, Eye, FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';
import styles from "@/styles/TrueFalse.module.css";

export default function AdminTrueFalsePage() {
  const [activeTab, setActiveTab] = useState("categories");
  
  // Categories and Questions
  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  
  // Category Form
  const [editingCategory, setEditingCategory] = useState(null);
  const [catName, setCatName] = useState("");
  const [catNameHi, setCatNameHi] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catImage, setCatImage] = useState("");
  const [catSortOrder, setCatSortOrder] = useState(0);
  
  // Question Form
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionCatId, setQuestionCatId] = useState("");
  const [questionStatement, setQuestionStatement] = useState("");
  const [questionStatementHi, setQuestionStatementHi] = useState("");
  const [questionCorrectAnswer, setQuestionCorrectAnswer] = useState(true);
  const [questionExplanation, setQuestionExplanation] = useState("");
  const [questionExplanationHi, setQuestionExplanationHi] = useState("");
  const [questionImage, setQuestionImage] = useState("");
  
  // Bulk Upload
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bulkResults, setBulkResults] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [showOnlyHidden, setShowOnlyHidden] = useState(false);

  // Duplicate detection
  const duplicateCounts = useMemo(() => {
    const counts = {};
    questions.forEach(q => {
      const stmt = q.statement?.trim().toLowerCase();
      if (!stmt) return;
      counts[stmt] = (counts[stmt] || 0) + 1;
    });
    return counts;
  }, [questions]);

  const isQuestionDuplicate = (statement) => {
    if (!statement) return false;
    return duplicateCounts[statement.trim().toLowerCase()] > 1;
  };

  // Fetch data
  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await fetch("/api/admin/true-false?type=categories");
      const data = await response.json();
      if (response.ok) {
        setCategories(data.categories || []);
      } else {
        toast.error(data.error || "Failed to fetch categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to fetch categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const url = filterCategoryId 
        ? `/api/admin/true-false?type=questions&categoryId=${filterCategoryId}`
        : "/api/admin/true-false?type=questions";
      
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setQuestions(data.questions || []);
      } else {
        toast.error(data.error || "Failed to fetch questions");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Failed to fetch questions");
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchQuestions();
  }, [filterCategoryId]);

  // Category operations
  const saveCategory = async () => {
    if (!catName.trim()) {
      toast.error("Category name is required");
      return;
    }

    const slug = catSlug.trim() || catName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    try {
      const response = await fetch("/api/admin/true-false", {
        method: editingCategory ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "category",
          id: editingCategory?.id,
          name: catName.trim(),
          nameHi: catNameHi.trim(),
          slug,
          image: catImage.trim(),
          sortOrder: catSortOrder
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(`Category ${editingCategory ? "updated" : "created"} successfully`);
        resetCategoryForm();
        fetchCategories();
      } else {
        toast.error(data.error || "Failed to save category");
      }
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Failed to save category");
    }
  };

  const deleteCategory = async (id) => {
    if (!confirm("Are you sure you want to delete this category? All questions in it will also be deleted.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/true-false?type=category&id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Category deleted successfully");
        fetchCategories();
        fetchQuestions();
      } else {
        toast.error(data.error || "Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  const editCategory = (category) => {
    setEditingCategory(category);
    setCatName(category.name);
    setCatNameHi(category.nameHi || "");
    setCatSlug(category.slug);
    setCatImage(category.image || "");
    setCatSortOrder(category.sortOrder || 0);
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCatName("");
    setCatNameHi("");
    setCatSlug("");
    setCatImage("");
    setCatSortOrder(0);
  };

  // Question operations
  const saveQuestion = async () => {
    if (!questionStatement.trim()) {
      toast.error("Question statement is required");
      return;
    }
    if (!questionCatId) {
      toast.error("Category is required");
      return;
    }

    try {
      const response = await fetch("/api/admin/true-false", {
        method: editingQuestion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "question",
          id: editingQuestion?.id,
          categoryId: questionCatId,
          statement: questionStatement.trim(),
          statementHi: questionStatementHi.trim(),
          correctAnswer: questionCorrectAnswer,
          explanation: questionExplanation.trim(),
          explanationHi: questionExplanationHi.trim(),
          image: questionImage.trim()
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(`Question ${editingQuestion ? "updated" : "created"} successfully`);
        resetQuestionForm();
        fetchQuestions();
      } else {
        toast.error(data.error || "Failed to save question");
      }
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error("Failed to save question");
    }
  };

  const deleteQuestion = async (id) => {
    if (!confirm("Are you sure you want to delete this question?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/true-false?type=question&id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Question deleted successfully");
        fetchQuestions();
      } else {
        toast.error(data.error || "Failed to delete question");
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Failed to delete question");
    }
  };

  const editQuestion = (question) => {
    setEditingQuestion(question);
    setQuestionCatId(question.categoryId);
    setQuestionStatement(question.statement);
    setQuestionStatementHi(question.statementHi || "");
    setQuestionCorrectAnswer(question.correctAnswer);
    setQuestionExplanation(question.explanation || "");
    setQuestionExplanationHi(question.explanationHi || "");
    setQuestionImage(question.image || "");
  };

  const resetQuestionForm = () => {
    setEditingQuestion(null);
    setQuestionCatId("");
    setQuestionStatement("");
    setQuestionStatementHi("");
    setQuestionCorrectAnswer(true);
    setQuestionExplanation("");
    setQuestionExplanationHi("");
    setQuestionImage("");
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        "Category EN": "Human Body",
        "Category HI": "मानव शरीर",
        "Question EN": "The human heart beats about 100,000 times a day.",
        "Question HI": "मानव हृदय दिन में लगभग 1,00,000 बार धड़कता है।",
        "True/False": "True",
        "Explanation EN": "An average heart beats 70-80 times per minute, totaling over 100k a day.",
        "Explanation HI": "एक औसत हृदय प्रति मिनट 70-80 बार धड़कता है, जो दिन में 1 लाख से अधिक होता है।"
      },
      {
        "Category EN": "Human Body",
        "Category HI": "मानव शरीर",
        "Question EN": "Adults have more bones than babies.",
        "Question HI": "वयस्कों में शिशुओं की तुलना में अधिक हड्डियाँ होती हैं।",
        "True/False": "False",
        "Explanation EN": "Babies are born with 300 bones, but many fuse together to form 206 in adults.",
        "Explanation HI": "बच्चे 300 हड्डियों के साथ पैदा होते हैं, लेकिन वयस्कों में कई जुड़कर 206 रह जाती हैं।"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "TrueFalse_Bulk_Upload_Template.xlsx");
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setBulkUploading(true);
    setBulkResults(null);

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length < 2) {
            toast.error("File must contain at least a header row and one data row");
            setBulkUploading(false);
            return;
          }

          const headers = jsonData[0];
          const rows = jsonData.slice(1);
          
          // Validate headers
          const requiredHeaders = ['Category EN', 'Question EN', 'True/False'];
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
          
          if (missingHeaders.length > 0) {
            toast.error(`Missing required columns: ${missingHeaders.join(', ')}`);
            setBulkUploading(false);
            return;
          }

          // Process rows
          const results = {
            total: rows.length,
            success: 0,
            failed: 0,
            errors: [],
            categoriesCreated: new Set(),
            questionsCreated: 0
          };

          // Maintain a local copy of categories to avoid duplicate creation in the loop
          let localCategories = [...categories];

          for (let i = 0; i < rows.length; i++) {
            setUploadProgress(Math.round(((i + 1) / rows.length) * 100));
            const row = rows[i];
            if (!row || row.length === 0) continue;

            try {
              const rowData = {};
              headers.forEach((header, index) => {
                rowData[header] = row[index] || '';
              });

              // Validate required fields
              if (!rowData['Category EN'] || !rowData['Question EN'] || rowData['True/False'] === undefined) {
                results.failed++;
                results.errors.push(`Row ${i + 2}: Missing required fields`);
                continue;
              }

              // Parse True/False value
              const trueFalseValue = String(rowData['True/False']).toLowerCase().trim();
              const correctAnswer = trueFalseValue === 'true' || trueFalseValue === '1' || trueFalseValue === 'yes';

              // Create or find category
              let category = localCategories.find(cat => 
                cat.name.toLowerCase() === rowData['Category EN'].toLowerCase().trim()
              );

              if (!category) {
                const catResponse = await fetch("/api/admin/true-false", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    type: "category",
                    name: rowData['Category EN'].trim(),
                    nameHi: rowData['Category HI']?.trim() || '',
                    slug: rowData['Category EN'].toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                    image: '',
                    sortOrder: 0
                  })
                });

                const catData = await catResponse.json();
                if (catResponse.ok) {
                  category = catData.category;
                  results.categoriesCreated.add(category.name);
                  localCategories.push(category);
                  setCategories(prev => [...prev, category]);
                } else {
                  results.failed++;
                  results.errors.push(`Row ${i + 2}: Category Creation Failed - ${catData.error || 'Unknown error'}`);
                  continue;
                }
              }

              // Create question
              const questionResponse = await fetch("/api/admin/true-false", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "question",
                  categoryId: category.id,
                  statement: rowData['Question EN'].trim(),
                  statementHi: rowData['Question HI']?.trim() || '',
                  correctAnswer: correctAnswer,
                  explanation: rowData['Explanation EN']?.trim() || '',
                  explanationHi: rowData['Explanation HI']?.trim() || '',
                  image: ''
                })
              });

              if (questionResponse.ok) {
                results.success++;
                results.questionsCreated++;
              } else {
                results.failed++;
                const errorData = await questionResponse.json();
                results.errors.push(`Row ${i + 2}: Question Creation Failed - ${errorData.error || 'Unknown error'}`);
              }

            } catch (error) {
              results.failed++;
              results.errors.push(`Row ${i + 2}: Unexpected error - ${error.message}`);
            }
          }

          setBulkResults(results);
          toast.success(`Upload completed: ${results.success} successful, ${results.failed} failed`);
          fetchQuestions();
          fetchCategories();

        } catch (error) {
          console.error("Error processing file:", error);
          toast.error("Failed to process file. Please check the format.");
        } finally {
          setBulkUploading(false);
        }
      };

      reader.readAsArrayBuffer(bulkFile);

    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
      setBulkUploading(false);
    }
  };

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchesSearch = !searchTerm || 
        q.statement.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.category.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesHidden = !showOnlyHidden || q.hidden;
      
      return matchesSearch && matchesHidden;
    });
  }, [questions, searchTerm, showOnlyHidden]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <CheckCircle className={styles.checkIcon} /> True/False Management
          </h1>
          <p className={styles.description}>
            Manage categories and questions for the True/False quiz feature
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "categories"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("categories")}
          >
            Categories
          </button>
          <button
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "questions"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("questions")}
          >
            Questions
          </button>
          <button
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "bulk"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("bulk")}
          >
            Bulk Upload
          </button>
        </div>

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            {/* Category Form */}
            <div className={styles.quizContainer}>
              <h3 className="text-lg font-semibold mb-4">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Category name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Hindi Name</label>
                  <input
                    type="text"
                    value={catNameHi}
                    onChange={(e) => setCatNameHi(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Category name in Hindi"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <input
                    type="text"
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="url-slug"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={catSortOrder}
                    onChange={(e) => setCatSortOrder(Number(e.target.value))}
                    className="w-full p-2 border rounded"
                    placeholder="0"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Image URL</label>
                  <input
                    type="text"
                    value={catImage}
                    onChange={(e) => setCatImage(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={saveCategory}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  {editingCategory ? "Update" : "Create"} Category
                </button>
                {editingCategory && (
                  <button
                    onClick={resetCategoryForm}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Categories List */}
            <div className={styles.quizContainer}>
              <h3 className="text-lg font-semibold mb-4">Categories</h3>
              
              {loadingCategories ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.loadingSpinner}></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{cat.name}</div>
                        {cat.nameHi && <div className="text-sm text-gray-600">{cat.nameHi}</div>}
                        <div className="text-sm text-gray-500">{cat.slug} · {cat._count.questions} questions</div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => editCategory(cat)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteCategory(cat.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === "questions" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className={styles.quizContainer}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Search</label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-2 pl-9 border rounded"
                      placeholder="Search questions..."
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={filterCategoryId}
                    onChange={(e) => setFilterCategoryId(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showOnlyHidden}
                      onChange={(e) => setShowOnlyHidden(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Show only hidden</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Question Form */}
            <div className={styles.quizContainer}>
              <h3 className="text-lg font-semibold mb-4">
                {editingQuestion ? "Edit Question" : "Add New Question"}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select
                    value={questionCatId}
                    onChange={(e) => setQuestionCatId(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Statement *</label>
                  <textarea
                    value={questionStatement}
                    onChange={(e) => setQuestionStatement(e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={3}
                    placeholder="Enter the statement..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Hindi Statement</label>
                  <textarea
                    value={questionStatementHi}
                    onChange={(e) => setQuestionStatementHi(e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={3}
                    placeholder="Enter the statement in Hindi..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Correct Answer *</label>
                  <select
                    value={questionCorrectAnswer}
                    onChange={(e) => setQuestionCorrectAnswer(e.target.value === "true")}
                    className="w-full p-2 border rounded"
                  >
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Explanation</label>
                  <textarea
                    value={questionExplanation}
                    onChange={(e) => setQuestionExplanation(e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={3}
                    placeholder="Enter explanation..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Hindi Explanation</label>
                  <textarea
                    value={questionExplanationHi}
                    onChange={(e) => setQuestionExplanationHi(e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={3}
                    placeholder="Enter explanation in Hindi..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Image URL</label>
                  <input
                    type="text"
                    value={questionImage}
                    onChange={(e) => setQuestionImage(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={saveQuestion}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  {editingQuestion ? "Update" : "Create"} Question
                </button>
                {editingQuestion && (
                  <button
                    onClick={resetQuestionForm}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Questions List */}
            <div className={styles.quizContainer}>
              <h3 className="text-lg font-semibold mb-4">
                Questions ({filteredQuestions.length})
              </h3>
              
              {loadingQuestions ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.loadingSpinner}></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredQuestions.map((q) => (
                    <div key={q.id} className={`p-3 border rounded ${isQuestionDuplicate(q.statement) ? 'bg-yellow-50 border-yellow-300' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{q.statement}</div>
                          {q.statementHi && <div className="text-sm text-gray-600">{q.statementHi}</div>}
                          <div className="text-sm text-gray-500 mt-1">
                            {q.category.name} · Correct: {q.correctAnswer ? "True" : "False"} · Views: {q.views}
                            {isQuestionDuplicate(q.statement) && <span className="ml-2 text-yellow-600 font-medium">DUPLICATE</span>}
                          </div>
                          {q.explanation && (
                            <div className="text-sm text-gray-600 mt-1">
                              Explanation: {q.explanation}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => editQuestion(q)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => deleteQuestion(q.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bulk Upload Tab */}
        {activeTab === "bulk" && (
          <div className={styles.quizContainer}>
            <h3 className="text-lg font-semibold mb-4">Bulk Upload Questions (Excel/CSV)</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Upload Excel or CSV File</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setBulkFile(e.target.files[0])}
                  className="w-full p-2 border rounded"
                  disabled={bulkUploading}
                />
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Expected Excel Format (Columns):</p>
                <div className="bg-gray-100 p-3 rounded text-xs">
                  <p><strong>Required Columns:</strong></p>
                  <ul className="ml-4 mb-2">
                    <li>Category EN (English name)</li>
                    <li>Question EN (English statement)</li>
                    <li>True/False (true/false/1/0/yes/no)</li>
                  </ul>
                  <p><strong>Optional Columns:</strong></p>
                  <ul className="ml-4 mb-2">
                    <li>Category HI (Hindi category name)</li>
                    <li>Question HI (Hindi statement)</li>
                    <li>Explanation EN (English explanation)</li>
                    <li>Explanation HI (Hindi explanation)</li>
                  </ul>
                </div>
              </div>
              
              {bulkUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Uploading questions...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-500 h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleBulkUpload}
                  disabled={!bulkFile || bulkUploading}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 flex items-center"
                >
                  {bulkUploading ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="mr-2" />
                      Upload Questions
                    </>
                  )}
                </button>

                <button
                  onClick={downloadTemplate}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                >
                  <Download size={16} className="mr-2" />
                  Download Template
                </button>
              </div>
              
              {bulkResults && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <h4 className="font-semibold mb-2">Upload Results</h4>
                  <div className="space-y-1 text-sm">
                    <p>Total rows: {bulkResults.total}</p>
                    <p>Successful: {bulkResults.success}</p>
                    <p>Failed: {bulkResults.failed}</p>
                    <p>Questions created: {bulkResults.questionsCreated}</p>
                    {bulkResults.categoriesCreated.size > 0 && (
                      <p>Categories created: {Array.from(bulkResults.categoriesCreated).join(', ')}</p>
                    )}
                  </div>
                  
                  {bulkResults.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium text-red-600">Errors:</p>
                      <ul className="text-xs text-red-600 max-h-32 overflow-y-auto">
                        {bulkResults.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
