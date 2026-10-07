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
      mainCategory: mainCategory || "India GK",
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

// RFC 4180 compliant CSV export with UTF-8 BOM (\uFEFF) for Microsoft Excel
// Standard 14 Columns matching user's template exactly
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

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
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

  // Multi-selection state for bulk actions
  const [selectedSetIds, setSelectedSetIds] = useState(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Drag-and-drop state for reordering
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Paste Tab State
  const [pasteRaw, setPasteRaw] = useState("");
  const [parsedRows, setParsedRows] = useState([]);
  const [targetCatId, setTargetCatId] = useState(initialCategory?.id || "");
  const [targetSubCatId, setTargetSubCatId] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pasteAreaRef = useRef(null);

  // Question editing state
  const [editingQId, setEditingQId] = useState(null);
  const [editingQForm, setEditingQForm] = useState(null);
  const [isSavingQ, setIsSavingQ] = useState(false);

  // Set-level tags editing state
  const [tagEditSet, setTagEditSet] = useState(null);
  const [tagInput, setTagInput] = useState("");
  const [isSavingTags, setIsSavingTags] = useState(false);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      const catId = initialCategory?.id || allCategories[0]?.id || "";
      setSelectedCatId(catId);
      setTargetCatId(catId);
      setActiveTab(initialTab || "review");
    }
  }, [isOpen, initialCategory, initialTab]);

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
        const matchedSub = allCategories.find(
          c => c.parentId === matchedMainId && c.topic.toLowerCase().trim() === detectedSub.toLowerCase()
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

  // Excel Export: Single Set
  const handleExportSet = (setObj) => {
    const questions = setObj.questions || [];
    if (questions.length === 0) {
      toast.error("No questions found in this set to export");
      return;
    }
    const catName = allCategories.find((c) => c.id === selectedCatId)?.topic || "Category";
    const safeCatName = catName.replace(/[^a-zA-Z0-9_\u0900-\u097F-]/g, "_");
    const filename = `${safeCatName}_Set_${setObj.setIndex}.csv`;
    exportQuestionsToCSV(questions, filename, catName);
    toast.success(`Exported ${setObj.title} to Excel!`);
  };

  // Excel Export: All Sets in Category
  const handleExportAllSets = () => {
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
    const filename = `${safeCatName}_All_${sets.length}_Sets.csv`;
    exportQuestionsToCSV(allQuestions, filename, catName);
    toast.success(`Exported ${allQuestions.length} questions across ${sets.length} sets to Excel!`);
  };

  // Save new set to DB
  const handleSaveNewSet = async () => {
    if (parsedRows.length === 0) {
      toast.error("No questions to save. Paste your Excel data first.");
      return;
    }
    if (!targetCatId) {
      toast.error("Please select a target Category for this set.");
      return;
    }

    setIsSubmitting(true);
    try {
      const targetCategoryObj = allCategories.find(c => c.id === targetCatId);
      const targetSubCategoryObj = allCategories.find(c => c.id === targetSubCatId);

      const payload = {
        categoryId: targetCatId,
        subCategoryId: targetSubCatId || null,
        categoryName: targetCategoryObj?.topic || "",
        subCategoryName: targetSubCategoryObj?.topic || "",
        title: customTitle.trim() || undefined,
        questions: parsedRows.map(r => ({
          question: r.question,
          options: r.options,
          answer: r.options[r.correct_index] || r.answer || r.options[0],
          correctAnswer: r.options[r.correct_index] || r.answer || r.options[0],
          correct_index: r.correct_index,
          difficulty: r.difficulty,
          questionType: "MCQ",
          keywords: Array.isArray(r.keywords) ? r.keywords : (r.keywords ? [r.keywords] : []),
          keywordsEn: Array.isArray(r.keywords) ? r.keywords.join(", ") : (r.keywordsRaw || ""),
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
        toast.success(data.message || "Set created successfully!");
        setParsedRows([]);
        setPasteRaw("");
        setCustomTitle("");
        if (onRefresh) onRefresh();

        // Switch to Review tab and refresh sets
        setSelectedCatId(targetCatId);
        setSelectedSubCatId(targetSubCatId);
        setActiveTab("review");
        await loadSets(targetCatId, targetSubCatId);
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
    setParsedRows(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const updateParsedOption = (rowIndex, optIndex, value) => {
    setParsedRows(prev => {
      const copy = [...prev];
      const newOpts = [...copy[rowIndex].options];
      newOpts[optIndex] = value;
      copy[rowIndex].options = newOpts;
      // if correct_index was this option, update answer text too
      if (copy[rowIndex].correct_index === optIndex) {
        copy[rowIndex].answer = value;
      }
      return copy;
    });
  };

  const removeParsedRow = (index) => {
    setParsedRows(prev => prev.filter((_, i) => i !== index));
  };

  // Difficulty stats calculation for parsed rows
  const parsedDiffStats = useMemo(() => {
    let easy = 0, medium = 0, hard = 0, expert = 0;
    parsedRows.forEach(r => {
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
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>📦</div>
            <div className={styles.titleArea}>
              <h2 className={styles.modalTitle}>
                Set Manager: <span className={styles.targetBadge}>{currentCategoryName}</span>
              </h2>
              <p className={styles.modalSubtitle}>
                Review existing sets, edit questions, or paste 20-question sets directly from Excel
              </p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* Tab Bar */}
        <div className={styles.tabBar}>
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
              📋 Paste New Set from Excel
              {parsedRows.length > 0 && <span className={styles.tabBadge}>{parsedRows.length} Qs</span>}
            </button>
          </div>

          {/* Quick Category Filter when in Review tab */}
          {activeTab === "review" && (
            <div className={styles.filterBar}>
              <button
                type="button"
                className={styles.exportAllBtn}
                onClick={handleExportAllSets}
                disabled={sets.length === 0}
                title="Export all sets in this category to Excel (.csv)"
              >
                📥 Export All Sets
              </button>

              <span className={styles.filterLabel}>Category:</span>
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

              {availableSubCategories.length > 0 && (
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
              )}
            </div>
          )}
        </div>

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
                    Switch to &ldquo;Paste New Set from Excel&rdquo; above to quickly add your first 20-question set!
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

                  {sets.map((setObj, idx) => {
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
                          <div className={styles.setHeaderLeft}>
                            {/* Checkbox for individual set selection */}
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

                            {/* Drag handle */}
                            <div
                              className={styles.dragHandle}
                              title="Drag to reposition this set"
                              onClick={(e) => e.stopPropagation()}
                            >
                              ⋮⋮
                            </div>

                            <div className={styles.setIndexBadge}>#{setObj.setIndex}</div>

                          <div className={styles.setTitles}>
                            <div className={styles.setTitleRow}>
                              <span className={styles.setName}>{setObj.title}</span>
                              {isNew && (
                                <span className={styles.badgeNew} title="Added within last 7 days">
                                  ✨ NEW
                                </span>
                              )}
                            </div>
                            {setObj.titleHi && <span className={styles.setNameHi}>{setObj.titleHi}</span>}
                            {setObj.createdAt && (
                              <span
                                className={styles.dateTimeMeta}
                                title={`Created: ${formatDateTime(setObj.createdAt)}`}
                              >
                                🕒 {formatDateTime(setObj.createdAt)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className={styles.setHeaderRight}>
                          <div className={styles.diffStats}>
                            <span className={styles.diffEasy}>{diff.easy || 0} Easy</span>
                            <span className={styles.diffMedium}>{diff.medium || 0} Med</span>
                            <span className={styles.diffHard}>{diff.hard || 0} Hard</span>
                            {diff.expert > 0 && <span className={styles.diffExpert}>{diff.expert} Expert</span>}
                          </div>

                          <span className={styles.qCountBadge}>
                            {setObj.questionCount} Questions
                          </span>

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
                              style={{ color: "#4338ca", background: "#eef2ff", borderColor: "#c7d2fe" }}
                            >
                              🏷️ Tags
                            </button>

                            <button
                              type="button"
                              className={styles.exportBtn}
                              onClick={() => handleExportSet(setObj)}
                              title="Export this set into Excel (.csv)"
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
                              className={styles.actionBtn}
                              onClick={() => setExpandedSetId(isExpanded ? null : setObj._id)}
                            >
                              {isExpanded ? "▴ Hide Qs" : `▾ View ${setObj.questionCount} Qs`}
                            </button>
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
                })}
              </>
            )}
          </div>
        )}

          {/* TAB 2: Paste New Set from Excel */}
          {activeTab === "paste" && (
            <div className={styles.pasteContainer}>
              {/* Instructions */}
              <div className={styles.instructionBanner}>
                <div className={styles.bannerIcon}>📋</div>
                <div className={styles.bannerContent}>
                  <div className={styles.bannerTitle}>
                    Excel Copy-Paste 20 Questions Set Importer (Standard 14 Columns)
                  </div>
                  <p className={styles.bannerText}>
                    Copy rows directly from Excel in the standard 14-column format:
                    <br />
                    <code>Main Category · Sub category · Topic name · Keywords/tags · Question · Option A · Option B · Option C · Option D · Correct Answer · Difficulty · Hindi Explanation · English Explanation · Language</code>
                    <br />
                    Click inside the dashed area below or press <strong>Ctrl + V</strong> to populate the table automatically!
                  </p>
                </div>
              </div>

              {/* Target Category & Title Config */}
              <div className={styles.targetConfigRow}>
                <div className={styles.targetFields}>
                  <div className={styles.fieldGroup}>
                    <label>Main Category:</label>
                    <select
                      value={targetCatId}
                      onChange={(e) => {
                        setTargetCatId(e.target.value);
                        setTargetSubCatId("");
                      }}
                    >
                      <option value="">-- Select Category --</option>
                      {allCategories.filter(c => !c.parentId).map(c => (
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
                        onChange={(e) => setTargetSubCatId(e.target.value)}
                      >
                        <option value="">None (Add to Main Category)</option>
                        {targetSubCategories.map(s => (
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
                  className={styles.actionBtn}
                  onClick={handleReadClipboard}
                  title="Paste directly from clipboard"
                >
                  📋 Paste from Clipboard
                </button>
              </div>

              {/* Paste Zone */}
              {parsedRows.length === 0 ? (
                <div
                  className={styles.pasteDropzone}
                  onPaste={handlePasteEvent}
                  tabIndex={0}
                  ref={pasteAreaRef}
                >
                  <div className={styles.pasteDropzoneIcon}>📥</div>
                  <h4 className={styles.pasteDropzoneTitle}>
                    Click here and press Ctrl + V to Paste Excel Data
                  </h4>
                  <p className={styles.pasteDropzoneHint}>
                    Standard 14 columns: Main Category, Sub category, Topic name, Keywords/tags, Question, Option A, B, C, D, Correct Answer, Difficulty, Hindi Explanation, English Explanation, Language
                  </p>
                  <textarea
                    className={styles.hiddenTextarea}
                    placeholder="Paste Excel text here..."
                    value={pasteRaw}
                    onChange={(e) => handlePasteText(e.target.value)}
                  />
                </div>
              ) : (
                <>
                  {/* Parsed Stats Overview */}
                  <div className={styles.parsedStatsBar}>
                    <div className={styles.statsLeft}>
                      <span
                        className={
                          parsedRows.length >= 20 ? styles.countStatusOk : styles.countStatusWarn
                        }
                      >
                        {parsedRows.length > 20
                          ? `⚡ Bulk Upload: ${parsedRows.length} Questions ➔ Will create ${Math.ceil(parsedRows.length / 20)} Sets (20 Qs each)`
                          : parsedRows.length === 20
                          ? "✅ Complete Set: 20 Questions (1 Set)"
                          : `⚠️ Partial Set: ${parsedRows.length} Questions (1 Set)`}
                      </span>
                      <div className={styles.diffStats}>
                        <span className={styles.diffEasy}>{parsedDiffStats.easy} Easy</span>
                        <span className={styles.diffMedium}>{parsedDiffStats.medium} Med</span>
                        <span className={styles.diffHard}>{parsedDiffStats.hard} Hard</span>
                        {parsedDiffStats.expert > 0 && (
                          <span className={styles.diffExpert}>{parsedDiffStats.expert} Expert</span>
                        )}
                      </div>
                    </div>

                    <div className={styles.statsRight}>
                      <button
                        type="button"
                        className={styles.clearBtn}
                        onClick={() => {
                          setParsedRows([]);
                          setPasteRaw("");
                        }}
                      >
                        ✕ Clear & Re-paste
                      </button>
                    </div>
                  </div>

                  {/* Pre-formatted Editable Table matching Excel columns */}
                  <div className={styles.tableWrapper}>
                    <table className={styles.excelTable}>
                      <thead>
                        <tr>
                          <th style={{ width: "36px" }}>#</th>
                          <th style={{ minWidth: "220px" }}>Question</th>
                          <th style={{ minWidth: "115px" }}>Option A</th>
                          <th style={{ minWidth: "115px" }}>Option B</th>
                          <th style={{ minWidth: "115px" }}>Option C</th>
                          <th style={{ minWidth: "115px" }}>Option D</th>
                          <th style={{ minWidth: "135px" }}>Correct Answer</th>
                          <th style={{ minWidth: "85px" }}>Difficulty</th>
                          <th style={{ minWidth: "120px" }}>Topic / Tags</th>
                          <th style={{ minWidth: "140px" }}>Explanation</th>
                          <th style={{ minWidth: "55px" }}>Lang</th>
                          <th style={{ width: "36px" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.map((row, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 700, color: "#6366f1" }}>{idx + 1}</td>
                            <td>
                              <input
                                className={styles.cellInput}
                                value={row.question}
                                title={row.question}
                                onChange={(e) => updateParsedRow(idx, "question", e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className={styles.cellInput}
                                value={row.options[0] || ""}
                                title={row.options[0] || ""}
                                onChange={(e) => updateParsedOption(idx, 0, e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className={styles.cellInput}
                                value={row.options[1] || ""}
                                title={row.options[1] || ""}
                                onChange={(e) => updateParsedOption(idx, 1, e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className={styles.cellInput}
                                value={row.options[2] || ""}
                                title={row.options[2] || ""}
                                onChange={(e) => updateParsedOption(idx, 2, e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className={styles.cellInput}
                                value={row.options[3] || ""}
                                title={row.options[3] || ""}
                                onChange={(e) => updateParsedOption(idx, 3, e.target.value)}
                              />
                            </td>
                            <td>
                              <select
                                className={styles.diffSelect}
                                style={{
                                  background: "#f0fdf4",
                                  borderColor: "#86efac",
                                  fontWeight: 700,
                                  color: "#166534",
                                  maxWidth: "145px",
                                }}
                                value={row.correct_index}
                                onChange={(e) => {
                                  const cIdx = parseInt(e.target.value, 10);
                                  updateParsedRow(idx, "correct_index", cIdx);
                                  updateParsedRow(idx, "answer", row.options[cIdx] || "");
                                  updateParsedRow(idx, "correctAnswer", row.options[cIdx] || "");
                                }}
                              >
                                <option value={0}>A ({row.options[0]?.slice(0, 12) || "Opt A"})</option>
                                <option value={1}>B ({row.options[1]?.slice(0, 12) || "Opt B"})</option>
                                <option value={2}>C ({row.options[2]?.slice(0, 12) || "Opt C"})</option>
                                <option value={3}>D ({row.options[3]?.slice(0, 12) || "Opt D"})</option>
                              </select>
                            </td>
                            <td>
                              <select
                                className={styles.diffSelect}
                                value={row.difficulty}
                                onChange={(e) => updateParsedRow(idx, "difficulty", e.target.value)}
                              >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                                <option value="expert">Expert</option>
                              </select>
                            </td>
                            <td>
                              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                <input
                                  className={styles.cellInput}
                                  placeholder="Topic"
                                  value={row.topicName || row.topic || ""}
                                  onChange={(e) => {
                                    updateParsedRow(idx, "topic", e.target.value);
                                    updateParsedRow(idx, "topicName", e.target.value);
                                  }}
                                />
                                {Array.isArray(row.keywords) && row.keywords.length > 0 && (
                                  <span style={{ fontSize: "10px", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>
                                    🏷️ {row.keywords.join(", ")}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <input
                                className={styles.cellInput}
                                placeholder="Explanation..."
                                value={row.hindiExplanation || row.englishExplanation || row.explanation || ""}
                                title={row.hindiExplanation || row.englishExplanation || row.explanation || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateParsedRow(idx, "explanation", val);
                                  if (row.language === "hi") {
                                    updateParsedRow(idx, "hindiExplanation", val);
                                  } else {
                                    updateParsedRow(idx, "englishExplanation", val);
                                  }
                                }}
                              />
                            </td>
                            <td>
                              <span
                                style={{
                                  fontSize: "10.5px",
                                  fontWeight: 800,
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  background: row.language === "hi" ? "#fef3c7" : "#e0e7ff",
                                  color: row.language === "hi" ? "#92400e" : "#3730a3",
                                }}
                              >
                                {row.language?.toUpperCase() || "HI"}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className={styles.removeRowBtn}
                                onClick={() => removeParsedRow(idx)}
                                title="Delete row"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={styles.modalFooter}>
          <div className={styles.footerLeft}>
            {activeTab === "paste" && parsedRows.length > 0 && (
              <span>
                💡 Ready to create{" "}
                <strong>
                  {Math.ceil(parsedRows.length / 20)}{" "}
                  {Math.ceil(parsedRows.length / 20) > 1 ? "Sets" : "Set"}
                </strong>{" "}
                ({parsedRows.length} questions, 20 Qs each) for{" "}
                <strong>{currentCategoryName}</strong>.
              </span>
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
                disabled={parsedRows.length === 0 || isSubmitting}
                onClick={handleSaveNewSet}
              >
                {isSubmitting
                  ? "⏳ Creating Sets..."
                  : parsedRows.length > 20
                  ? `🚀 Create ${Math.ceil(parsedRows.length / 20)} Sets (${parsedRows.length} Qs)`
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
