"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import toast from "react-hot-toast";
import styles from "@/styles/SetManagerModal.module.css";

// Parser for Excel copy-paste TSV data
// Standard 14-Column Format requested by user:
// Col 0 (A): Main Category
// Col 1 (B): Sub category
// Col 2 (C): Topic name
// Col 3 (D): Keywords/tags
// Col 4 (E): Question
// Col 5 (F): Option A
// Col 6 (G): Option B
// Col 7 (H): Option C
// Col 8 (I): Option D
// Col 9 (J): Correct Answer
// Col 10 (K): Difficulty
// Col 11 (L): Hindi Explanation
// Col 12 (M): English Explanation
// Col 13 (N): Language
export function parseExcelData(rawText) {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  const results = [];

  // Check if first line is a header row
  const firstLine = lines[0];
  const firstCols = firstLine.split("\t").map(col => col.trim().replace(/^"(.*)"$/, "$1").trim());
  const firstLineLower = firstLine.toLowerCase();

  const isHeaderRow =
    (firstLineLower.includes("category") ||
      firstLineLower.includes("topic") ||
      firstLineLower.includes("keyword") ||
      firstLineLower.includes("question")) &&
    (firstLineLower.includes("option") ||
      firstLineLower.includes("answer") ||
      firstLineLower.includes("difficulty") ||
      firstLineLower.includes("explanation") ||
      firstLineLower.includes("sub category"));

  // Default column index mapping matching the 14 standard columns
  let colMap = {
    mainCategory: 0,
    subCategory: 1,
    topic: 2,
    keywords: 3,
    question: 4,
    optA: 5,
    optB: 6,
    optC: 7,
    optD: 8,
    answer: 9,
    difficulty: 10,
    hindiExplanation: 11,
    englishExplanation: 12,
    language: 13,
  };

  if (isHeaderRow) {
    const findHeaderIdx = (aliases, defaultIdx = -1) => {
      for (let i = 0; i < firstCols.length; i++) {
        const hNorm = firstCols[i].toLowerCase().replace(/[^a-z0-9]/g, "");
        for (const alias of aliases) {
          const aNorm = alias.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (hNorm === aNorm || (aNorm.length >= 3 && hNorm.includes(aNorm))) {
            return i;
          }
        }
      }
      return defaultIdx;
    };

    colMap = {
      mainCategory: findHeaderIdx(["maincategory", "main category", "mastercategory", "master category"], 0),
      subCategory: findHeaderIdx(["subcategory", "sub category"], 1),
      topic: findHeaderIdx(["topicname", "topic name", "topic"], 2),
      keywords: findHeaderIdx(["keywordstags", "keywords", "tags", "keyword", "examtags"], 3),
      question: findHeaderIdx(["question", "questions", "text", "qtext"], 4),
      optA: findHeaderIdx(["optiona", "option a", "opt a", "opt 1", "option 1"], 5),
      optB: findHeaderIdx(["optionb", "option b", "opt b", "opt 2", "option 2"], 6),
      optC: findHeaderIdx(["optionc", "option c", "opt c", "opt 3", "option 3"], 7),
      optD: findHeaderIdx(["optiond", "option d", "opt d", "opt 4", "option 4"], 8),
      answer: findHeaderIdx(["correctanswer", "correct answer", "answer", "correct", "ans"], 9),
      difficulty: findHeaderIdx(["difficulty", "diff", "level"], 10),
      hindiExplanation: findHeaderIdx(["hindiexplanation", "hindi explanation", "explanation_hi"], 11),
      englishExplanation: findHeaderIdx(["englishexplanation", "english explanation", "explanation_en"], 12),
      language: findHeaderIdx(["language", "lang"], 13),
    };
  }

  const startIndex = isHeaderRow ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    let cols = line.split("\t").map(col => col.trim().replace(/^"(.*)"$/, "$1").trim());

    if (cols.length < 5) continue;

    let mainCategory = "";
    let subCategory = "";
    let topic = "";
    let keywords = "";
    let question = "";
    let optA = "";
    let optB = "";
    let optC = "";
    let optD = "";
    let answer = "";
    let difficulty = "Easy";
    let hindiExplanation = "";
    let englishExplanation = "";
    let language = "Hindi";

    // Standard 14-Column Format or Header-Mapped Format:
    if (cols.length >= 9) {
      const getVal = (idx) => (idx >= 0 && idx < cols.length ? cols[idx] : "");
      mainCategory = getVal(colMap.mainCategory);
      subCategory = getVal(colMap.subCategory);
      topic = getVal(colMap.topic);
      keywords = getVal(colMap.keywords);
      question = getVal(colMap.question);
      optA = getVal(colMap.optA);
      optB = getVal(colMap.optB);
      optC = getVal(colMap.optC);
      optD = getVal(colMap.optD);
      answer = getVal(colMap.answer);
      difficulty = getVal(colMap.difficulty) || "Easy";
      hindiExplanation = getVal(colMap.hindiExplanation);
      englishExplanation = getVal(colMap.englishExplanation);
      language = getVal(colMap.language);
    } else {
      // Fallback 7-column format: Question, OptA, OptB, OptC, OptD, Answer, Difficulty
      question = cols[0] || "";
      optA = cols[1] || "";
      optB = cols[2] || "";
      optC = cols[3] || "";
      optD = cols[4] || "";
      answer = cols[5] || "";
      difficulty = cols[6] || "Easy";
    }

    if (!question && !optA) continue;

    const options = [optA, optB, optC, optD];

    // Determine correct answer index
    let correctIdx = 0;
    const ansRaw = (answer || "").trim();
    const ansLower = ansRaw.toLowerCase();

    // 1. Check letter codes (A, B, C, D or Option A, Option B, etc., or 1, 2, 3, 4)
    if (ansLower === "a" || ansLower === "option a" || ansLower === "opt a" || ansLower === "1") {
      correctIdx = 0;
    } else if (ansLower === "b" || ansLower === "option b" || ansLower === "opt b" || ansLower === "2") {
      correctIdx = 1;
    } else if (ansLower === "c" || ansLower === "option c" || ansLower === "opt c" || ansLower === "3") {
      correctIdx = 2;
    } else if (ansLower === "d" || ansLower === "option d" || ansLower === "opt d" || ansLower === "4") {
      correctIdx = 3;
    } else {
      // 2. Exact match against option text
      const exactIdx = options.findIndex(o => o && o.trim().toLowerCase() === ansLower);
      if (exactIdx !== -1) {
        correctIdx = exactIdx;
      } else {
        // 3. Relaxed / normalized text match (remove punctuation/extra spaces)
        const norm = (s) => (s || "").replace(/[\s\-_.,()]/g, "").toLowerCase();
        const normAns = norm(ansRaw);
        const fuzzyIdx = options.findIndex(o => norm(o) === normAns);
        if (fuzzyIdx !== -1) {
          correctIdx = fuzzyIdx;
        } else {
          // 4. StartsWith / Includes fallback
          const partialIdx = options.findIndex(
            o => o && normAns && (norm(o).startsWith(normAns) || normAns.startsWith(norm(o)))
          );
          if (partialIdx !== -1) {
            correctIdx = partialIdx;
          }
        }
      }
    }

    // Normalize difficulty
    let diffNorm = "easy";
    const diffLower = (difficulty || "").toLowerCase();
    if (diffLower.includes("expert")) diffNorm = "expert";
    else if (diffLower.includes("hard")) diffNorm = "hard";
    else if (diffLower.includes("med")) diffNorm = "medium";
    else diffNorm = "easy";

    // Auto-detect language
    const isHindiQuestion = /[\u0900-\u097F]/.test(question);
    let langNorm = "hi";
    const langLower = (language || "").toLowerCase().trim();
    if (langLower.includes("en") || langLower.includes("eng")) langNorm = "en";
    else if (langLower.includes("hi") || langLower.includes("hin")) langNorm = "hi";
    else langNorm = isHindiQuestion ? "hi" : "en";

    // Keywords to tags array
    const tags = keywords
      ? keywords.split(/[,،;|]+/).map(t => t.trim()).filter(Boolean)
      : [];

    results.push({
      mainCategory: mainCategory || "",
      subCategory: subCategory || "",
      category: subCategory || mainCategory || "",
      topic: topic || "",
      topicName: topic || "",
      subject: topic || "",
      keywords: tags,
      keywordsRaw: keywords,
      question,
      options,
      answer: options[correctIdx] || answer || options[0],
      correctAnswer: options[correctIdx] || answer || options[0],
      correct_index: correctIdx,
      difficulty: diffNorm,
      hindiExplanation: hindiExplanation || "",
      englishExplanation: englishExplanation || "",
      explanation: hindiExplanation || englishExplanation || "",
      language: langNorm,
      questionType: "MCQ",
    });
  }

  return results;
}

// Create an empty standard 14-column spreadsheet row
export function createEmptyRow(mainCategory = "", subCategory = "") {
  return {
    mainCategory: mainCategory || "",
    subCategory: subCategory || "",
    category: subCategory || mainCategory || "",
    topic: "",
    topicName: "",
    subject: "",
    keywords: [],
    keywordsRaw: "",
    question: "",
    options: ["", "", "", ""],
    answer: "",
    correctAnswer: "",
    correct_index: 0,
    difficulty: "easy",
    hindiExplanation: "",
    englishExplanation: "",
    explanation: "",
    language: "hi",
    questionType: "MCQ",
  };
}

// Generate N default empty rows for the Excel spreadsheet
export function createDefaultRows(count = 20, mainCategory = "", subCategory = "") {
  return Array.from({ length: count }, () => createEmptyRow(mainCategory, subCategory));
}

