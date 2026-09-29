"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminUpload.module.css";
import toast, { Toaster } from "react-hot-toast";
import CategorySearchSelect from "@/components/admin/CategorySearchSelect";
import {
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Download,
  Upload,
  ArrowRight,
  Sparkles,
  HelpCircle,
  PlusCircle,
  Database,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const DIFFICULTIES = ["easy", "medium", "hard", "expert"];

// Generate New GK Sample Template (.xlsx with 2 sheets)
async function generateGkSampleXlsx() {
  const XLSX = await import("xlsx");
  const questionsData = [
    {
      "Question": "सिंधु घाटी सभ्यता का प्रमुख बंदरगाह कौन सा था?",
      "Option A": "कालीबंगन",
      "Option B": "लोथल",
      "Option C": "रोपड़",
      "Option D": "मोहनजोदड़ो",
      "Correct Answer": "B",
      "Question Type": "Explore",
      "Master Category": "GK",
      "Category": "India GK",
      "Topic": "Ancient Indian History",
      "Difficulty": "Medium",
      "Explanation": "लोथल गुजरात के भाल क्षेत्र में स्थित प्राचीन सिंधु घाटी सभ्यता का एक प्रमुख बंदरगाह शहर था।",
      "Language": "hi",
      "Exam Tags": "SSC CGL, State PSC, Railway",
      "Sub Topic": "Indus Valley Civilization",
    },
    {
      "Question": "What is the capital city of France?",
      "Option A": "London",
      "Option B": "Berlin",
      "Option C": "Paris",
      "Option D": "Madrid",
      "Correct Answer": "C",
      "Question Type": "Explore",
      "Master Category": "GK",
      "Category": "World GK",
      "Topic": "World Geography",
      "Difficulty": "Easy",
      "Explanation": "Paris is the capital and largest city of France, situated on the Seine River.",
      "Language": "en",
      "Exam Tags": "SSC, Railway, UPSC",
      "Sub Topic": "European Capitals",
    },
    {
      "Question": "Which celestial body in our solar system has the highest count of confirmed moons?",
      "Option A": "Jupiter",
      "Option B": "Saturn",
      "Option C": "Uranus",
      "Option D": "Neptune",
      "Correct Answer": "B",
      "Question Type": "Rapid Fire",
      "Master Category": "GK",
      "Category": "World GK",
      "Topic": "Space & Astronomy",
      "Difficulty": "Expert",
      "Explanation": "Saturn currently holds the lead with 146 discovered and designated moons.",
      "Language": "en",
      "Exam Tags": "NDA, CDS, SSC",
      "Sub Topic": "Solar System",
    },
  ];

  const allowedValues = [
    { "Field": "Category", "Allowed Values": "India GK, World GK", "Description": "Must be India GK or World GK" },
    { "Field": "Difficulty", "Allowed Values": "Easy, Medium, Hard, Expert", "Description": "Case-insensitive difficulty level" },
    { "Field": "Language", "Allowed Values": "Hindi, English, hi, en", "Description": "Language of the question" },
    { "Field": "Correct Answer", "Allowed Values": "A, B, C, D (or 1, 2, 3, 4, or exact option text)", "Description": "Normalized automatically to 0..3 index" },
    { "Field": "Question Type", "Allowed Values": "Learn, Rapid Fire, Quick Choice, Explore, Guess the..., Timeline, Compare", "Description": "Free text stored as-is" },
    { "Field": "Master Category", "Allowed Values": "GK", "Description": "Always 'GK' for GK bank" },
    { "Field": "Topic", "Allowed Values": "Topic Name (EN or HI)", "Description": "Matched to GK topics or auto-created" },
    { "Field": "Exam Tags", "Allowed Values": "SSC, Railway, PSC, UPSC...", "Description": "Comma-separated exam keywords" },
    { "Field": "Sub Topic", "Allowed Values": "Any sub-topic string", "Description": "Used for generating set tags" },
  ];

  const wsQuestions = XLSX.utils.json_to_sheet(questionsData);
  wsQuestions["!cols"] = [
    { wch: 45 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
    { wch: 16 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 24 },
    { wch: 14 }, { wch: 45 }, { wch: 12 }, { wch: 25 }, { wch: 22 },
  ];

  const wsAllowed = XLSX.utils.json_to_sheet(allowedValues);
  wsAllowed["!cols"] = [{ wch: 18 }, { wch: 40 }, { wch: 45 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsQuestions, "GK Questions");
  XLSX.utils.book_append_sheet(wb, wsAllowed, "Allowed Values");
  XLSX.writeFile(wb, "quizweb-gk-upload-template.xlsx");
}

// Generate Legacy Sample Template (.xlsx with 2 sheets)
async function generateLegacySampleXlsx() {
  const XLSX = await import("xlsx");
  const data = [
    { "Question": "What is the capital of France?", "Option 1": "London", "Option 2": "Berlin", "Option 3": "Paris", "Option 4": "Madrid", "Correct Answer (1-4)": 3, "Difficulty": "Easy" },
    { "Question": "What is 2 + 2?", "Option 1": "3", "Option 2": "4", "Option 3": "5", "Option 4": "6", "Correct Answer (1-4)": 2, "Difficulty": "Easy" },
    { "Question": "Who wrote Hamlet?", "Option 1": "Dickens", "Option 2": "Shakespeare", "Option 3": "Austen", "Option 4": "Twain", "Correct Answer (1-4)": 2, "Difficulty": "Medium" },
    { "Question": "Which element has atomic number 79?", "Option 1": "Silver", "Option 2": "Gold", "Option 3": "Platinum", "Option 4": "Copper", "Correct Answer (1-4)": 2, "Difficulty": "Expert" },
  ];
  const allowed = [
    { "Field": "Difficulty", "Allowed Values": "Easy, Medium, Hard, Expert" },
    { "Field": "Correct Answer", "Allowed Values": "1, 2, 3, or 4" },
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 14 },
  ];
  const wsAllowed = XLSX.utils.json_to_sheet(allowed);
  wsAllowed["!cols"] = [{ wch: 20 }, { wch: 35 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Questions");
  XLSX.utils.book_append_sheet(wb, wsAllowed, "Allowed Values");
  XLSX.writeFile(wb, "quizweb-legacy-template.xlsx");
}

const EXAMPLE_JSON = `[
  {
    "masterCategory": "GK",
    "category": "India GK",
    "topic": "Ancient Indian History",
    "question": "सिंधु घाटी सभ्यता का प्रमुख बंदरगाह कौन सा था?",
    "optionA": "कालीबंगन",
    "optionB": "लोथल",
    "optionC": "रोपड़",
    "optionD": "मोहनजोदड़ो",
    "correctAnswer": "B",
    "difficulty": "medium",
    "language": "hi",
    "explanation": "लोथल गुजरात के भाल क्षेत्र में स्थित प्राचीन सिंधु घाटी सभ्यता का एक प्रमुख बंदरगाह शहर था।",
    "examTags": ["SSC CGL", "State PSC"],
    "subTopic": "Indus Valley Civilization"
  }
]`;

export default function AdminUploadPage() {
  const router = useRouter();
  const { quizzes, refreshQuizzes } = useData();
  const { adminUser } = useAdmin();
  const isJr = adminUser?.role === "jr";

  const [tab, setTab] = useState("excel"); // "excel" | "json" | "images"
  const [templateType, setTemplateType] = useState("auto"); // "auto" | "gk" | "legacy"
  const [detectedTemplate, setDetectedTemplate] = useState(null); // "gk" | "legacy"

  const excelInputRef = useRef(null);
  const jsonInputRef = useRef(null);

  // Raw parsed file data & column mapping
  const [rawRows, setRawRows] = useState([]);
  const [rawHeaders, setRawHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [showMappingConfig, setShowMappingConfig] = useState(false);

  // Validation response from server
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [missingTopics, setMissingTopics] = useState([]);
  const [isCreatingTopics, setIsCreatingTopics] = useState(false);

  // Import configuration
  const [importMode, setImportMode] = useState("add_new"); // "add_new" | "update_existing"
  const [legacySelectedCatId, setLegacySelectedCatId] = useState("");
  const [legacyCategory, setLegacyCategory] = useState("India GK");

  // Progress state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [uploadCurrent, setUploadCurrent] = useState(0);
  const [importSummary, setImportSummary] = useState(null);

  // JSON state
  const [jsonText, setJsonText] = useState("");
  const [jsonErrors, setJsonErrors] = useState([]);
  const [jsonPreview, setJsonPreview] = useState(null);

  // Image bulk upload state
  const [imgCatId, setImgCatId] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [imgUploading, setImgUploading] = useState(false);
  const [imgProgress, setImgProgress] = useState(0);
  const [imgResults, setImgResults] = useState(null);

  const allowed = adminUser?.role === "master" || adminUser?.permissions?.upload !== false;
  if (!allowed) {
    return (
      <div className={styles.page}>
        <p>Access denied.</p>
      </div>
    );
  }

  // Auto-detect template based on headers
  const detectTemplateFromHeaders = (headers) => {
    const lowerHeaders = headers.map((h) => String(h || "").toLowerCase().trim());
    const isGk =
      lowerHeaders.includes("option a") ||
      lowerHeaders.includes("question type") ||
      lowerHeaders.includes("master category") ||
      lowerHeaders.includes("exam tags") ||
      lowerHeaders.includes("sub topic");
    return isGk ? "gk" : "legacy";
  };

  // Generate initial column mapping
  const buildInitialMapping = (headers, tType) => {
    const mapping = {};
    const lowerMap = {};
    headers.forEach((h) => {
      lowerMap[String(h).toLowerCase().trim()] = h;
    });

    if (tType === "gk") {
      mapping.question = lowerMap["question"] || headers[0] || "";
      mapping.optionA = lowerMap["option a"] || lowerMap["option 1"] || headers[1] || "";
      mapping.optionB = lowerMap["option b"] || lowerMap["option 2"] || headers[2] || "";
      mapping.optionC = lowerMap["option c"] || lowerMap["option 3"] || headers[3] || "";
      mapping.optionD = lowerMap["option d"] || lowerMap["option 4"] || headers[4] || "";
      mapping.correctAnswer = lowerMap["correct answer"] || lowerMap["correct answer (1-4)"] || lowerMap["answer"] || headers[5] || "";
      mapping.questionType = lowerMap["question type"] || "";
      mapping.masterCategory = lowerMap["master category"] || "";
      mapping.category = lowerMap["category"] || "";
      mapping.topic = lowerMap["topic"] || "";
      mapping.difficulty = lowerMap["difficulty"] || "";
      mapping.explanation = lowerMap["explanation"] || "";
      mapping.language = lowerMap["language"] || "";
      mapping.examTags = lowerMap["exam tags"] || lowerMap["exam"] || "";
      mapping.subTopic = lowerMap["sub topic"] || lowerMap["subtopic"] || "";
    } else {
      mapping.question = lowerMap["question"] || headers[0] || "";
      mapping.optionA = lowerMap["option 1"] || headers[1] || "";
      mapping.optionB = lowerMap["option 2"] || headers[2] || "";
      mapping.optionC = lowerMap["option 3"] || headers[3] || "";
      mapping.optionD = lowerMap["option 4"] || headers[4] || "";
      mapping.correctAnswer = lowerMap["correct answer (1-4)"] || lowerMap["correct answer"] || headers[5] || "";
      mapping.difficulty = lowerMap["difficulty"] || headers[6] || "";
    }
    return mapping;
  };

  // File selection & parsing
  const handleExcelFile = (file) => {
    if (!file) {
      toast.error("Please select a valid Excel file (.xlsx or .xls)");
      return;
    }

    setImportSummary(null);
    setValidationResult(null);
    setMissingTopics([]);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(ev.target.result, { type: "array" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];

        // Parse sheet to JSON rows
        const rawJson = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (rawJson.length === 0) {
          toast.error("The spreadsheet has no data rows");
          return;
        }

        // Extract header keys
        const headers = Object.keys(rawJson[0]);
        setRawHeaders(headers);
        setRawRows(rawJson);

        const detected = detectTemplateFromHeaders(headers);
        setDetectedTemplate(detected);
        const activeTType = templateType === "auto" ? detected : templateType;

        const initialMap = buildInitialMapping(headers, activeTType);
        setColumnMapping(initialMap);

        toast.success(`Loaded ${rawJson.length} rows! Detected template: ${detected.toUpperCase()}`);

        // Trigger server-side validation preview
        await runServerValidation(rawJson, initialMap, activeTType);
      } catch (err) {
        console.error("Excel parse error:", err);
        toast.error("Failed to read spreadsheet: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Server-side validation preview
  const runServerValidation = async (rows, mapping, tType) => {
    setIsValidating(true);
    try {
      // Map rows according to column mapping
      const mappedRows = rows.map((r) => {
        return {
          question: r[mapping.question] || "",
          optionA: r[mapping.optionA] || "",
          optionB: r[mapping.optionB] || "",
          optionC: r[mapping.optionC] || "",
          optionD: r[mapping.optionD] || "",
          correctAnswer: r[mapping.correctAnswer] || "",
          difficulty: r[mapping.difficulty] || "medium",
          category: tType === "gk" ? r[mapping.category] : legacyCategory,
          topic: tType === "gk" ? r[mapping.topic] : "",
          language: tType === "gk" ? r[mapping.language] : "en",
          explanation: tType === "gk" ? r[mapping.explanation] : "",
          examTags: tType === "gk" ? r[mapping.examTags] : "",
          subTopic: tType === "gk" ? r[mapping.subTopic] : "",
          questionType: tType === "gk" ? r[mapping.questionType] : "Explore",
        };
      });

      const res = await fetch("/api/admin/gk/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "validate",
          rows: mappedRows,
          defaultCategory: legacyCategory,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Validation failed");
      }

      setValidationResult(data);
      setMissingTopics(data.missingTopics || []);

      if (data.errorCount > 0) {
        toast(`Validation complete: ${data.validCount} valid, ${data.errorCount} errors`, {
          icon: "⚠️",
        });
      } else {
        toast.success(`Validation passed: ${data.validCount} valid questions ready!`);
      }
    } catch (err) {
      toast.error("Validation error: " + err.message);
    } finally {
      setIsValidating(false);
    }
  };

  // One-click create missing topics
  const handleCreateMissingTopics = async () => {
    if (!missingTopics || missingTopics.length === 0 || isCreatingTopics) return;
    setIsCreatingTopics(true);

    try {
      const res = await fetch("/api/admin/gk/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_topics",
          newTopics: missingTopics,
          category: legacyCategory || "India GK",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create topics");

      toast.success(`Successfully created ${data.createdCount} new topics!`);
      setMissingTopics([]);

      // Re-run validation so topicIds are assigned
      const activeTType = templateType === "auto" ? detectedTemplate || "gk" : templateType;
      await runServerValidation(rawRows, columnMapping, activeTType);
    } catch (err) {
      toast.error("Error creating topics: " + err.message);
    } finally {
      setIsCreatingTopics(false);
    }
  };

  // Batch import execution
  const handleExecuteImport = async () => {
    if (!validationResult || !validationResult.allValidated || validationResult.allValidated.length === 0) {
      toast.error("No valid questions to import");
      return;
    }

    if (isUploading) return;
    setIsUploading(true);
    setUploadProgress(0);

    const questionsToImport = validationResult.allValidated;
    const total = questionsToImport.length;
    setUploadTotal(total);
    setUploadCurrent(0);

    const CHUNK_SIZE = 50;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let allErrors = [];

    try {
      for (let i = 0; i < total; i += CHUNK_SIZE) {
        const chunk = questionsToImport.slice(i, i + CHUNK_SIZE);
        const res = await fetch("/api/admin/gk/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "import",
            questions: chunk,
            mode: importMode,
          }),
        });

        const resData = await res.json();
        if (!res.ok) {
          throw new Error(resData.error || `Failed on batch starting at row ${i + 1}`);
        }

        totalInserted += resData.insertedCount || 0;
        totalUpdated += resData.updatedCount || 0;
        totalSkipped += resData.skippedCount || 0;
        if (resData.errors && resData.errors.length > 0) {
          allErrors = [...allErrors, ...resData.errors];
        }

        const currentCount = Math.min(i + CHUNK_SIZE, total);
        setUploadCurrent(currentCount);
        setUploadProgress(Math.floor((currentCount / total) * 100));
      }

      setImportSummary({
        totalProcessed: total,
        inserted: totalInserted,
        updated: totalUpdated,
        skipped: totalSkipped,
        errors: allErrors,
      });

      await refreshQuizzes();
      toast.success(`Import complete! ${totalInserted} inserted, ${totalUpdated} updated, ${totalSkipped} skipped.`);
    } catch (err) {
      console.error("Batch import error:", err);
      toast.error("Import error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Download Error Report as CSV
  const handleDownloadErrorReport = () => {
    if (!validationResult?.errors && !importSummary?.errors) {
      toast.error("No errors to export");
      return;
    }
    const errs = importSummary?.errors?.length > 0 ? importSummary.errors : validationResult.errors || [];
    let csvContent = "data:text/csv;charset=utf-8,Row Number,Reason\n";
    errs.forEach((e) => {
      const reasonClean = String(e.reason || "").replace(/"/g, '""');
      csvContent += `${e.row},"${reasonClean}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `quizweb_upload_errors_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ===== JSON Handlers (Phase 2 schema support) =====
  const handleJsonValidate = async () => {
    setJsonErrors([]);
    setJsonPreview(null);

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      setJsonErrors(["Invalid JSON syntax: " + e.message]);
      return;
    }

    if (!Array.isArray(parsed)) {
      setJsonErrors(["Root payload must be an array of questions or categories"]);
      return;
    }

    // Convert into row objects for server validation
    const rows = parsed.map((item) => ({
      question: item.question || item.text || "",
      optionA: item.optionA || (item.options && item.options[0]) || "",
      optionB: item.optionB || (item.options && item.options[1]) || "",
      optionC: item.optionC || (item.options && item.options[2]) || "",
      optionD: item.optionD || (item.options && item.options[3]) || "",
      correctAnswer: item.correctAnswer || (item.correctIndex !== undefined ? item.correctIndex + 1 : ""),
      difficulty: item.difficulty || "medium",
      category: item.category || "India GK",
      topic: item.topic || item.topicId || "",
      language: item.language || "en",
      explanation: item.explanation || "",
      examTags: item.examTags || item.exam || [],
      subTopic: item.subTopic || "",
      questionType: item.questionType || "Explore",
    }));

    setIsValidating(true);
    try {
      const res = await fetch("/api/admin/gk/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate", rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setValidationResult(data);
      setJsonPreview(data.allValidated || []);
      toast.success(`Validated ${data.validCount} questions from JSON payload!`);
    } catch (err) {
      setJsonErrors([err.message]);
    } finally {
      setIsValidating(false);
    }
  };

  // Image bulk upload handlers
  const handleImageFilesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((f) => f.type.startsWith("image/"));
    setSelectedImages((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      return [...prev, ...validFiles.filter((f) => !existingNames.has(f.name))];
    });
    e.target.value = "";
  };

  const removeSelectedImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageBulkUpload = async () => {
    if (!imgCatId || selectedImages.length === 0 || imgUploading) return;
    setImgUploading(true);
    setImgProgress(0);
    setImgResults(null);

    try {
      const BATCH = 5;
      let allCreated = [];
      let allErrors = [];

      for (let i = 0; i < selectedImages.length; i += BATCH) {
        const batch = selectedImages.slice(i, i + BATCH);
        const fd = new FormData();
        fd.append("categoryId", imgCatId);
        batch.forEach((f) => fd.append("images", f));

        const res = await fetch("/api/admin/bulk-image-upload", { method: "POST", body: fd });
        const data = await res.json();

        if (data.created) allCreated = [...allCreated, ...data.questions];
        if (data.errors) allErrors = [...allErrors, ...data.errors];

        setImgProgress(Math.min(100, Math.round(((i + BATCH) / selectedImages.length) * 100)));
      }

      setImgResults({ created: allCreated, errors: allErrors });
      setSelectedImages([]);
      await refreshQuizzes();
      toast.success(`Uploaded ${allCreated.length} image questions!`);
    } catch (err) {
      setImgResults({ created: [], errors: [err.message] });
    } finally {
      setImgUploading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Toaster position="top-right" />

      {/* Header Banner */}
      <div className={styles.headerRow}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.badgeHeader}>
            <span>📥 BULK UPLOAD CENTER · GK & QUIZZES</span>
          </div>
          <h1 className={styles.title}>Bulk Upload & Data Importer</h1>
          <p className={styles.subtitle}>
            Import 5,000+ questions with auto-detection, SHA-1 deduplication, topic creation, and batch processing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/gk?tab=builder"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Sparkles size={14} />
            <span>⚡ Set Builder & Regeneration</span>
          </Link>
          <Link href="/admin/sawal-jawab" className={styles.secondaryBtn}>
            <span>Sawal / Jawab Import →</span>
          </Link>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "excel" ? styles.tabActive : ""}`}
          onClick={() => setTab("excel")}
        >
          <span>📊 Excel Spreadsheet (New GK & Legacy)</span>
        </button>
        <button
          className={`${styles.tab} ${tab === "json" ? styles.tabActive : ""}`}
          onClick={() => setTab("json")}
        >
          <span>📋 JSON Payload Import</span>
        </button>
        <button
          className={`${styles.tab} ${tab === "images" ? styles.tabActive : ""}`}
          onClick={() => setTab("images")}
        >
          <span>🖼️ Image Bulk Upload</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB 1: EXCEL SPREADSHEET (PHASE 2 COMPREHENSIVE IMPLEMENTATION)
      ══════════════════════════════════════════════════════════════ */}
      {tab === "excel" && (
        <div className="space-y-6">
          {/* Template Selection & Downloads Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                  1. Template Format & Sample Downloads
                </span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Auto-Detects Legacy vs New GK Format by Header Names
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={generateGkSampleXlsx}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download New GK Template (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={generateLegacySampleXlsx}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download Legacy Template (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Template Format Overview Pills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-purple-900 dark:text-purple-300">
                    🏛️ New GK Template (14 Columns)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-200/60 dark:bg-purple-800/60 text-purple-900 dark:text-purple-200 text-[10px] font-black">
                    RECOMMENDED
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Question · Option A · Option B · Option C · Option D · Correct Answer · Question Type · Master Category · Category · Topic · Difficulty · Explanation · Language · Exam Tags (+ Sub Topic)
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    📑 Legacy Template (7 Columns)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                    STANDARD
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Question · Option 1 · Option 2 · Option 3 · Option 4 · Correct Answer (1–4) · Difficulty (Easy/Medium/Hard/Expert)
                </p>
              </div>
            </div>
          </div>

          {/* Legacy Category Choice (for legacy template or fallback) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm">
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-2">
              2. Default Category / Legacy Target
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Select GK Category Default
                </label>
                <div className="flex items-center gap-2">
                  {["India GK", "World GK"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setLegacyCategory(cat)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        legacyCategory === cat
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Or Target Quiz Category (Legacy System)
                </label>
                <CategorySearchSelect
                  categories={quizzes}
                  value={legacySelectedCatId}
                  onChange={(val) => setLegacySelectedCatId(val)}
                  emptyLabel="-- Choose Quiz Category (Optional) --"
                  placeholder="🔍 Search category..."
                />
              </div>
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors shadow-sm"
            onClick={() => excelInputRef.current?.click()}
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mx-auto mb-3 text-2xl">
              <Upload size={28} />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
              Click or Drag Excel Spreadsheet Here
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Auto-detects template headers (New GK or Legacy). Supports .xlsx and .xls up to 50,000 questions.
            </p>
            <input
              type="file"
              ref={excelInputRef}
              accept=".xlsx,.xls"
              onChange={(e) => handleExcelFile(e.target.files[0])}
              hidden
            />
          </div>

          {/* Validation & Auto Column Mapping Section */}
          {rawRows.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    Auto-Detected Columns ({rawHeaders.length} headers detected)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-black">
                    Template: {detectedTemplate?.toUpperCase() || "GK"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMappingConfig(!showMappingConfig)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>{showMappingConfig ? "Hide Column Mapping" : "Edit Column Mapping"}</span>
                  {showMappingConfig ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {/* Editable Column Mapping Matrix */}
              {showMappingConfig && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700">
                  {Object.keys(columnMapping).map((key) => (
                    <div key={key}>
                      <label className="text-[11px] font-black uppercase text-slate-600 dark:text-slate-400 block mb-1">
                        {key}
                      </label>
                      <select
                        value={columnMapping[key] || ""}
                        onChange={(e) => {
                          const updated = { ...columnMapping, [key]: e.target.value };
                          setColumnMapping(updated);
                          const activeTType = templateType === "auto" ? detectedTemplate || "gk" : templateType;
                          runServerValidation(rawRows, updated, activeTType);
                        }}
                        className="w-full text-xs font-bold p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                      >
                        <option value="">-- None / Default --</option>
                        {rawHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {/* Validation KPI Badges */}
              {validationResult && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-lg font-black text-emerald-700 dark:text-emerald-400 leading-none">
                        {validationResult.validCount}
                      </div>
                      <div className="text-[10.5px] font-bold text-emerald-600/80 mt-1">Valid Questions</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
                    <AlertTriangle size={20} className="text-amber-600 shrink-0" />
                    <div>
                      <div className="text-lg font-black text-amber-700 dark:text-amber-400 leading-none">
                        {validationResult.duplicateCount}
                      </div>
                      <div className="text-[10.5px] font-bold text-amber-600/80 mt-1">Duplicate Hashes</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-center gap-3">
                    <XCircle size={20} className="text-rose-600 shrink-0" />
                    <div>
                      <div className="text-lg font-black text-rose-700 dark:text-rose-400 leading-none">
                        {validationResult.errorCount}
                      </div>
                      <div className="text-[10.5px] font-bold text-rose-600/80 mt-1">Errors Found</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex items-center gap-3">
                    <Layers size={20} className="text-indigo-600 shrink-0" />
                    <div>
                      <div className="text-lg font-black text-indigo-700 dark:text-indigo-400 leading-none">
                        {validationResult.totalRows}
                      </div>
                      <div className="text-[10.5px] font-bold text-indigo-600/80 mt-1">Total Rows</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Missing Topics Banner & Auto-Create Button */}
              {missingTopics.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <AlertTriangle size={15} className="text-amber-600" />
                      <span>{missingTopics.length} New Topics Found in Spreadsheet</span>
                    </h4>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                      Topics: {missingTopics.slice(0, 5).join(", ")}
                      {missingTopics.length > 5 ? ` and ${missingTopics.length - 5} more...` : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateMissingTopics}
                    disabled={isCreatingTopics}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 shrink-0"
                  >
                    <PlusCircle size={14} />
                    <span>{isCreatingTopics ? "Creating..." : `Create ${missingTopics.length} New Topics`}</span>
                  </button>
                </div>
              )}

              {/* Validation Preview Table (First 50 Rows) */}
              {validationResult?.previewRows && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Previewing First 50 Rows
                    </h4>
                    {validationResult.errors.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDownloadErrorReport}
                        className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
                      >
                        <Download size={13} />
                        <span>Download Error Report ({validationResult.errors.length} errors)</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {validationResult.previewRows.map((q, idx) => (
                      <div
                        key={idx}
                        className={`p-3 flex items-start justify-between gap-3 ${
                          q.isDuplicate
                            ? "bg-amber-50/50 dark:bg-amber-950/20"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-slate-400">#{q.rowNum}</span>
                            <span className="font-bold text-slate-900 dark:text-white line-clamp-1">{q.text}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                            <span className="font-medium text-slate-600 dark:text-slate-400">
                              Ans: <span className="text-emerald-600 font-bold">{q.correctAnswer}</span>
                            </span>
                            <span>·</span>
                            <span>{q.category}</span>
                            {q.topicName && (
                              <>
                                <span>·</span>
                                <span>{q.topicName}</span>
                              </>
                            )}
                            {q.examTags?.length > 0 && (
                              <>
                                <span>·</span>
                                <span className="text-purple-600">[{q.examTags.join(", ")}]</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {q.isDuplicate && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                              DUPLICATE
                            </span>
                          )}

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              q.difficulty === "easy"
                                ? "bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]"
                                : q.difficulty === "hard"
                                ? "bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]"
                                : q.difficulty === "expert"
                                ? "bg-[#EDE9FE] text-[#7C3AED] border-[#C4B5FD]"
                                : "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]"
                            }`}
                          >
                            {q.difficulty?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Import Mode Radio Options */}
              <div className="pt-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
                  Choose Duplicate Handling Mode
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setImportMode("add_new")}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      importMode === "add_new"
                        ? "bg-indigo-50/90 dark:bg-indigo-950/40 border-2 border-indigo-600 shadow-xs"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                        Add New Only (Skip Duplicates)
                      </span>
                      <input type="radio" checked={importMode === "add_new"} readOnly />
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Preserves all existing questions. Only imports rows whose SHA-1 hash is unique.
                    </p>
                  </div>

                  <div
                    onClick={() => setImportMode("update_existing")}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      importMode === "update_existing"
                        ? "bg-indigo-50/90 dark:bg-indigo-950/40 border-2 border-indigo-600 shadow-xs"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                        Update Existing by Hash
                      </span>
                      <input type="radio" checked={importMode === "update_existing"} readOnly />
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Updates options, explanation, difficulty, and tags if hash matches an existing question.
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {isUploading && (
                <div className={styles.progressContainer}>
                  <div className={styles.progressHeader}>
                    <span>📥 Uploading in batches of 50...</span>
                    <span>
                      {uploadCurrent} / {uploadTotal} ({uploadProgress}%)
                    </span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Result Summary */}
              {importSummary && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span>Import Successfully Completed!</span>
                    </h4>

                    {importSummary.errors.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDownloadErrorReport}
                        className="text-xs font-bold text-rose-600 underline flex items-center gap-1"
                      >
                        <Download size={13} />
                        <span>Download Error Report ({importSummary.errors.length})</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80">
                      Total: {importSummary.totalProcessed}
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 text-emerald-600">
                      Inserted: {importSummary.inserted}
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 text-blue-600">
                      Updated: {importSummary.updated}
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 text-amber-600">
                      Skipped: {importSummary.skipped}
                    </div>
                  </div>

                  {/* Regenerate GK sets shortcut */}
                  <div className="pt-2 flex items-center justify-between border-t border-emerald-200 dark:border-emerald-800">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Next Step: Generate or refresh GK sets with the new questions
                    </span>
                    <Link
                      href="/admin/gk?tab=builder"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-sm"
                    >
                      <Sparkles size={14} />
                      <span>Regenerate GK Sets →</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Start Batch Import Button */}
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isUploading || isValidating || !validationResult?.validCount}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-extrabold text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
              >
                <ArrowRight size={16} />
                <span>
                  {isUploading
                    ? "Importing in Progress..."
                    : `🚀 Import ${validationResult?.validCount || 0} Questions Now (${importMode === "add_new" ? "Add New Only" : "Update Existing"})`}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: JSON PAYLOAD IMPORT (WITH GK EXTENSIONS)
      ══════════════════════════════════════════════════════════════ */}
      {tab === "json" && (
        <div className={styles.uploadCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label className={styles.fieldLabel}>JSON Questions or Categories Payload</label>
            <button
              className={styles.secondaryBtn}
              onClick={() => jsonInputRef.current?.click()}
              style={{ padding: "6px 14px", fontSize: "0.8rem" }}
            >
              <span>📁 Load JSON File</span>
            </button>
            <input
              type="file"
              ref={jsonInputRef}
              accept=".json"
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  setJsonText(ev.target.result);
                };
                reader.readAsText(file);
              }}
              hidden
            />
          </div>

          <textarea
            rows={10}
            className={styles.textarea}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={EXAMPLE_JSON}
          />

          <div style={{ display: "flex", gap: "10px" }}>
            <button className={styles.secondaryBtn} onClick={handleJsonValidate} disabled={isValidating}>
              <span>{isValidating ? "Validating..." : "🔍 Validate JSON Payload"}</span>
            </button>
          </div>

          {/* Validation Errors */}
          {jsonErrors.length > 0 && (
            <div className={styles.errorBox}>
              <strong>❌ JSON Validation Errors:</strong>
              <ul>
                {jsonErrors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {/* JSON Preview */}
          {jsonPreview && (
            <div className={styles.previewBox}>
              <h3>JSON Preview</h3>
              <p>Ready to import {jsonPreview.length} questions.</p>

              <button
                className={styles.primaryBtn}
                onClick={handleExecuteImport}
                disabled={isUploading}
                style={{ width: "100%", marginTop: "10px" }}
              >
                <span>{isUploading ? "Uploading..." : `🚀 Import All ${jsonPreview.length} Questions`}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 3: IMAGE BULK UPLOAD (UNCHANGED)
      ══════════════════════════════════════════════════════════════ */}
      {tab === "images" && (
        <div className={styles.uploadCard}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Target Category for Image Questions</label>
            <CategorySearchSelect
              categories={quizzes}
              value={imgCatId}
              onChange={(val) => setImgCatId(val)}
              emptyLabel="-- Select Category --"
              placeholder="🔍 Search category for image questions..."
            />
          </div>

          <div className={styles.dropzone} onClick={() => document.getElementById("img-bulk-input")?.click()}>
            <div className={styles.dropIcon}>🖼️</div>
            <h3 className={styles.dropText}>Select Image Files for Quiz Questions</h3>
            <p className={styles.dropSubtext}>Upload diagrams, map questions, or picture-based quiz questions</p>
            <input
              id="img-bulk-input"
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageFilesSelect}
              hidden
            />
          </div>

          {selectedImages.length > 0 && (
            <div style={{ background: "var(--bg-secondary)", padding: "16px", borderRadius: "14px" }}>
              <h4 style={{ margin: "0 0 10px", fontSize: "0.95rem", fontWeight: 800 }}>
                Selected Images ({selectedImages.length})
              </h4>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {selectedImages.map((img, i) => (
                  <span
                    key={i}
                    className={styles.previewCount}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    {img.name}
                    <button
                      type="button"
                      onClick={() => removeSelectedImage(i)}
                      style={{ border: "none", background: "none", cursor: "pointer" }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>

              {imgUploading && (
                <div className={styles.progressContainer}>
                  <div className={styles.progressHeader}>
                    <span>🖼️ Uploading & processing images...</span>
                    <span>{imgProgress}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${imgProgress}%` }} />
                  </div>
                </div>
              )}

              <button
                className={styles.primaryBtn}
                onClick={handleImageBulkUpload}
                disabled={imgUploading || !imgCatId}
                style={{ width: "100%", marginTop: "14px" }}
              >
                <span>{imgUploading ? "Uploading..." : `🚀 Upload ${selectedImages.length} Image Questions`}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
