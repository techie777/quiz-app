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
  ExternalLink,
} from "lucide-react";

const DIFFICULTIES = ["easy", "medium", "hard", "expert"];

// Generate Standard 14-Column Excel Template (.xlsx) requested by user
async function generateGkSampleXlsx() {
  const XLSX = await import("xlsx");
  const questionsData = [
    {
      "Main category": "India GK",
      "Sub category": "Indian History",
      "Topic name": "Ancient India",
      "Keywords": "Indus Valley, Lothal, Harappa, Ancient Port",
      "Questions": "सिंधु घाटी सभ्यता का प्रमुख बंदरगाह कौन सा था?",
      "Option A": "कालीबंगन",
      "Option B": "लोथल",
      "Option C": "रोपड़",
      "Option D": "मोहनजोदड़ो",
      "Correct Answer": "B",
      "Difficulty": "Medium",
      "Hindi Explanation": "लोथल गुजरात के भाल क्षेत्र में स्थित प्राचीन सिंधु घाटी सभ्यता का एक प्रमुख बंदरगाह शहर था।",
      "English Explanation": "Lothal was one of the southernmost major port cities of the ancient Indus Valley Civilization located in Gujarat.",
      "Language": "hi",
    },
    {
      "Main category": "India GK",
      "Sub category": "Indian Geography",
      "Topic name": "Rivers & Lakes",
      "Keywords": "Ganga, Himalayas, Gangotri, Longest River",
      "Questions": "Which is the longest river entirely flowing within India?",
      "Option A": "Ganga",
      "Option B": "Godavari",
      "Option C": "Krishna",
      "Option D": "Narmada",
      "Correct Answer": "A",
      "Difficulty": "Easy",
      "Hindi Explanation": "गंगा भारत की सबसे लंबी नदी है, जो गंगोत्री हिमनद से निकलती है।",
      "English Explanation": "The Ganga is the longest river flowing entirely within India, originating from the Gangotri glacier.",
      "Language": "en",
    },
    {
      "Main category": "India GK",
      "Sub category": "Indian Polity",
      "Topic name": "Constitution",
      "Keywords": "Constitution, Dr BR Ambedkar, Drafting Committee",
      "Questions": "भारतीय संविधान की प्रारूप समिति के अध्यक्ष कौन थे?",
      "Option A": "डॉ. राजेन्द्र प्रसाद",
      "Option B": "डॉ. बी. आर. अम्बेडकर",
      "Option C": "जवाहरलाल नेहरू",
      "Option D": "सरदार वल्लभभाई पटेल",
      "Correct Answer": "B",
      "Difficulty": "Medium",
      "Hindi Explanation": "डॉ. भीमराव अम्बेडकर संविधान सभा की प्रारूप समिति के अध्यक्ष थे और उन्हें संविधान का जनक माना जाता है।",
      "English Explanation": "Dr. B.R. Ambedkar was the Chairman of the Drafting Committee of the Indian Constituent Assembly.",
      "Language": "hi",
    },
  ];

  const allowedValues = [
    { "Field": "Main category", "Allowed Values": "India GK, World GK, Science GK, Sports...", "Description": "Main top-level category" },
    { "Field": "Sub category", "Allowed Values": "Indian History, Indian Geography, Indian Polity, Indian Economy...", "Description": "Subcategory under main category" },
    { "Field": "Topic name", "Allowed Values": "Ancient India, Rivers & Lakes, Constitution...", "Description": "Specific topic name" },
    { "Field": "Keywords", "Allowed Values": "English keywords (e.g. Indus Valley, Lothal, Harappa)", "Description": "Keywords in English for search and topic indexing" },
    { "Field": "Questions", "Allowed Values": "Text of the question", "Description": "Full question statement" },
    { "Field": "Option A", "Allowed Values": "Option A text", "Description": "First choice option" },
    { "Field": "Option B", "Allowed Values": "Option B text", "Description": "Second choice option" },
    { "Field": "Option C", "Allowed Values": "Option C text", "Description": "Third choice option" },
    { "Field": "Option D", "Allowed Values": "Option D text", "Description": "Fourth choice option" },
    { "Field": "Correct Answer", "Allowed Values": "A, B, C, D (or 1, 2, 3, 4)", "Description": "Letter or number of the correct option" },
    { "Field": "Difficulty", "Allowed Values": "Easy, Medium, Hard, Expert", "Description": "Difficulty level of the question" },
    { "Field": "Hindi Explanation", "Allowed Values": "Hindi solution / facts", "Description": "Detailed explanation in Hindi" },
    { "Field": "English Explanation", "Allowed Values": "English solution / facts", "Description": "Detailed explanation in English" },
    { "Field": "Language", "Allowed Values": "hi, en, Hindi, English", "Description": "Language of the question ('hi' or 'en')" },
  ];

  const wsQuestions = XLSX.utils.json_to_sheet(questionsData);
  wsQuestions["!cols"] = [
    { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 45 },
    { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 16 },
    { wch: 14 }, { wch: 45 }, { wch: 45 }, { wch: 12 },
  ];

  const wsAllowed = XLSX.utils.json_to_sheet(allowedValues);
  wsAllowed["!cols"] = [{ wch: 20 }, { wch: 42 }, { wch: 45 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsQuestions, "Questions");
  XLSX.utils.book_append_sheet(wb, wsAllowed, "Template Guide");
  XLSX.writeFile(wb, "standard-quiz-upload-template.xlsx");
}

function downloadCsvSampleTemplate() {
  const headers = [
    "Main category",
    "Sub category",
    "Topic name",
    "Keywords",
    "Questions",
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
  const sampleRow1 = [
    "India GK",
    "Indian History",
    "Ancient India",
    '"Indus Valley, Lothal, Harappa"',
    '"सिंधु घाटी सभ्यता का प्रमुख बंदरगाह कौन सा था?"',
    "कालीबंगन",
    "लोथल",
    "रोपड़",
    "मोहनजोदड़ो",
    "B",
    "Medium",
    '"लोथल गुजरात में स्थित प्रमुख सिंधु बंदरगाह शहर था।"',
    '"Lothal was a major ancient Indus port city located in Gujarat."',
    "hi",
  ];
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), sampleRow1.join(",")].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "standard-quiz-upload-template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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

  // Target Category Selection (Selected by Admin)
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState("");

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
      lowerHeaders.includes("subject") ||
      lowerHeaders.includes("sub topic");
    return isGk ? "gk" : "legacy";
  };

  // Generate initial column mapping
  const buildInitialMapping = (headers, tType) => {
    const mapping = {};

    const findHeader = (...candidates) => {
      for (const cand of candidates) {
        const normCand = cand.toLowerCase().replace(/[\s_\-]/g, "");
        for (const h of headers) {
          if (String(h).toLowerCase().replace(/[\s_\-]/g, "") === normCand) {
            return h;
          }
        }
      }
      return "";
    };

    if (tType === "gk") {
      mapping.question = findHeader("question", "text", "qtext") || headers[0] || "";
      mapping.optionA = findHeader("option a", "option 1", "opt a", "opt1", "a") || headers[1] || "";
      mapping.optionB = findHeader("option b", "option 2", "opt b", "opt2", "b") || headers[2] || "";
      mapping.optionC = findHeader("option c", "option 3", "opt c", "opt3", "c") || headers[3] || "";
      mapping.optionD = findHeader("option d", "option 4", "opt d", "opt4", "d") || headers[4] || "";
      mapping.correctAnswer = findHeader("correct answer", "correct answer (1-4)", "answer", "correct", "ans") || headers[5] || "";
      mapping.questionType = findHeader("question type", "questiontype", "type");
      mapping.masterCategory = findHeader("master category", "mastercategory", "master_category", "main category", "maincategory");
      mapping.category = findHeader("category", "sub category", "subcategory");
      mapping.topic = findHeader("topic", "topic name", "topicname", "topic_name");
      mapping.subject = findHeader("subject", "subject name", "subjectname", "subject_name", "sub topic", "subtopic", "sub_topic");
      mapping.difficulty = findHeader("difficulty", "level", "diff");
      mapping.explanation = findHeader("explanation", "exp", "solution", "notes");
      mapping.language = findHeader("language", "lang");
      mapping.examTags = findHeader("exam tags", "examtags", "exam", "tags");
      mapping.subTopic = findHeader("sub topic", "subtopic", "sub_topic");
    } else {
      mapping.question = findHeader("question", "text") || headers[0] || "";
      mapping.optionA = findHeader("option 1", "option a", "opt 1", "a") || headers[1] || "";
      mapping.optionB = findHeader("option 2", "option b", "opt 2", "b") || headers[2] || "";
      mapping.optionC = findHeader("option 3", "option c", "opt 3", "c") || headers[3] || "";
      mapping.optionD = findHeader("option 4", "option d", "opt 4", "d") || headers[4] || "";
      mapping.correctAnswer = findHeader("correct answer (1-4)", "correct answer", "answer") || headers[5] || "";
      mapping.difficulty = findHeader("difficulty", "level") || headers[6] || "";
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

        // Auto-match file name with existing categories if none selected yet
        let activeCatId = selectedCategoryId;
        let activeCatName = selectedCategoryName;

        if (!activeCatId && Array.isArray(quizzes) && quizzes.length > 0) {
          const fnClean = file.name.toLowerCase().replace(/[^a-z0-9]/g, "");
          const match = quizzes.find((q) => {
            const topicClean = (q.topic || q.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            return topicClean && (fnClean.includes(topicClean) || topicClean.includes(fnClean));
          });
          if (match) {
            activeCatId = match.id || match._id;
            activeCatName = match.topic || match.name;
            setSelectedCategoryId(activeCatId);
            setSelectedCategoryName(activeCatName);
            toast.success(`Selected Category: "${activeCatName}"`);
          }
        }

        toast.success(`Loaded ${rawJson.length} rows! Template: ${detected.toUpperCase()}`);

        // Trigger server-side validation preview
        await runServerValidation(rawJson, initialMap, activeTType, activeCatId, activeCatName);
      } catch (err) {
        console.error("Excel parse error:", err);
        toast.error("Failed to read spreadsheet: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Category select change handler
  const handleSelectTargetCategory = (catId) => {
    setSelectedCategoryId(catId);
    const found = quizzes.find((q) => (q.id || q._id) === catId);
    const catName = found ? (found.topic || found.name) : "";
    setSelectedCategoryName(catName);
    if (rawRows.length > 0) {
      const activeTType = templateType === "auto" ? detectedTemplate || "gk" : templateType;
      runServerValidation(rawRows, columnMapping, activeTType, catId, catName);
    }
  };

  // Server-side validation preview
  const runServerValidation = async (rows, mapping, tType, overrideCatId, overrideCatName) => {
    setIsValidating(true);
    const activeCatId = overrideCatId !== undefined ? overrideCatId : selectedCategoryId;
    const activeCatName = overrideCatName !== undefined ? overrideCatName : selectedCategoryName;

    try {
      // Map rows according to column mapping
      const mappedRows = rows.map((r) => {
        const rowMasterCat = (mapping.masterCategory && r[mapping.masterCategory]) || r["Master Category"] || r["Main Category"] || "GK";
        const rowCategory = (mapping.category && r[mapping.category]) || r["Category"] || activeCatName || "General Knowledge";
        const rowTopic = (mapping.topic && r[mapping.topic]) || r["Topic"] || rowCategory;
        const rowSubject = (mapping.subject && r[mapping.subject]) || (mapping.subTopic && r[mapping.subTopic]) || r["Subject"] || rowTopic;
        const rowLang = (mapping.language && r[mapping.language]) || r["Language"] || "hi";
        const rowDiff = (mapping.difficulty && r[mapping.difficulty]) || r["Difficulty"] || "medium";
        const rowType = (mapping.questionType && r[mapping.questionType]) || r["Question Type"] || "MCQ";
        const rowExp = (mapping.explanation && r[mapping.explanation]) || r["Explanation"] || "";
        const rowExam = (mapping.examTags && r[mapping.examTags]) || r["Exam Tags"] || "";

        return {
          question: (mapping.question && r[mapping.question]) || r["Question"] || "",
          optionA: (mapping.optionA && r[mapping.optionA]) || r["Option A"] || "",
          optionB: (mapping.optionB && r[mapping.optionB]) || r["Option B"] || "",
          optionC: (mapping.optionC && r[mapping.optionC]) || r["Option C"] || "",
          optionD: (mapping.optionD && r[mapping.optionD]) || r["Option D"] || "",
          "Option A": (mapping.optionA && r[mapping.optionA]) || r["Option A"] || "",
          "Option B": (mapping.optionB && r[mapping.optionB]) || r["Option B"] || "",
          "Option C": (mapping.optionC && r[mapping.optionC]) || r["Option C"] || "",
          "Option D": (mapping.optionD && r[mapping.optionD]) || r["Option D"] || "",
          correctAnswer: (mapping.correctAnswer && r[mapping.correctAnswer]) || r["Correct Answer"] || "",
          "Correct Answer": (mapping.correctAnswer && r[mapping.correctAnswer]) || r["Correct Answer"] || "",
          difficulty: rowDiff,
          "Difficulty": rowDiff,
          masterCategory: rowMasterCat,
          "Master Category": rowMasterCat,
          category: rowCategory,
          "Category": rowCategory,
          topic: rowTopic,
          "Topic": rowTopic,
          subject: rowSubject,
          "Subject": rowSubject,
          language: rowLang,
          "Language": rowLang,
          explanation: rowExp,
          "Explanation": rowExp,
          examTags: rowExam,
          "Exam Tags": rowExam,
          subTopic: (mapping.subTopic && r[mapping.subTopic]) || rowSubject,
          questionType: rowType,
          "Question Type": rowType,
        };
      });

      const res = await fetch("/api/admin/gk/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "validate",
          rows: mappedRows,
          categoryId: activeCatId,
          defaultCategory: activeCatName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Validation failed");
      }

      setValidationResult(data);

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

  // Batch import execution
  const handleExecuteImport = async () => {
    if (!validationResult || !validationResult.allValidated || validationResult.allValidated.length === 0) {
      toast.error("No valid questions to import");
      return;
    }

    const hasRowCategory = validationResult.allValidated.some((r) => r.category && String(r.category).trim() !== "");
    if (!selectedCategoryId && !selectedCategoryName && !hasRowCategory) {
      toast.error("Please select a target Category or ensure rows have a Category column");
      return;
    }

    if (isUploading) return;
    setIsUploading(true);
    setUploadProgress(0);

    const questionsToImport = validationResult.allValidated;
    const total = questionsToImport.length;
    setUploadTotal(total);
    setUploadCurrent(0);

    const BATCH_SIZE = 50;
    let accumulatedInserted = 0;
    let accumulatedSkipped = 0;
    let accumulatedRejected = 0;
    const allCreatedSets = [];
    const allWarnings = [];
    const allErrors = [];
    let finalRemainderCount = 0;
    let lastViewUrl = "/gk";
    let lastVerified = true;

    try {
      for (let i = 0; i < total; i += BATCH_SIZE) {
        const chunk = questionsToImport.slice(i, i + BATCH_SIZE);
        const chunkNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalChunks = Math.ceil(total / BATCH_SIZE);

        const currentStartProgress = Math.round((i / total) * 100);
        setUploadProgress(currentStartProgress);
        setUploadCurrent(i);

        const res = await fetch("/api/admin/gk/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "import",
            questions: chunk,
            categoryId: selectedCategoryId,
            category: selectedCategoryName,
            mode: importMode,
            fileName: excelInputRef.current?.files?.[0]?.name || "bulk_upload.xlsx",
          }),
        });

        const resData = await res.json();
        if (!res.ok) {
          throw new Error(resData.error || `Failed to import batch ${chunkNum} of ${totalChunks}`);
        }

        accumulatedInserted += resData.rowsImported || 0;
        accumulatedSkipped += resData.skippedCount || 0;
        accumulatedRejected += resData.rowsRejected || 0;
        if (Array.isArray(resData.setsCreated)) {
          allCreatedSets.push(...resData.setsCreated);
        }
        if (Array.isArray(resData.warnings)) {
          allWarnings.push(...resData.warnings);
        }
        if (Array.isArray(resData.errors)) {
          allErrors.push(...resData.errors);
        }
        finalRemainderCount = resData.remainderCount || 0;
        if (resData.viewUrl) lastViewUrl = resData.viewUrl;
        if (resData.verified === false) lastVerified = false;

        const currentDone = Math.min(i + BATCH_SIZE, total);
        setUploadCurrent(currentDone);
        setUploadProgress(Math.round((currentDone / total) * 100));
      }

      setImportSummary({
        totalProcessed: total,
        inserted: accumulatedInserted,
        updated: 0,
        skipped: accumulatedSkipped,
        rejected: accumulatedRejected,
        setsCreated: allCreatedSets,
        setsCreatedCount: allCreatedSets.length,
        warnings: allWarnings,
        remainderCount: finalRemainderCount,
        viewUrl: lastViewUrl,
        verified: lastVerified,
        errors: allErrors,
      });

      await refreshQuizzes();
      toast.success(
        `Import complete! ${accumulatedInserted} questions imported, ${allCreatedSets.length} sets created and published.`
      );
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
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-xs text-xs font-black transition-colors cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download Standard Template (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={downloadCsvSampleTemplate}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download Standard CSV (.csv)</span>
                </button>

                <button
                  type="button"
                  onClick={generateLegacySampleXlsx}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Download size={14} />
                  <span>Legacy (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Template Format Overview Pills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-purple-900 dark:text-purple-200">
                    ⭐ Standard Template (Exact 14 Columns)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase">
                    STANDARD
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-[11px] font-medium leading-relaxed">
                  Main category · Sub category · Topic name · Keywords · Questions · Option A · Option B · Option C · Option D · Correct Answer · Difficulty · Hindi Explanation · English Explanation · Language
                </p>
                <p className="text-purple-700 dark:text-purple-400 text-[10.5px] font-bold mt-1">
                  ✓ Keywords in English field automatically indexed into search & taxonomy.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    📑 Legacy Template (7 Columns)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                    COMPATIBILITY
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Question · Option 1 · Option 2 · Option 3 · Option 4 · Correct Answer (1–4) · Difficulty (Easy/Medium/Hard/Expert)
                </p>
              </div>
            </div>
          </div>

          {/* 1. Target Category Choice */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-indigo-500/20 dark:border-indigo-500/30 p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-0.5">
                  1. Select Target Category
                </span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Choose the Category where questions will be uploaded & published
                </h3>
              </div>
              {selectedCategoryName && (
                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold shrink-0">
                  Target: {selectedCategoryName}
                </span>
              )}
            </div>

            <CategorySearchSelect
              categories={quizzes}
              value={selectedCategoryId}
              onChange={handleSelectTargetCategory}
              emptyLabel="-- Select Target Category (e.g. Indore GK, India GK, Biology...) --"
              placeholder="🔍 Search category..."
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Questions in your sheet will automatically attach to this category and be packaged into playable sets of 20 questions each.
            </p>
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

              {/* Rule 1 Result Summary */}
              {importSummary && (
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/30 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200 dark:border-emerald-800">
                    <div>
                      <h4 className="text-base font-black text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                        <span>Upload & Auto-Publish Completed!</span>
                      </h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                        {importSummary.verified
                          ? "✅ Verified: Sets have been automatically generated and are live on the customer site."
                          : "⚠️ Questions saved. Awaiting set publication confirmation."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {importSummary.viewUrl && (
                        <a
                          href={importSummary.viewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                        >
                          <ExternalLink size={14} />
                          <span>View on Website</span>
                        </a>
                      )}

                      {importSummary.errors.length > 0 && (
                        <button
                          type="button"
                          onClick={handleDownloadErrorReport}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs"
                        >
                          <Download size={13} />
                          <span>Errors ({importSummary.errors.length})</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-bold">
                    <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800">
                      <div className="text-[10.5px] uppercase tracking-wider text-slate-500 font-extrabold">Rows Read</div>
                      <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{importSummary.totalProcessed}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800 text-emerald-600">
                      <div className="text-[10.5px] uppercase tracking-wider text-emerald-600 font-extrabold">Imported</div>
                      <div className="text-lg font-black mt-0.5">{importSummary.inserted}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800 text-indigo-600">
                      <div className="text-[10.5px] uppercase tracking-wider text-indigo-600 font-extrabold">Sets Created</div>
                      <div className="text-lg font-black mt-0.5">{importSummary.setsCreatedCount || importSummary.setsCreated?.length || 0}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800 text-amber-600">
                      <div className="text-[10.5px] uppercase tracking-wider text-amber-600 font-extrabold">Pending Remainder</div>
                      <div className="text-lg font-black mt-0.5">{importSummary.remainderCount || 0} Qs</div>
                    </div>
                  </div>

                  {/* Sets Created Breakdown */}
                  {importSummary.setsCreated && importSummary.setsCreated.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                      <div className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>🎯 Published Sets (Sheet Order, 20/set)</span>
                        <span className="text-[11px] font-bold text-emerald-600">
                          {importSummary.setsCreated.length} sets live
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {importSummary.setsCreated.map((s, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-black border border-emerald-300 dark:border-emerald-700/60 shadow-xs"
                          >
                            <span>⚡</span>
                            <span>{s.title || `Set ${s.number}`}</span>
                            <span className="text-[10px] opacity-75 font-normal">({s.questionCount || 20} Qs)</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Remainder Explanation (Rule 4) */}
                  {importSummary.remainderCount > 0 && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                      <span>
                        <strong>{importSummary.remainderCount} questions</strong> are pending as remainder (&lt; 20). They will be automatically combined into the next upload for this Subject.
                      </span>
                    </div>
                  )}

                  {/* Warnings (7/7/6 mix or Subject defaults) */}
                  {importSummary.warnings && importSummary.warnings.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
                      <div className="font-black text-[11px] uppercase tracking-wider text-amber-800 dark:text-amber-400">
                        ⚠️ Warnings / 7/7/6 Mismatch Notice
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11.5px]">
                        {importSummary.warnings.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Rows Rejected with Reasons */}
                  {importSummary.errors && importSummary.errors.length > 0 && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-1.5 text-xs text-rose-900 dark:text-rose-200">
                      <div className="font-black text-[11px] uppercase tracking-wider text-rose-800 dark:text-rose-400">
                        ❌ Rows Rejected ({importSummary.errors.length})
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-rose-100 dark:divide-rose-900/30 text-[11.5px]">
                        {importSummary.errors.map((err, idx) => (
                          <div key={idx} className="pt-1 flex items-start gap-2">
                            <span className="font-bold text-rose-600">Row {err.row}:</span>
                            <span>{err.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