// Format ISO date to readable string: e.g. "06 Oct 2026, 04:30 PM"
function formatDateTime(dateVal) {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

// Check if set was created within the last 7 days
function isSetNew(setObj) {
  if (!setObj?.createdAt) return false;
  try {
    const time = new Date(setObj.createdAt).getTime();
    if (isNaN(time)) return false;
    return Date.now() - time <= 7 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

// Native Microsoft Excel (.xlsx) export using SheetJS - 100% UTF-8 Unicode compliant
// Renders Hindi (Devanagari) script perfectly without Mojibake / encoding errors in Excel
async function exportQuestionsToExcel(questions, filename, defaultCategory = "") {
  try {
    const XLSX = await import("xlsx");
    const headers = [
      "Main Category",
      "Sub category",
      "Topic name",
      "Keywords/tags",
      "Question",
      "Option A",
      "Option B",
      "Option C",
      "Option D",
      "Correct Answer",
      "Difficulty",
      "Hindi Explanation",
      "English Explanation",
      "Language",
    ];

    const rows = questions.map((q) => {
      const opts = Array.isArray(q.options) ? q.options : [];
      const correctIdx = typeof q.correct_index === "number" ? q.correct_index : 0;
      const ansText = q.correctAnswer || opts[correctIdx] || opts[0] || "";
      const tagsStr = Array.isArray(q.tags)
        ? q.tags.join(", ")
        : Array.isArray(q.keywords)
        ? q.keywords.join(", ")
        : "";

      const isHindi = /[\u0900-\u097F]/.test(q.text || q.question || "");
      const hindiExp = q.hindiExplanation || q.explanation_hi || (q.language === "hi" || isHindi ? q.explanation : "") || "";
      const englishExp = q.englishExplanation || q.explanation_en || (q.language === "en" || !isHindi ? q.explanation : "") || "";
      const langStr = q.language ? (q.language === "hi" ? "Hindi" : "English") : (isHindi ? "Hindi" : "English");

      return {
        "Main Category": q.masterCategory || defaultCategory || "India GK",
        "Sub category": q.category || q.subcategory || q.subCategory || "",
        "Topic name": q.topic || q.topicName || "",
        "Keywords/tags": tagsStr,
        "Question": q.text || q.text_en || q.question || "",
        "Option A": opts[0] || "",
        "Option B": opts[1] || "",
        "Option C": opts[2] || "",
        "Option D": opts[3] || "",
        "Correct Answer": ansText,
        "Difficulty": (q.difficulty || "Easy").charAt(0).toUpperCase() + (q.difficulty || "Easy").slice(1),
        "Hindi Explanation": hindiExp,
        "English Explanation": englishExp,
        "Language": langStr,
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
    // Optimal column widths for Excel
    ws["!cols"] = [
      { wch: 16 }, // Main Category
      { wch: 20 }, // Sub category
      { wch: 22 }, // Topic name
      { wch: 25 }, // Keywords/tags
      { wch: 45 }, // Question
      { wch: 20 }, // Option A
      { wch: 20 }, // Option B
      { wch: 20 }, // Option C
      { wch: 20 }, // Option D
      { wch: 18 }, // Correct Answer
      { wch: 12 }, // Difficulty
      { wch: 40 }, // Hindi Explanation
      { wch: 40 }, // English Explanation
      { wch: 12 }, // Language
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    const xlsxFilename = filename.endsWith(".xlsx") ? filename : filename.replace(/\.[^.]+$/, "") + ".xlsx";
    XLSX.writeFile(wb, xlsxFilename);
    return true;
  } catch (err) {
    console.error("Excel export error:", err);
    throw err;
  }
}

// Fallback RFC 4180 compliant CSV export with explicit byte-order-mark (0xEF, 0xBB, 0xBF)
function exportQuestionsToCSV(questions, filename, defaultCategory = "") {
  const headers = [
    "Main Category",
    "Sub category",
    "Topic name",
    "Keywords/tags",
    "Question",
    "Option A",
    "Option B",
    "Option C",
    "Option D",
    "Correct Answer",
    "Difficulty",
    "Hindi Explanation",
    "English Explanation",
    "Language",
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = questions.map((q) => {
    const opts = Array.isArray(q.options) ? q.options : [];
    const correctIdx = typeof q.correct_index === "number" ? q.correct_index : 0;
    const ansText = q.correctAnswer || opts[correctIdx] || opts[0] || "";
    const tagsStr = Array.isArray(q.tags)
      ? q.tags.join(", ")
      : Array.isArray(q.keywords)
      ? q.keywords.join(", ")
      : "";

    const isHindi = /[\u0900-\u097F]/.test(q.text || q.question || "");
    const hindiExp = q.hindiExplanation || q.explanation_hi || (q.language === "hi" || isHindi ? q.explanation : "") || "";
    const englishExp = q.englishExplanation || q.explanation_en || (q.language === "en" || !isHindi ? q.explanation : "") || "";
    const langStr = q.language ? (q.language === "hi" ? "Hindi" : "English") : (isHindi ? "Hindi" : "English");

    return [
      escapeCSV(q.masterCategory || defaultCategory || "India GK"),
      escapeCSV(q.category || q.subcategory || q.subCategory || ""),
      escapeCSV(q.topic || q.topicName || ""),
      escapeCSV(tagsStr),
      escapeCSV(q.text || q.text_en || q.question || ""),
      escapeCSV(opts[0] || ""),
      escapeCSV(opts[1] || ""),
      escapeCSV(opts[2] || ""),
      escapeCSV(opts[3] || ""),
      escapeCSV(ansText),
      escapeCSV((q.difficulty || "Easy").charAt(0).toUpperCase() + (q.difficulty || "Easy").slice(1)),
      escapeCSV(hindiExp),
      escapeCSV(englishExp),
      escapeCSV(langStr),
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\r\n");
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const encoder = new TextEncoder();
  const csvBytes = encoder.encode(csvContent);
  const blob = new Blob([bom, csvBytes], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : filename.replace(/\.[^.]+$/, "") + ".csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function SetManagerModal({
  isOpen,
  onClose,
  initialCategory,
  allCategories = [],
  onRefresh,
  initialTab = "review",
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'review' | 'paste'
  const [selectedCatId, setSelectedCatId] = useState(initialCategory?.id || "");
  const [selectedSubCatId, setSelectedSubCatId] = useState("");
  const [sets, setSets] = useState([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [expandedSetId, setExpandedSetId] = useState(null);
  const [setSearchQuery, setSetSearchQuery] = useState("");

  // Multi-selection state for bulk actions
  const [selectedSetIds, setSelectedSetIds] = useState(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Drag-and-drop state for reordering
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Paste / Excel Spreadsheet Tab State
  const [pasteRaw, setPasteRaw] = useState("");
  const [parsedRows, setParsedRows] = useState([]);
  const [targetCatId, setTargetCatId] = useState(initialCategory?.id || "");
  const [targetSubCatId, setTargetSubCatId] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pasteAreaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Question editing state
  const [editingQId, setEditingQId] = useState(null);
  const [editingQForm, setEditingQForm] = useState(null);
  const [isSavingQ, setIsSavingQ] = useState(false);

  // Set-level tags editing state
  const [tagEditSet, setTagEditSet] = useState(null);
  const [tagInput, setTagInput] = useState("");
  const [isSavingTags, setIsSavingTags] = useState(false);

  // Filtered sets for quick search
  const filteredSets = useMemo(() => {
    if (!setSearchQuery || !setSearchQuery.trim()) return sets;
    const q = setSearchQuery.toLowerCase().trim();
    return sets.filter(s =>
      (s.title && s.title.toLowerCase().includes(q)) ||
      (s.titleHi && s.titleHi.toLowerCase().includes(q)) ||
      (s.subCategoryName && s.subCategoryName.toLowerCase().includes(q))
    );
  }, [sets, setSearchQuery]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      const catId = initialCategory?.id || allCategories[0]?.id || "";
      setSelectedCatId(catId);
      setTargetCatId(catId);
      setActiveTab(initialTab || "review");
      setSetSearchQuery("");

      const catName = initialCategory?.topic || allCategories.find(c => c.id === catId)?.topic || "";
      setParsedRows(prev => {
        if (prev && prev.length > 0) return prev;
        return createDefaultRows(20, catName, "");
      });
    }
  }, [isOpen, initialCategory, initialTab, allCategories]);

  // Ensure Excel rows exist whenever activeTab is paste
  useEffect(() => {
    if (isOpen && activeTab === "paste" && (!parsedRows || parsedRows.length === 0)) {
      const catName = allCategories.find(c => c.id === targetCatId)?.topic || "";
      const subName = allCategories.find(c => c.id === targetSubCatId)?.topic || "";
      setParsedRows(createDefaultRows(20, catName, subName));
    }
  }, [isOpen, activeTab, parsedRows, targetCatId, targetSubCatId, allCategories]);

  // Find sub-categories of the selected category
  const availableSubCategories = useMemo(() => {
    if (!selectedCatId) return [];
    return allCategories.filter(c => c.parentId === selectedCatId);
  }, [selectedCatId, allCategories]);

  const targetSubCategories = useMemo(() => {
    if (!targetCatId) return [];
    return allCategories.filter(c => c.parentId === targetCatId);
  }, [targetCatId, allCategories]);

  // Load existing sets whenever selected category changes
  const loadSets = async (catId, subId) => {
    if (!catId && !subId) return;
    setLoadingSets(true);
    try {
      let url = `/api/admin/sets?categoryId=${catId}`;
      if (subId) url += `&subCategoryId=${subId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.sets) {
        setSets(data.sets);
      } else {
        setSets([]);
      }
    } catch (err) {
      console.error("Error loading sets:", err);
      toast.error("Failed to load sets");
    } finally {
      setLoadingSets(false);
    }
  };

  useEffect(() => {
    if (isOpen && (selectedCatId || selectedSubCatId)) {
      loadSets(selectedCatId, selectedSubCatId);
    }
  }, [isOpen, selectedCatId, selectedSubCatId]);

  // Handle Clipboard Paste
  const handlePasteText = (text) => {
    setPasteRaw(text);
    const parsed = parseExcelData(text);
    if (parsed.length > 0) {
      setParsedRows(parsed);
      toast.success(`Parsed ${parsed.length} questions from Excel!`);

      // Auto-detect target main category & subcategory if present in parsed rows
      const detectedMain = (parsed[0]?.mainCategory || "").trim();
      const detectedSub = (parsed[0]?.subCategory || parsed[0]?.category || "").trim();

      let matchedMainId = targetCatId;
      if (detectedMain) {
        const matchedMain = allCategories.find(
          c => !c.parentId && c.topic.toLowerCase().trim() === detectedMain.toLowerCase()
        );
        if (matchedMain) {
          matchedMainId = matchedMain.id;
          setTargetCatId(matchedMain.id);
        }
      }

      if (detectedSub && matchedMainId) {
        const clean = (s) => String(s || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
        const targetClean = clean(detectedSub);
        const matchedSub = allCategories.find(
          c => c.parentId === matchedMainId && (clean(c.topic) === targetClean || clean(c.name) === targetClean || clean(c.slug) === targetClean)
        );
        if (matchedSub) {
          setTargetSubCatId(matchedSub.id);
        }
      }
    } else {
      toast.error("Could not parse rows. Make sure you copied tabular Excel data.");
    }
  };

  const handlePasteEvent = (e) => {
    const text = e.clipboardData.getData("text/plain");
    if (text) {
      e.preventDefault();
      handlePasteText(text);
    }
  };

  const handleReadClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handlePasteText(text);
      } else {
        toast.error("Clipboard is empty");
      }
    } catch (err) {
      toast.error("Clipboard permission denied. Please paste manually into the box.");
    }
  };

  // Toggle Hide / Unhide for a set
  const handleToggleHideSet = async (setObj) => {
    const newStatus = setObj.status === "hidden" ? "published" : "hidden";
    try {
      const res = await fetch("/api/admin/sets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setId: setObj._id, status: newStatus }),
      });
      if (res.ok) {
        setSets(prev =>
          prev.map(s => (s._id === setObj._id ? { ...s, status: newStatus } : s))
        );
        toast.success(newStatus === "hidden" ? "Set hidden" : "Set published");
      } else {
        toast.error("Failed to update set status");
      }
    } catch (err) {
      toast.error("Error updating set status");
    }
  };

  // Delete Set
  const handleDeleteSet = async (setObj) => {
    if (!window.confirm(`Delete ${setObj.title} (${setObj.questionCount} questions)?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/sets?setId=${setObj._id}&deleteQuestions=true`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`${setObj.title} deleted successfully!`);
        setSets(prev => prev.filter(s => s._id !== setObj._id));
        setSelectedSetIds(prev => {
          const next = new Set(prev);
          next.delete(setObj._id);
          return next;
        });
        if (onRefresh) onRefresh();
      } else {
        toast.error("Failed to delete set");
      }
    } catch (err) {
      toast.error("Error deleting set");
    }
  };

  // Toggle selection for a single set
  const toggleSelectSet = (setId) => {
    setSelectedSetIds((prev) => {
      const next = new Set(prev);
      if (next.has(setId)) next.delete(setId);
      else next.add(setId);
      return next;
    });
  };

  // Select all or deselect all
  const handleSelectAll = () => {
    if (selectedSetIds.size === sets.length && sets.length > 0) {
      setSelectedSetIds(new Set());
    } else {
      setSelectedSetIds(new Set(sets.map((s) => s._id)));
    }
  };

  // Bulk Delete Selected Sets
  const handleDeleteSelected = async () => {
    if (selectedSetIds.size === 0) return;
    const count = selectedSetIds.size;
    const selectedSetsList = sets.filter((s) => selectedSetIds.has(s._id));
    const totalQuestions = selectedSetsList.reduce((acc, s) => acc + (s.questionCount || 0), 0);

    const confirmMsg = `Are you sure you want to delete ${count} selected set(s) (${totalQuestions} questions)?\n\nThis will permanently delete these sets and their questions from the database.`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      const res = await fetch("/api/admin/sets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setIds: Array.from(selectedSetIds),
          deleteQuestions: true,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `Deleted ${count} sets successfully!`);
        setSets((prev) => prev.filter((s) => !selectedSetIds.has(s._id)));
        setSelectedSetIds(new Set());
        if (onRefresh) onRefresh();
      } else {
        toast.error(data.error || "Failed to delete selected sets");
      }
    } catch (err) {
      console.error("Bulk delete error:", err);
      toast.error("Error deleting selected sets");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const selectedTotalQuestions = useMemo(() => {
    if (selectedSetIds.size === 0) return 0;
    return sets
      .filter((s) => selectedSetIds.has(s._id))
      .reduce((acc, s) => acc + (s.questionCount || 0), 0);
  }, [selectedSetIds, sets]);

  // Clear selections when changing category, subcategory, or activeTab
  useEffect(() => {
    setSelectedSetIds(new Set());
  }, [selectedCatId, selectedSubCatId, activeTab]);

  // Start editing a question
  const handleStartEditQ = (q) => {
    const opts = Array.isArray(q.options) ? q.options : ["", "", "", ""];
    const tagsStr = Array.isArray(q.tags)
      ? q.tags.join(", ")
      : Array.isArray(q.keywords)
      ? q.keywords.join(", ")
      : "";

    setEditingQId(q._id);
    setEditingQForm({
      text: q.text || q.question || "",
      optA: opts[0] || "",
      optB: opts[1] || "",
      optC: opts[2] || "",
      optD: opts[3] || "",
      correct_index: typeof q.correct_index === "number" ? q.correct_index : 0,
      difficulty: (q.difficulty || "easy").toLowerCase(),
      tags: tagsStr,
      subject: q.subject || q.subjectName || "",
      topic: q.topic || q.topicName || "",
    });
  };

  // Save question updates
  const handleSaveQuestion = async (setId) => {
    if (!editingQForm || !editingQId) return;
    setIsSavingQ(true);
    try {
      const opts = [editingQForm.optA, editingQForm.optB, editingQForm.optC, editingQForm.optD];
      const tagsList = editingQForm.tags
        ? editingQForm.tags.split(/[,،]+/).map(t => t.trim()).filter(Boolean)
        : [];

      const res = await fetch("/api/admin/sets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setId,
          questionUpdates: {
            _id: editingQId,
            text: editingQForm.text,
            options: opts,
            correct_index: editingQForm.correct_index,
            difficulty: editingQForm.difficulty,
            tags: tagsList,
            subject: editingQForm.subject,
            topic: editingQForm.topic,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Question and tags updated successfully!");
        setSets(prev =>
          prev.map(s => {
            if (s._id !== setId) return s;
            return {
              ...s,
              questions: (s.questions || []).map(q => {
                if (q._id !== editingQId) return q;
                return {
                  ...q,
                  text: editingQForm.text,
                  options: opts,
                  correct_index: editingQForm.correct_index,
                  correctAnswer: opts[editingQForm.correct_index] || "",
                  difficulty: editingQForm.difficulty,
                  tags: tagsList,
                  subject: editingQForm.subject,
                  topic: editingQForm.topic,
                };
              }),
            };
          })
        );
        setEditingQId(null);
        setEditingQForm(null);
        if (onRefresh) onRefresh();
      } else {
        toast.error(data.error || "Failed to update question");
      }
    } catch (err) {
      console.error("Save question error:", err);
      toast.error("Network error while updating question");
    } finally {
      setIsSavingQ(false);
    }
  };

  // Open set tags editor
  const handleOpenSetTags = (setObj) => {
    const existingTags = Array.isArray(setObj.tags)
      ? setObj.tags.join(", ")
      : (setObj.questions || []).flatMap(q => q.tags || []).filter(Boolean);
    const uniqueTags = Array.from(new Set(existingTags)).join(", ");

    setTagEditSet(setObj);
    setTagInput(uniqueTags);
  };

  // Save tags for entire set
  const handleSaveSetTags = async () => {
    if (!tagEditSet) return;
    setIsSavingTags(true);
    try {
      const tagsList = tagInput.split(/[,،]+/).map(t => t.trim()).filter(Boolean);
      const res = await fetch("/api/admin/sets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setId: tagEditSet._id,
          setTags: tagsList,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Set tags updated successfully!");
        setSets(prev =>
          prev.map(s => {
            if (s._id !== tagEditSet._id) return s;
            return {
              ...s,
              tags: tagsList,
              questions: (s.questions || []).map(q => ({
                ...q,
                tags: tagsList,
              })),
            };
          })
        );
        setTagEditSet(null);
        setTagInput("");
        if (onRefresh) onRefresh();
      } else {
        toast.error(data.error || "Failed to update set tags");
      }
    } catch (err) {
      console.error("Save set tags error:", err);
      toast.error("Network error while updating set tags");
    } finally {
      setIsSavingTags(false);
    }
  };

  // Drag and drop handlers to reposition sets
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...sets];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, movedItem);

    // Update setIndex sequentially
    const updatedSets = reordered.map((s, idx) => ({
      ...s,
      setIndex: idx + 1,
      title: `Set ${idx + 1}`,
      titleHi: `सेट ${idx + 1}`,
    }));

    setSets(updatedSets);
    setDraggedIndex(null);
    setDragOverIndex(null);

    try {
      const res = await fetch("/api/admin/sets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reorder: true,
          orderedSetIds: updatedSets.map((s) => s._id),
        }),
      });
      if (res.ok) {
        toast.success("Sets reordered and saved successfully!");
        if (onRefresh) onRefresh();
      } else {
        toast.error("Failed to persist new set order");
      }
    } catch (err) {
      console.error("Error reordering sets:", err);
      toast.error("Network error while reordering sets");
    }
  };

  // Excel Export: Single Set (.xlsx)
  const handleExportSet = async (setObj) => {
    const questions = setObj.questions || [];
    if (questions.length === 0) {
      toast.error("No questions found in this set to export");
      return;
    }
    const catName = allCategories.find((c) => c.id === selectedCatId)?.topic || "Category";
    const safeCatName = catName.replace(/[^a-zA-Z0-9_\u0900-\u097F-]/g, "_");
    const filename = `${safeCatName}_Set_${setObj.setIndex}.xlsx`;
    try {
      await exportQuestionsToExcel(questions, filename, catName);
      toast.success(`Exported ${setObj.title} to Excel (.xlsx)!`);
    } catch (err) {
      console.error("Excel export error:", err);
      toast.error("Failed to export set to Excel");
    }
  };

  // Excel Export: All Sets in Category (.xlsx)
  const handleExportAllSets = async () => {
    if (sets.length === 0) {
      toast.error("No sets available to export");
      return;
    }
    const catName = allCategories.find((c) => c.id === selectedCatId)?.topic || "Category";
    const allQuestions = [];
    sets.forEach((s) => {
      (s.questions || []).forEach((q) => {
        allQuestions.push({
          ...q,
          topic: q.topic || s.title || `Set ${s.setIndex}`,
        });
      });
    });

    if (allQuestions.length === 0) {
      toast.error("No questions found in existing sets to export");
      return;
    }

    const safeCatName = catName.replace(/[^a-zA-Z0-9_\u0900-\u097F-]/g, "_");
    const filename = `${safeCatName}_All_${sets.length}_Sets.xlsx`;
    try {
      await exportQuestionsToExcel(allQuestions, filename, catName);
      toast.success(`Exported ${allQuestions.length} questions across ${sets.length} sets to Excel (.xlsx)!`);
    } catch (err) {
      console.error("Excel export error:", err);
      toast.error("Failed to export all sets to Excel");
    }
  };

  // Change target category and propagate to empty rows if needed
  const handleTargetCatChange = (newCatId) => {
    setTargetCatId(newCatId);
    setTargetSubCatId("");
    const newCatObj = allCategories.find((c) => c.id === newCatId);
    const newCatName = newCatObj?.topic || "";
    setParsedRows((prev) =>
      prev.map((r) => {
        if (!r.question || !r.question.trim()) {
          return { ...r, mainCategory: newCatName, subCategory: "", category: newCatName };
        }
        return r;
      })
    );
  };

  // Change target subcategory and propagate to empty rows if needed
  const handleTargetSubCatChange = (newSubId) => {
    setTargetSubCatId(newSubId);
    const subObj = targetSubCategories.find((s) => s.id === newSubId);
    const subName = subObj?.topic || "";
    setParsedRows((prev) =>
      prev.map((r) => {
        if (!r.question || !r.question.trim()) {
          return { ...r, subCategory: subName, category: subName || r.mainCategory };
        }
        return r;
      })
    );
  };

  // Apply selected category and subcategory across all rows
  const handleApplyCategoryToAllRows = () => {
    const catName = allCategories.find((c) => c.id === targetCatId)?.topic || "";
    const subName = targetSubCategories.find((s) => s.id === targetSubCatId)?.topic || "";
    setParsedRows((prev) =>
      prev.map((r) => ({
        ...r,
        mainCategory: catName,
        subCategory: subName,
        category: subName || catName,
      }))
    );
    toast.success(`Applied ${catName}${subName ? ` > ${subName}` : ""} to all ${parsedRows.length} rows!`);
  };

  // Add empty rows to spreadsheet
  const handleAddRows = (count = 1) => {
    const catName = allCategories.find((c) => c.id === targetCatId)?.topic || "";
    const subName = targetSubCategories.find((s) => s.id === targetSubCatId)?.topic || "";
    setParsedRows((prev) => [...prev, ...createDefaultRows(count, catName, subName)]);
    toast.success(`Added ${count} row${count > 1 ? "s" : ""} to spreadsheet`);
  };

  // Reset entire spreadsheet to 20 empty rows
  const handleClearGrid = () => {
    if (window.confirm("Clear all rows in this spreadsheet and reset with 20 empty rows?")) {
      const catName = allCategories.find((c) => c.id === targetCatId)?.topic || "";
      const subName = targetSubCategories.find((s) => s.id === targetSubCatId)?.topic || "";
      setParsedRows(createDefaultRows(20, catName, subName));
      setPasteRaw("");
      toast.success("Spreadsheet reset with 20 empty rows");
    }
  };

  // Update tags / keywords for a row
  const updateParsedKeywords = (index, value) => {
    setParsedRows((prev) => {
      const copy = [...prev];
      if (!copy[index]) return prev;
      copy[index] = {
        ...copy[index],
        keywordsRaw: value,
        keywords: value ? value.split(/[,،;|]+/).map((t) => t.trim()).filter(Boolean) : [],
      };
      return copy;
    });
  };

  // Intercept paste in cells or table to parse multi-cell / multi-row tabular Excel data
  const handleCellPaste = (e) => {
    const text = e.clipboardData?.getData("text/plain");
    if (text && (text.includes("\t") || text.includes("\n"))) {
      e.preventDefault();
      e.stopPropagation();
      handlePasteText(text);
    }
  };

  // Handle uploading .xlsx, .xls, or .csv file
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const tsv = XLSX.utils.sheet_to_csv(worksheet, { FS: "\t" });
      handlePasteText(tsv);
      toast.success(`Imported ${file.name} successfully!`);
    } catch (err) {
      console.error("Excel import error:", err);
      toast.error("Failed to read Excel file. Please check format.");
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  // Download standard 14-column sample Excel template
  const handleDownloadTemplate = async () => {
    try {
      const XLSX = await import("xlsx");
      const catName = allCategories.find((c) => c.id === targetCatId)?.topic || "India GK";
      const sampleData = [
        {
          "Main Category": catName || "India GK",
          "Sub category": "India History",
          "Topic name": "Ancient India",
          "Keywords/tags": "Indus Valley, Lothal, Harappa",
          "Question": "सिंधु घाटी सभ्यता का प्रमुख बंदरगाह कौन सा था?",
          "Option A": "कालीबंगन",
          "Option B": "लोथल",
          "Option C": "रोपड़",
          "Option D": "मोहनजोदड़ो",
          "Correct Answer": "B",
          "Difficulty": "Medium",
          "Hindi Explanation": "लोथल गुजरात के भाल क्षेत्र में स्थित प्राचीन सिंधु घाटी सभ्यता का एक प्रमुख बंदरगाह शहर था।",
          "English Explanation": "Lothal was one of the southernmost major port cities of the ancient Indus Valley Civilization located in Gujarat.",
          "Language": "Hindi",
        },
        {
          "Main Category": catName || "India GK",
          "Sub category": "India Geography",
          "Topic name": "Rivers & Lakes",
          "Keywords/tags": "Ganga, Himalayas, Longest River",
          "Question": "Which is the longest river flowing entirely within India?",
          "Option A": "Ganga",
          "Option B": "Godavari",
          "Option C": "Krishna",
          "Option D": "Narmada",
          "Correct Answer": "A",
          "Difficulty": "Easy",
          "Hindi Explanation": "गंगा भारत की सबसे लंबी नदी है, जो गंगोत्री हिमनद से निकलती है।",
          "English Explanation": "The Ganga is the longest river flowing entirely within India, originating from the Gangotri glacier.",
          "Language": "English",
        },
      ];
      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Questions");
      XLSX.writeFile(wb, "Questions_14_Columns_Template.xlsx");
      toast.success("Excel template downloaded!");
    } catch (err) {
      console.error("Template download error:", err);
      toast.error("Failed to download template");
    }
  };

  // Export current filled questions in spreadsheet to Excel (.xlsx)
  const handleExportGridToExcel = async () => {
    const validRows = parsedRows.filter((r) => r.question && r.question.trim().length > 0);
    if (validRows.length === 0) {
      toast.error("No filled questions in grid to export");
      return;
    }
    try {
      const XLSX = await import("xlsx");
      const catName = allCategories.find((c) => c.id === targetCatId)?.topic || "Category";
      const dataToExport = validRows.map((r) => ({
        "Main Category": r.mainCategory || catName,
        "Sub category": r.subCategory || "",
        "Topic name": r.topicName || r.topic || "",
        "Keywords/tags": Array.isArray(r.keywords) ? r.keywords.join(", ") : r.keywordsRaw || "",
        "Question": r.question || "",
        "Option A": r.options?.[0] || "",
        "Option B": r.options?.[1] || "",
        "Option C": r.options?.[2] || "",
        "Option D": r.options?.[3] || "",
        "Correct Answer": ["A", "B", "C", "D"][r.correct_index] || "A",
        "Difficulty": (r.difficulty || "Easy").charAt(0).toUpperCase() + (r.difficulty || "Easy").slice(1),
        "Hindi Explanation": r.hindiExplanation || "",
        "English Explanation": r.englishExplanation || "",
        "Language": r.language === "hi" ? "Hindi" : "English",
      }));
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Questions");
      XLSX.writeFile(wb, `${catName}_Questions_${validRows.length}.xlsx`);
      toast.success(`Exported ${validRows.length} questions to Excel!`);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export Excel file");
    }
  };

  // Save new set to DB (only saves rows with valid questions)
  const handleSaveNewSet = async () => {
    const validRows = parsedRows.filter((r) => r.question && r.question.trim().length > 0);

    if (validRows.length === 0) {
      toast.error("No questions to save. Please enter questions or paste Excel data.");
      return;
    }
    if (!targetCatId) {
      toast.error("Please select a target Category for this set.");
      return;
    }

    // Validate that each question has at least 2 options
    for (let i = 0; i < validRows.length; i++) {
      const r = validRows[i];
      const filledOpts = (r.options || []).filter((o) => o && o.trim().length > 0);
      if (filledOpts.length < 2) {
        toast.error(`Question in Row ${i + 1} must have at least 2 options.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const targetCategoryObj = allCategories.find((c) => c.id === targetCatId);
      let resolvedSubCatId = targetSubCatId;
      if (!resolvedSubCatId && validRows[0]?.subCategory && targetCatId) {
        const clean = (s) => String(s || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
        const targetClean = clean(validRows[0].subCategory);
        const autoSub = allCategories.find(
          (c) => c.parentId === targetCatId && (clean(c.topic) === targetClean || clean(c.name) === targetClean || clean(c.slug) === targetClean)
        );
        if (autoSub) resolvedSubCatId = autoSub.id;
      }
      const targetSubCategoryObj = allCategories.find((c) => c.id === resolvedSubCatId);

      const payload = {
        categoryId: targetCatId,
        subCategoryId: resolvedSubCatId || null,
        categoryName: targetCategoryObj?.topic || "",
        subCategoryName: targetSubCategoryObj?.topic || validRows[0]?.subCategory || "",
        title: customTitle.trim() || undefined,
        questions: validRows.map((r) => ({
          question: r.question,
          options: r.options,
          answer: r.options[r.correct_index] || r.answer || r.options[0],
          correctAnswer: r.options[r.correct_index] || r.answer || r.options[0],
          correct_index: r.correct_index,
          difficulty: r.difficulty || "easy",
          questionType: "MCQ",
          keywords: Array.isArray(r.keywords) ? r.keywords : r.keywords ? [r.keywords] : [],
          keywordsEn: Array.isArray(r.keywords) ? r.keywords.join(", ") : r.keywordsRaw || "",
          subCategory: r.subCategory || targetSubCategoryObj?.topic || "",
          category: r.subCategory || targetSubCategoryObj?.topic || targetCategoryObj?.topic || "",
          subject: r.topicName || r.topic || targetSubCategoryObj?.topic || "",
          topic: r.topicName || r.topic || targetSubCategoryObj?.topic || "",
          hindiExplanation: r.hindiExplanation || "",
          englishExplanation: r.englishExplanation || "",
          explanation: r.hindiExplanation || r.englishExplanation || r.explanation || "",
          explanation_hi: r.hindiExplanation || "",
          explanation_en: r.englishExplanation || "",
          language: r.language || (r.hindiExplanation ? "hi" : "en"),
        })),
      };

      const res = await fetch("/api/admin/sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `Set created with ${validRows.length} questions!`);
        const catName = targetCategoryObj?.topic || "";
        const subName = targetSubCategoryObj?.topic || "";
        setParsedRows(createDefaultRows(20, catName, subName));
        setPasteRaw("");
        setCustomTitle("");
        if (onRefresh) onRefresh();

        // Switch to Review tab and refresh sets
        setSelectedCatId(targetCatId);
        setSelectedSubCatId(resolvedSubCatId);
        setActiveTab("review");
        await loadSets(targetCatId, resolvedSubCatId);
      } else {
        toast.error(data.error || "Failed to create set");
      }
    } catch (err) {
      console.error("Error saving set:", err);
      toast.error("Network error while creating set");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Editable row cell helper
  const updateParsedRow = (index, field, value) => {
    setParsedRows((prev) => {
      const copy = [...prev];
      if (!copy[index]) return prev;
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const updateParsedOption = (rowIndex, optIndex, value) => {
    setParsedRows((prev) => {
      const copy = [...prev];
      if (!copy[rowIndex]) return prev;
      const newOpts = [...(copy[rowIndex].options || ["", "", "", ""])];
      newOpts[optIndex] = value;
      copy[rowIndex].options = newOpts;
      if (copy[rowIndex].correct_index === optIndex) {
        copy[rowIndex].answer = value;
        copy[rowIndex].correctAnswer = value;
      }
      return copy;
    });
  };

  const removeParsedRow = (index) => {
    setParsedRows((prev) => {
      const next = prev.filter((_, i) => i !== index);
      const catName = allCategories.find((c) => c.id === targetCatId)?.topic || "";
      const subName = targetSubCategories.find((s) => s.id === targetSubCatId)?.topic || "";
      return next.length > 0 ? next : createDefaultRows(20, catName, subName);
    });
  };

  // Valid questions count
  const validQuestionsCount = useMemo(() => {
    return parsedRows.filter((r) => r.question && r.question.trim().length > 0).length;
  }, [parsedRows]);

  // Difficulty stats calculation for parsed rows
  const parsedDiffStats = useMemo(() => {
    let easy = 0, medium = 0, hard = 0, expert = 0;
    parsedRows.forEach((r) => {
      if (!r.question || !r.question.trim()) return;
      if (r.difficulty === "expert") expert++;
      else if (r.difficulty === "hard") hard++;
      else if (r.difficulty === "medium") medium++;
      else easy++;
    });
    return { easy, medium, hard, expert };
  }, [parsedRows]);

  if (!isOpen) return null;

  const currentCategoryName = allCategories.find(c => c.id === selectedCatId)?.topic || "Category";

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        {/* Full Page Navigation Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <button type="button" className={styles.backBtn} onClick={onClose} title="Back to Categories (Esc)">
              ← Back to Categories
            </button>
            <div className={styles.headerIcon}>📦</div>
            <div className={styles.titleArea}>
              <h2 className={styles.modalTitle}>
                Set Studio: <span className={styles.targetBadge}>{currentCategoryName}</span>
              </h2>
              <p className={styles.modalSubtitle}>
                Review existing sets, edit questions, or manage 20-question sets in Excel spreadsheet format
              </p>
            </div>
          </div>

          {/* Center Tabs Switcher */}
          <div className={styles.tabsGroup}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === "review" ? styles.tabBtnActive : ""}`}
              onClick={() => setActiveTab("review")}
            >
              📑 Existing Sets
              <span className={styles.tabBadge}>{sets.length}</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === "paste" ? styles.tabBtnActive : ""}`}
              onClick={() => setActiveTab("paste")}
            >
              📊 Excel Spreadsheet (14 Columns)
              {validQuestionsCount > 0 && <span className={styles.tabBadge}>{validQuestionsCount} Qs</span>}
            </button>
          </div>

          <div className={styles.headerRight}>
            <span className={styles.fullScreenBadge}>🖥️ Full Page View</span>
            <button type="button" className={styles.closeFullBtn} onClick={onClose} title="Close Set Studio (Esc)">
              ✕ Close (Esc)
            </button>
          </div>
        </div>

        {/* Sub-header Filter Toolbar (when in Review tab) */}
        {activeTab === "review" && (
          <div className={styles.filterBar}>
            <div className={styles.filterLeft}>
              <div className={styles.searchBox}>
                <span>🔍</span>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search sets by title or topic..."
                  value={setSearchQuery}
                  onChange={(e) => setSetSearchQuery(e.target.value)}
                />
                {setSearchQuery && (
                  <button
                    type="button"
                    className={styles.clearSearchBtn}
                    onClick={() => setSetSearchQuery("")}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className={styles.catSelectGroup}>
                <label className={styles.filterLabel}>Category:</label>
                <select
                  className={styles.catSelect}
                  value={selectedCatId}
                  onChange={(e) => {
                    setSelectedCatId(e.target.value);
                    setSelectedSubCatId("");
                  }}
                >
                  {allCategories.filter(c => !c.parentId).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.topic} ({c.questionCount || 0} Qs)
                    </option>
                  ))}
                </select>
              </div>

              {availableSubCategories.length > 0 && (
                <div className={styles.catSelectGroup}>
                  <label className={styles.filterLabel}>Sub-category:</label>
                  <select
                    className={styles.catSelect}
                    value={selectedSubCatId}
                    onChange={(e) => setSelectedSubCatId(e.target.value)}
                  >
                    <option value="">All Subcategories</option>
                    {availableSubCategories.map(s => (
                      <option key={s.id} value={s.id}>
                        ↳ {s.topic} ({s.questionCount || 0} Qs)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className={styles.filterRight}>
              <span className={styles.totalSetsMeta}>
                <strong>{filteredSets.length}</strong> {filteredSets.length === 1 ? "Set" : "Sets"}
              </span>
              <button
                type="button"
                className={styles.exportAllBtn}
                onClick={handleExportAllSets}
                disabled={sets.length === 0}
                title="Export all sets in this category to Excel (.xlsx)"
              >
                📥 Export All Sets (.xlsx)
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {/* TAB 1: Existing Sets Review */}
          {activeTab === "review" && (
            <div className={styles.setsList}>
              {loadingSets ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  ⏳ Loading sets data...
                </div>
              ) : sets.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 16px", color: "#64748b" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>📭</div>
                  <h3 style={{ margin: "0 0 6px 0", color: "#0f172a" }}>No Sets Created Yet</h3>
                  <p style={{ margin: 0, fontSize: "0.85rem" }}>
                    Switch to &ldquo;Excel Spreadsheet (14 Columns)&rdquo; above to quickly add your first 20-question set!
                  </p>
                  <button
                    type="button"
                    className={styles.submitBtn}
                    style={{ marginTop: "16px" }}
                    onClick={() => setActiveTab("paste")}
                  >
                    + Paste & Create Set Now
                  </button>
                </div>
              ) : (
                <>
                  {/* Bulk Selection Bar */}
                  <div className={styles.bulkActionBar}>
                    <div className={styles.bulkActionLeft}>
                      <label className={styles.selectAllLabel}>
                        <input
                          type="checkbox"
                          className={styles.bulkCheckbox}
                          checked={sets.length > 0 && selectedSetIds.size === sets.length}
                          onChange={handleSelectAll}
                          disabled={isBulkDeleting}
                        />
                        <span className={styles.selectAllText}>
                          {selectedSetIds.size === sets.length && sets.length > 0 ? "Deselect All" : "Select All"}
                          <span className={styles.totalBadge}>({sets.length} Sets)</span>
                        </span>
                      </label>

                      {selectedSetIds.size > 0 && (
                        <span className={styles.selectedCounter}>
                          Selected: <strong>{selectedSetIds.size}</strong> of {sets.length} sets ({selectedTotalQuestions} Qs)
                        </span>
                      )}
                    </div>

                    {selectedSetIds.size > 0 && (
                      <div className={styles.bulkActionRight}>
                        <button
                          type="button"
                          className={styles.bulkDeselectBtn}
                          onClick={() => setSelectedSetIds(new Set())}
                          disabled={isBulkDeleting}
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          className={styles.bulkDeleteBtn}
                          onClick={handleDeleteSelected}
                          disabled={isBulkDeleting}
                        >
                          {isBulkDeleting ? (
                            <span>⏳ Deleting {selectedSetIds.size} sets...</span>
                          ) : (
                            <span>🗑️ Delete Selected ({selectedSetIds.size})</span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {filteredSets.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "36px 16px", color: "#64748b", background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                      <p style={{ margin: 0, fontSize: "0.9rem" }}>No sets matching &ldquo;{setSearchQuery}&rdquo;</p>
                      <button
                        type="button"
                        onClick={() => setSetSearchQuery("")}
                        style={{ marginTop: "8px", background: "none", border: "none", color: "#4f46e5", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem" }}
                      >
                        Clear search
                      </button>
                    </div>
                  ) : (
                    filteredSets.map((setObj, idx) => {
                      const isExpanded = expandedSetId === setObj._id;
                      const diff = setObj.difficultyBreakdown || {};
                      const isNew = isSetNew(setObj);
                      const isSelected = selectedSetIds.has(setObj._id);

                      return (
                        <div
                          key={setObj._id || idx}
                          className={`${styles.setCard} ${setObj.status === "hidden" ? styles.setCardHidden : ""} ${isSelected ? styles.setCardSelected : ""} ${draggedIndex === idx ? styles.isDragging : ""} ${dragOverIndex === idx ? styles.dragOver : ""}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDrop={(e) => handleDrop(e, idx)}
                          onDragEnd={handleDragEnd}
                        >
                          <div
                            className={styles.setHeader}
                            onClick={() => setExpandedSetId(isExpanded ? null : setObj._id)}
                          >
                            {/* Tier 1: Main Line */}
                            <div className={styles.setHeaderMain}>
                              <div className={styles.headerLeftGroup}>
                                <input
                                  type="checkbox"
                                  className={styles.setCardCheckbox}
                                  checked={isSelected}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    toggleSelectSet(setObj._id);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  title="Select this set"
                                />

                                <div
                                  className={styles.dragHandle}
                                  title="Drag to reposition this set"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  ⋮⋮
                                </div>

                                <div className={styles.setIndexBadge}>#{setObj.setIndex}</div>

                                <span className={styles.setName}>{setObj.title}</span>

                                {isNew && (
                                  <span className={styles.badgeNew} title="Added within last 7 days">
                                    ✨ NEW
                                  </span>
                                )}
                              </div>

                              <div className={styles.headerRightGroup}>
                                <span
                                  className={setObj.status === "hidden" ? styles.statusHidden : styles.statusPublished}
                                >
                                  {setObj.status === "hidden" ? "🙈 Hidden" : "🟢 Published"}
                                </span>

                                <div className={styles.setActions} onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    className={styles.actionBtn}
                                    onClick={() => handleOpenSetTags(setObj)}
                                    title="Edit tags for this set and all its questions"
                                  >
                                    🏷️ Tags
                                  </button>

                                  <button
                                    type="button"
                                    className={styles.exportBtn}
                                    onClick={() => handleExportSet(setObj)}
                                    title="Export this set into Excel (.xlsx)"
                                  >
                                    📥 Excel
                                  </button>

                                  <button
                                    type="button"
                                    className={styles.actionBtn}
                                    onClick={() => handleToggleHideSet(setObj)}
                                    title={setObj.status === "hidden" ? "Unhide this set" : "Hide this set"}
                                  >
                                    {setObj.status === "hidden" ? "👁️ Unhide" : "🙈 Hide"}
                                  </button>

                                  <button
                                    type="button"
                                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                    onClick={() => handleDeleteSet(setObj)}
                                    title="Delete set"
                                  >
                                    🗑️
                                  </button>

                                  <button
                                    type="button"
                                    className={styles.viewQsBtn}
                                    onClick={() => setExpandedSetId(isExpanded ? null : setObj._id)}
                                  >
                                    {isExpanded ? "▴ Hide" : `▾ View ${setObj.questionCount} Qs`}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Tier 2: Meta Sub-bar */}
                            <div className={styles.setHeaderMeta}>
                              <div className={styles.metaLeft}>
                                {setObj.titleHi && <span className={styles.setNameHi}>🇮🇳 {setObj.titleHi}</span>}
                                {setObj.createdAt && (
                                  <span
                                    className={styles.dateTimeMeta}
                                    title={`Created: ${formatDateTime(setObj.createdAt)}`}
                                  >
                                    🕒 {formatDateTime(setObj.createdAt)}
                                  </span>
                                )}
                              </div>

                              <div className={styles.metaRight}>
                                <div className={styles.diffStats}>
                                  <span className={styles.diffEasy}>● {diff.easy || 0} Easy</span>
                                  <span className={styles.diffMedium}>● {diff.medium || 0} Med</span>
                                  <span className={styles.diffHard}>● {diff.hard || 0} Hard</span>
                                  {diff.expert > 0 && <span className={styles.diffExpert}>● {diff.expert} Expert</span>}
                                </div>

                                <span className={styles.qCountBadge}>
                                  {setObj.questionCount} Questions
                                </span>
                              </div>
                            </div>
                          </div>

                      {/* Expanded Question List */}
                      {isExpanded && (
                        <div className={styles.questionsList}>
                          {setObj.questions?.map((q, qIdx) => {
                            const isEditingThisQ = editingQId === q._id;

                            return (
                              <div key={q._id || qIdx} className={styles.questionItem}>
                                {isEditingThisQ ? (
                                  /* Inline Question Edit Form */
                                  <div className={styles.editQForm}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                      <span className={styles.questionNumber}>Editing Q{qIdx + 1}</span>
                                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                        Select the radio button next to the correct answer
                                      </span>
                                    </div>

                                    <div>
                                      <label style={{ fontSize: "0.76rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: 3 }}>
                                        Question Text:
                                      </label>
                                      <textarea
                                        rows={2}
                                        className={styles.editQTextarea}
                                        value={editingQForm.text}
                                        onChange={(e) => setEditingQForm({ ...editingQForm, text: e.target.value })}
                                      />
                                    </div>

                                    {/* 4 Options Grid with Correct Answer selection */}
                                    <div className={styles.editOptionsGrid}>
                                      {["A", "B", "C", "D"].map((optLetter, optIdx) => {
                                        const fieldKey = `opt${optLetter}`;
                                        const isSelected = editingQForm.correct_index === optIdx;

                                        return (
                                          <div
                                            key={optLetter}
                                            className={`${styles.editOptionRow} ${isSelected ? styles.editOptionRowCorrect : ""}`}
                                          >
                                            <input
                                              type="radio"
                                              name={`correct_${q._id}`}
                                              id={`correct_${q._id}_${optIdx}`}
                                              checked={isSelected}
                                              onChange={() => setEditingQForm({ ...editingQForm, correct_index: optIdx })}
                                              className={styles.correctRadio}
                                            />
                                            <label
                                              htmlFor={`correct_${q._id}_${optIdx}`}
                                              style={{ fontWeight: 800, fontSize: "0.8rem", color: isSelected ? "#15803d" : "#475569", cursor: "pointer" }}
                                            >
                                              {optLetter}:
                                            </label>
                                            <input
                                              type="text"
                                              className={styles.editOptionInput}
                                              value={editingQForm[fieldKey]}
                                              onChange={(e) => setEditingQForm({ ...editingQForm, [fieldKey]: e.target.value })}
                                              placeholder={`Option ${optLetter}`}
                                            />
                                            {isSelected && (
                                              <span style={{ fontSize: "0.7rem", color: "#16a34a", fontWeight: 700 }}>
                                                ✓ Correct
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Meta Row: Difficulty, Tags, Subject/Topic */}
                                    <div className={styles.editMetaRow}>
                                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                        <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748b" }}>Difficulty:</label>
                                        <select
                                          className={styles.editSelect}
                                          value={editingQForm.difficulty}
                                          onChange={(e) => setEditingQForm({ ...editingQForm, difficulty: e.target.value })}
                                        >
                                          <option value="easy">Easy</option>
                                          <option value="medium">Medium</option>
                                          <option value="hard">Hard</option>
                                          <option value="expert">Expert</option>
                                        </select>
                                      </div>

                                      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 200 }}>
                                        <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748b" }}>
                                          🏷️ Tags / Keywords (comma separated):
                                        </label>
                                        <input
                                          type="text"
                                          className={styles.editInput}
                                          value={editingQForm.tags}
                                          onChange={(e) => setEditingQForm({ ...editingQForm, tags: e.target.value })}
                                          placeholder="e.g. UPSC, SSC, Ancient India, Indus Valley"
                                        />
                                      </div>

                                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                        <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748b" }}>Subject / Topic:</label>
                                        <input
                                          type="text"
                                          className={styles.editInput}
                                          value={editingQForm.subject || editingQForm.topic}
                                          onChange={(e) => setEditingQForm({ ...editingQForm, subject: e.target.value, topic: e.target.value })}
                                          placeholder="e.g. History"
                                          style={{ width: 130 }}
                                        />
                                      </div>
                                    </div>

                                    {/* Actions */}
                                    <div className={styles.editActions}>
                                      <button
                                        type="button"
                                        className={styles.saveQBtn}
                                        disabled={isSavingQ}
                                        onClick={() => handleSaveQuestion(setObj._id)}
                                      >
                                        {isSavingQ ? "Saving..." : "💾 Save Question & Tags"}
                                      </button>
                                      <button
                                        type="button"
                                        className={styles.cancelQBtn}
                                        onClick={() => {
                                          setEditingQId(null);
                                          setEditingQForm(null);
                                        }}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Normal Question Display with Edit Button */
                                  <>
                                    <div className={styles.questionTop}>
                                      <span className={styles.questionNumber}>Q{qIdx + 1}</span>
                                      <span className={styles.questionText}>{q.text}</span>
                                      <div className={styles.questionMeta}>
                                        <button
                                          type="button"
                                          className={styles.editQBtn}
                                          onClick={() => handleStartEditQ(q)}
                                          title="Edit this question, options, answer, and tags"
                                        >
                                          ✏️ Edit
                                        </button>
                                        <span
                                          className={
                                            q.difficulty === "hard"
                                              ? styles.diffHard
                                              : q.difficulty === "medium"
                                              ? styles.diffMedium
                                              : styles.diffEasy
                                          }
                                        >
                                          {q.difficulty}
                                        </span>
                                        {q.type && <span className={styles.metaTag}>{q.type}</span>}
                                        {q.subject && <span className={styles.metaTag}>{q.subject}</span>}
                                      </div>
                                    </div>

                                    {/* Question Tags Chips */}
                                    {Array.isArray(q.tags) && q.tags.length > 0 && (
                                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", margin: "-2px 0 4px 0" }}>
                                        {q.tags.map((t, tIdx) => (
                                          <span key={tIdx} className={styles.tagChip}>
                                            🏷️ {t}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    <div className={styles.optionsGrid}>
                                      {(q.options || []).map((opt, optIdx) => {
                                        const isCorrect =
                                          optIdx === q.correct_index ||
                                          opt.trim().toLowerCase() === (q.correctAnswer || "").trim().toLowerCase();

                                        return (
                                          <div
                                            key={optIdx}
                                            className={`${styles.optionCard} ${isCorrect ? styles.optionCardCorrect : ""}`}
                                          >
                                            <span>
                                              <strong>{["A", "B", "C", "D"][optIdx]}:</strong> {opt}
                                            </span>
                                            {isCorrect && <span className={styles.correctIcon}>✓ Correct</span>}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }))}
              </>
            )}
          </div>
        )}

          {/* TAB 2: Excel Spreadsheet Grid (Row & Column format) */}
          {activeTab === "paste" && (
            <div className={styles.pasteContainer}>
              {/* Target Category & Title Config */}
              <div className={styles.targetConfigRow}>
                <div className={styles.targetFields}>
                  <div className={styles.fieldGroup}>
                    <label>Main Category:</label>
                    <select
                      value={targetCatId}
                      onChange={(e) => handleTargetCatChange(e.target.value)}
                    >
                      <option value="">-- Select Category --</option>
                      {allCategories.filter((c) => !c.parentId).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.topic}
                        </option>
                      ))}
                    </select>
                  </div>

                  {targetSubCategories.length > 0 && (
                    <div className={styles.fieldGroup}>
                      <label>Sub-category:</label>
                      <select
                        value={targetSubCatId}
                        onChange={(e) => handleTargetSubCatChange(e.target.value)}
                      >
                        <option value="">None (Add to Main Category)</option>
                        {targetSubCategories.map((s) => (
                          <option key={s.id} value={s.id}>
                            ↳ {s.topic}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className={styles.fieldGroup}>
                    <label>Custom Set Title (Optional):</label>
                    <input
                      type="text"
                      placeholder="e.g. Set 1 (Auto-assigned if empty)"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.applyCatBtn}
                  onClick={handleApplyCategoryToAllRows}
                  title="Apply the selected category and subcategory to all rows in the spreadsheet"
                >
                  ⚡ Apply Category to All Rows
                </button>
              </div>

              {/* Excel Ribbon Toolbar */}
              <div className={styles.excelRibbon}>
                <div className={styles.ribbonLeft}>
                  <span className={styles.excelBadge}>📊 Excel Grid (14 Cols)</span>

                  <button
                    type="button"
                    className={`${styles.ribbonBtn} ${styles.ribbonBtnPrimary}`}
                    onClick={handleReadClipboard}
                    title="Paste tabular Excel data directly from system clipboard (or press Ctrl + V)"
                  >
                    📋 Paste from Clipboard (Ctrl + V)
                  </button>

                  <button
                    type="button"
                    className={styles.ribbonBtn}
                    onClick={() => fileInputRef.current?.click()}
                    title="Import questions directly from an Excel file (.xlsx, .xls, .csv)"
                  >
                    📂 Import .xlsx / .csv
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                  />

                  <button
                    type="button"
                    className={styles.ribbonBtn}
                    onClick={() => handleAddRows(1)}
                    title="Add 1 empty row to spreadsheet"
                  >
                    ➕ +1 Row
                  </button>

                  <button
                    type="button"
                    className={styles.ribbonBtn}
                    onClick={() => handleAddRows(20)}
                    title="Add 20 empty rows (1 full set)"
                  >
                    ➕ +20 Rows
                  </button>

                  <button
                    type="button"
                    className={styles.ribbonBtn}
                    onClick={handleDownloadTemplate}
                    title="Download official 14-column Excel template"
                  >
                    📥 Download Template
                  </button>

                  <button
                    type="button"
                    className={styles.ribbonBtn}
                    onClick={handleExportGridToExcel}
                    disabled={validQuestionsCount === 0}
                    title="Download current filled questions as Excel file"
                  >
                    💾 Export Grid (.xlsx)
                  </button>

                  <button
                    type="button"
                    className={styles.ribbonBtn}
                    onClick={handleClearGrid}
                    title="Clear all rows and reset to 20 blank rows"
                  >
                    🧹 Reset Grid
                  </button>
                </div>

                <div className={styles.ribbonRight}>
                  <span className={validQuestionsCount >= 20 ? styles.countStatusOk : styles.countStatusWarn}>
                    {validQuestionsCount >= 20
                      ? `✅ ${validQuestionsCount} Qs (${Math.ceil(validQuestionsCount / 20)} Sets)`
                      : validQuestionsCount > 0
                      ? `⚠️ ${validQuestionsCount}/20 Qs`
                      : `📝 0/20 Qs Filled`}
                  </span>

                  {validQuestionsCount > 0 && (
                    <div className={styles.diffStatsGroup}>
                      <span className={styles.diffEasyChip}>{parsedDiffStats.easy} Easy</span>
                      <span className={styles.diffMedChip}>{parsedDiffStats.medium} Med</span>
                      <span className={styles.diffHardChip}>{parsedDiffStats.hard} Hard</span>
                      {parsedDiffStats.expert > 0 && (
                        <span className={styles.diffExpertChip}>{parsedDiffStats.expert} Expert</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 14-Column Excel Spreadsheet Grid */}
              <div className={styles.tableWrapper} onPaste={handleCellPaste}>
                <table className={styles.excelTable}>
                  <thead>
                    <tr>
                      <th className={`${styles.excelTh} ${styles.cornerHeader}`}>
                        <span className={styles.thColLetter}>#</span>
                        <span className={styles.thColName}>Row</span>
                      </th>
                      <th className={styles.excelTh} style={{ minWidth: "130px", width: "130px" }}>
                        <span className={styles.thColLetter}>Col A</span>
                        <span className={styles.thColName}>Main Category</span>
                      </th>
                      <th className={styles.excelTh} style={{ minWidth: "130px", width: "130px" }}>
                        <span className={styles.thColLetter}>Col B</span>
                        <span className={styles.thColName}>Sub Category</span>
                      </th>
                      <th className={styles.excelTh} style={{ minWidth: "120px", width: "120px" }}>
                        <span className={styles.thColLetter}>Col C</span>
                        <span className={styles.thColName}>Topic Name</span>
                      </th>
                      <th className={styles.excelTh} style={{ minWidth: "130px", width: "130px" }}>
                        <span className={styles.thColLetter}>Col D</span>
                        <span className={styles.thColName}>Keywords / Tags</span>
                      </th>
                      <th className={styles.excelTh} style={{ minWidth: "280px", width: "300px" }}>
                        <span className={styles.thColLetter}>Col E</span>
                        <span className={styles.thColName}>
                          Question <span className={styles.reqStar}>*</span>
                        </span>
                      </th>
                      <th className={styles.excelTh} style={{ minWidth: "125px", width: "125px" }}>
                        <span className={styles.thColLetter}>Col F</span>
                        <span className={styles.thColName}>
                          Option A <span className={styles.reqStar}>*</span>
                        </span>
                      </th>
                      <th className={styles.excelTh} style={{ minWidth: "125px", width: "125px" }}>
                        <span className={styles.thColLetter}>Col G</span>
                        <span className={styles.thColName}>
                          Option B <span className={styles.reqStar}>*</span>
                        </span>
                      </th>
                      <th className={styles.excelTh} style={{ minWidth: "125px", width: "125px" }}>
                        <span className={styles.thColLetter}>Col H</span>
                        <span className={styles.thColName}>
                          Option C <span className={styles.reqStar}>*</span>
                        </span>
                      </th>
                      <th className={styles.excelTh} style={{ minWidth: "125px", width: "125px" }}>
                        <span className={styles.thColLetter}>Col I</span>
                        <span className={styles.thColName}>
                          Option D <span className={styles.reqStar}>*</span>
                        </span>
                      </th>
                      <th className={styles.excelTh} style={{ minWidth: "135px", width: "135px" }}>
                        <span className={styles.thColLetter}>Col J</span>
                        <span className={styles.thColName}>
                          Correct Answer <span className={styles.reqStar}>*</span>
                        </span>
                      </th>
                      <th className={styles.excelTh} style={{ minWidth: "95px", width: "95px" }}>
                        <span className={styles.thColLetter}>Col K</span>
                        <span className={styles.thColName}>Difficulty</span>
                      </th>
                      <th className={styles.excelTh} style={{ minWidth: "160px", width: "170px" }}>
                        <span className={styles.thColLetter}>Col L</span>
                        <span className={styles.thColName}>Hindi Explanation</span>
                      </th>
                      <th className={styles.excelTh} style={{ minWidth: "160px", width: "170px" }}>
                        <span className={styles.thColLetter}>Col M</span>
                        <span className={styles.thColName}>English Explanation</span>
                      </th>
                      <th className={styles.excelTh} style={{ minWidth: "85px", width: "85px" }}>
                        <span className={styles.thColLetter}>Col N</span>
                        <span className={styles.thColName}>Language</span>
                      </th>
                      <th className={styles.excelTh} style={{ width: "38px", minWidth: "38px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, idx) => {
                      const isRowValid = !!(
                        row.question &&
                        row.question.trim().length > 0 &&
                        (row.options || []).filter(Boolean).length >= 2
                      );
                      const isRowPartial = !!(
                        row.question &&
                        row.question.trim().length > 0 &&
                        !isRowValid
                      );

                      return (
                        <tr
                          key={idx}
                          className={`${styles.excelTr} ${isRowValid ? styles.excelTrValid : ""}`}
                        >
                          {/* Row Number */}
                          <td className={styles.rowNumberCell}>
                            <span
                              className={
                                isRowValid
                                  ? styles.statusDotValid
                                  : isRowPartial
                                  ? styles.statusDotWarn
                                  : styles.statusDotEmpty
                              }
                              title={
                                isRowValid
                                  ? "Valid question"
                                  : isRowPartial
                                  ? "Requires at least 2 options"
                                  : "Empty row"
                              }
                            />
                            <span>{idx + 1}</span>
                          </td>

                          {/* Col A: Main Category */}
                          <td className={styles.excelTd}>
                            <input
                              className={styles.excelInput}
                              value={row.mainCategory || ""}
                              onChange={(e) => updateParsedRow(idx, "mainCategory", e.target.value)}
                              onPaste={handleCellPaste}
                              placeholder="Main Category"
                            />
                          </td>

                          {/* Col B: Sub Category */}
                          <td className={styles.excelTd}>
                            <input
                              className={styles.excelInput}
                              value={row.subCategory || ""}
                              onChange={(e) => updateParsedRow(idx, "subCategory", e.target.value)}
                              onPaste={handleCellPaste}
                              placeholder="Sub Category"
                            />
                          </td>

                          {/* Col C: Topic name */}
                          <td className={styles.excelTd}>
                            <input
                              className={styles.excelInput}
                              value={row.topicName || row.topic || ""}
                              onChange={(e) => {
                                updateParsedRow(idx, "topic", e.target.value);
                                updateParsedRow(idx, "topicName", e.target.value);
                              }}
                              onPaste={handleCellPaste}
                              placeholder="Topic"
                            />
                          </td>

                          {/* Col D: Keywords / tags */}
                          <td className={styles.excelTd}>
                            <input
                              className={styles.excelInput}
                              value={
                                row.keywordsRaw ??
                                (Array.isArray(row.keywords) ? row.keywords.join(", ") : "")
                              }
                              onChange={(e) => updateParsedKeywords(idx, e.target.value)}
                              onPaste={handleCellPaste}
                              placeholder="tag1, tag2..."
                            />
                          </td>

                          {/* Col E: Question statement */}
                          <td className={styles.excelTd}>
                            <input
                              className={`${styles.excelInput} ${styles.questionInput}`}
                              value={row.question || ""}
                              onChange={(e) => updateParsedRow(idx, "question", e.target.value)}
                              onPaste={handleCellPaste}
                              placeholder="Enter question statement..."
                            />
                          </td>

                          {/* Col F: Option A */}
                          <td className={styles.excelTd}>
                            <input
                              className={styles.excelInput}
                              value={row.options?.[0] || ""}
                              onChange={(e) => updateParsedOption(idx, 0, e.target.value)}
                              onPaste={handleCellPaste}
                              placeholder="Option A"
                            />
                          </td>

                          {/* Col G: Option B */}
                          <td className={styles.excelTd}>
                            <input
                              className={styles.excelInput}
                              value={row.options?.[1] || ""}
                              onChange={(e) => updateParsedOption(idx, 1, e.target.value)}
                              onPaste={handleCellPaste}
                              placeholder="Option B"
                            />
                          </td>

                          {/* Col H: Option C */}
                          <td className={styles.excelTd}>
                            <input
                              className={styles.excelInput}
                              value={row.options?.[2] || ""}
                              onChange={(e) => updateParsedOption(idx, 2, e.target.value)}
                              onPaste={handleCellPaste}
                              placeholder="Option C"
                            />
                          </td>

                          {/* Col I: Option D */}
                          <td className={styles.excelTd}>
                            <input
                              className={styles.excelInput}
                              value={row.options?.[3] || ""}
                              onChange={(e) => updateParsedOption(idx, 3, e.target.value)}
                              onPaste={handleCellPaste}
                              placeholder="Option D"
                            />
                          </td>

                          {/* Col J: Correct Answer */}
                          <td className={styles.excelTd}>
                            <select
                              className={styles.excelSelect}
                              value={typeof row.correct_index === "number" ? row.correct_index : 0}
                              onChange={(e) => {
                                const cIdx = parseInt(e.target.value, 10);
                                updateParsedRow(idx, "correct_index", cIdx);
                                updateParsedRow(idx, "answer", row.options?.[cIdx] || "");
                                updateParsedRow(idx, "correctAnswer", row.options?.[cIdx] || "");
                              }}
                            >
                              <option value={0}>
                                A: {row.options?.[0] ? row.options[0].slice(0, 14) : "Opt A"}
                              </option>
                              <option value={1}>
                                B: {row.options?.[1] ? row.options[1].slice(0, 14) : "Opt B"}
                              </option>
                              <option value={2}>
                                C: {row.options?.[2] ? row.options[2].slice(0, 14) : "Opt C"}
                              </option>
                              <option value={3}>
                                D: {row.options?.[3] ? row.options[3].slice(0, 14) : "Opt D"}
                              </option>
                            </select>
                          </td>

                          {/* Col K: Difficulty */}
                          <td className={styles.excelTd}>
                            <select
                              className={styles.excelSelect}
                              value={row.difficulty || "easy"}
                              onChange={(e) => updateParsedRow(idx, "difficulty", e.target.value)}
                            >
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                              <option value="expert">Expert</option>
                            </select>
                          </td>

                          {/* Col L: Hindi Explanation */}
                          <td className={styles.excelTd}>
                            <input
                              className={styles.excelInput}
                              value={row.hindiExplanation || ""}
                              onChange={(e) => updateParsedRow(idx, "hindiExplanation", e.target.value)}
                              onPaste={handleCellPaste}
                              placeholder="हिंदी व्याख्या..."
                            />
                          </td>

                          {/* Col M: English Explanation */}
                          <td className={styles.excelTd}>
                            <input
                              className={styles.excelInput}
                              value={row.englishExplanation || ""}
                              onChange={(e) => updateParsedRow(idx, "englishExplanation", e.target.value)}
                              onPaste={handleCellPaste}
                              placeholder="English explanation..."
                            />
                          </td>

                          {/* Col N: Language */}
                          <td className={styles.excelTd}>
                            <select
                              className={styles.excelSelect}
                              value={row.language || "hi"}
                              onChange={(e) => updateParsedRow(idx, "language", e.target.value)}
                            >
                              <option value="hi">Hindi</option>
                              <option value="en">English</option>
                            </select>
                          </td>

                          {/* Delete button */}
                          <td className={styles.excelTd} style={{ textAlign: "center", padding: "0 4px" }}>
                            <button
                              type="button"
                              className={styles.removeRowBtn}
                              onClick={() => removeParsedRow(idx)}
                              title="Delete this row"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Hint Banner */}
              <div className={styles.hintBanner}>
                <span>💡</span>
                <span>
                  <strong>Excel Tip:</strong> You can copy rows or tables directly from Microsoft Excel or Google Sheets and press <strong>Ctrl + V</strong> anywhere inside this spreadsheet to populate rows automatically.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={styles.modalFooter}>
          <div className={styles.footerLeft}>
            {activeTab === "paste" && (
              validQuestionsCount > 0 ? (
                <span>
                  💡 Ready to create{" "}
                  <strong>
                    {Math.ceil(validQuestionsCount / 20)}{" "}
                    {Math.ceil(validQuestionsCount / 20) > 1 ? "Sets" : "Set"}
                  </strong>{" "}
                  ({validQuestionsCount} questions, 20 Qs each) for{" "}
                  <strong>{currentCategoryName}</strong>.
                </span>
              ) : (
                <span>
                  ✍️ Enter questions in the Excel spreadsheet rows above or click <strong>Paste from Clipboard</strong>.
                </span>
              )
            )}
          </div>

          <div className={styles.footerRight}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Close
            </button>

            {activeTab === "paste" && (
              <button
                type="button"
                className={styles.submitBtn}
                disabled={validQuestionsCount === 0 || isSubmitting}
                onClick={handleSaveNewSet}
              >
                {isSubmitting
                  ? "⏳ Creating Sets..."
                  : validQuestionsCount > 20
                  ? `🚀 Create ${Math.ceil(validQuestionsCount / 20)} Sets (${validQuestionsCount} Qs)`
                  : validQuestionsCount > 0
                  ? `🚀 Save & Create Set (${validQuestionsCount} Qs)`
                  : "🚀 Save & Create Set"}
              </button>
            )}
          </div>
        </div>

        {/* Set Tags Modal */}
        {tagEditSet && (
          <div className={styles.overlay} style={{ zIndex: 10001 }} onClick={() => setTagEditSet(null)}>
            <div className={styles.modal} style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
                  🏷️ Edit Tags for {tagEditSet.title || `Set #${tagEditSet.setIndex}`}
                </h3>
                <button className={styles.closeBtn} onClick={() => setTagEditSet(null)}>✕</button>
              </div>
              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ margin: 0, fontSize: "0.84rem", color: "#64748b" }}>
                  Tags entered here will be applied to this set and all questions inside it. Use comma to separate multiple tags (e.g. <code>UPSC, SSC, Ancient India, Rivers</code>).
                </p>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                    Tags / Keywords:
                  </label>
                  <input
                    type="text"
                    className={styles.editInput}
                    style={{ width: "100%", fontSize: "0.9rem" }}
                    placeholder="e.g. UPSC, SSC, Modern History, Economy"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setTagEditSet(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.submitBtn}
                  disabled={isSavingTags}
                  onClick={handleSaveSetTags}
                >
                  {isSavingTags ? "Saving..." : "💾 Save Tags"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
