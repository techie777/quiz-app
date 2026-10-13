"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { 
  Building2, 
  FileSpreadsheet, 
  BookOpen, 
  Settings2, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Copy, 
  Share2, 
  ExternalLink,
  Shuffle, 
  ShieldAlert, 
  Clock, 
  Award, 
  ArrowRight,
  Plus
} from "lucide-react";

export default function InstituteCreateTestPage() {
  // Step 1: Institute & Test Basics
  const [instituteName, setInstituteName] = useState("");
  const [testTitle, setTestTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [batchName, setBatchName] = useState("");

  // Step 2: Questions Mode & List
  const [activeTab, setActiveTab] = useState("EXCEL"); // "EXCEL" | "BANK"
  const [questions, setQuestions] = useState([]);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [excelStats, setExcelStats] = useState(null);

  // Question Bank Source
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoryQuestions, setCategoryQuestions] = useState([]);
  const [loadingBank, setLoadingBank] = useState(false);

  // Step 3: Rules & Anti-Cheat
  const [timingType, setTimingType] = useState("TOTAL_EXAM_TIMER"); // "TOTAL_EXAM_TIMER" | "PER_QUESTION_TIMER"
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [perQuestionSeconds, setPerQuestionSeconds] = useState(45);
  const [marksCorrect, setMarksCorrect] = useState(4);
  const [marksNegative, setMarksNegative] = useState(1);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [requireRollNumber, setRequireRollNumber] = useState(true);
  const [tabSwitchLimit, setTabSwitchLimit] = useState(3);

  // Step 4: Submission & Modal
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdRoom, setCreatedRoom] = useState(null);

  const fileInputRef = useRef(null);

  // Load existing categories for Question Bank selector
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await axios.get("/api/categories?limit=50&sortBy=popular");
        if (res.data?.categories) {
          setCategories(res.data.categories);
        } else if (Array.isArray(res.data)) {
          setCategories(res.data);
        }
      } catch (err) {
        console.warn("Categories fetch failed:", err);
      }
    };
    fetchCats();
  }, []);

  // Fetch questions when category is picked in Question Bank tab
  const handleCategorySelect = async (catId) => {
    setSelectedCategory(catId);
    if (!catId) return;
    setLoadingBank(true);
    try {
      const res = await axios.get(`/api/categories/${catId}`);
      const qs = res.data?.questions || [];
      setCategoryQuestions(qs);
    } catch (err) {
      toast.error("प्रश्न लोड करने में त्रुटि हुई।");
    } finally {
      setLoadingBank(false);
    }
  };

  // Add question from DB bank to test
  const handleAddFromBank = (bankQ) => {
    const alreadyAdded = questions.some(q => q.questionText === (bankQ.text || bankQ.question));
    if (alreadyAdded) {
      toast("यह प्रश्न पहले से जुड़ा हुआ है।", { icon: "ℹ️" });
      return;
    }

    const correctAns = typeof bankQ.correctAnswer === "string" ? bankQ.correctAnswer : "A";
    let mappedLetter = "A";
    const opts = bankQ.options || [];
    const idx = opts.findIndex(o => o === correctAns);
    if (idx >= 0) mappedLetter = String.fromCharCode(65 + idx);
    else if (["A", "B", "C", "D"].includes(correctAns.toUpperCase())) mappedLetter = correctAns.toUpperCase();

    const newQ = {
      id: `bank_${Date.now()}_${Math.random()}`,
      questionText: bankQ.text || bankQ.question || "Question",
      optionA: opts[0] || "",
      optionB: opts[1] || "",
      optionC: opts[2] || "",
      optionD: opts[3] || "",
      correctAnswer: mappedLetter,
      marks: marksCorrect,
      negativeMarks: marksNegative,
      explanation: bankQ.explanation || null
    };

    setQuestions(prev => [...prev, newQ]);
    toast.success("प्रश्न टेस्ट में जोड़ा गया! 🎯");
  };

  // 📂 Excel Upload & Parsing Engine (SheetJS)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const buffer = evt.target.result;
        const workbook = XLSX.read(buffer, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!rawRows || rawRows.length === 0) {
          toast.error("एक्सेल फ़ाइल में कोई डेटा नहीं मिला।");
          setIsParsingExcel(false);
          return;
        }

        const parsed = [];
        let validCount = 0;
        let invalidCount = 0;

        rawRows.forEach((row, i) => {
          // Identify headers dynamically (English or Hindi keys)
          const qText = row["Question (English or Hindi)"] || row["Question"] || row["प्रश्न"] || row["questionText"] || Object.values(row)[0] || "";
          const optA = row["Option A"] || row["A"] || row["विकल्प A"] || Object.values(row)[1] || "";
          const optB = row["Option B"] || row["B"] || row["विकल्प B"] || Object.values(row)[2] || "";
          const optC = row["Option C"] || row["C"] || row["विकल्प C"] || Object.values(row)[3] || "";
          const optD = row["Option D"] || row["D"] || row["विकल्प D"] || Object.values(row)[4] || "";
          
          let correct = String(row["Correct Answer (A/B/C/D)"] || row["Correct Answer"] || row["Correct"] || row["उत्तर"] || "A").trim().toUpperCase();
          const marks = Number(row["Marks"] || row["अंक"] || marksCorrect) || 4;
          const negMarks = Number(row["Negative Marks"] || row["नेगेटिव अंक"] || marksNegative) || 0;
          const explanation = row["Explanation (Optional)"] || row["Explanation"] || row["व्याख्या"] || "";

          // Validation check
          const isValid = qText.trim() && optA.trim() && optB.trim();
          if (isValid) {
            validCount++;
            parsed.push({
              id: `excel_${i + 1}_${Date.now()}`,
              questionText: qText.trim(),
              optionA: String(optA).trim(),
              optionB: String(optB).trim(),
              optionC: String(optC).trim(),
              optionD: String(optD).trim(),
              correctAnswer: ["A", "B", "C", "D"].includes(correct) ? correct : "A",
              marks,
              negativeMarks: negMarks,
              explanation: explanation ? String(explanation).trim() : null
            });
          } else {
            invalidCount++;
          }
        });

        setQuestions(parsed);
        setExcelStats({ total: rawRows.length, valid: validCount, invalid: invalidCount });
        toast.success(`एक्सेल से ${validCount} प्रश्न सफलतापूर्वक लोड किए गए! 📊`);
      } catch (err) {
        console.error("Excel parse error:", err);
        toast.error("फ़ाइल पढ़ने में त्रुटि। कृपया आधिकारिक एक्सेल टेम्पलेट का उपयोग करें।");
      } finally {
        setIsParsingExcel(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Remove question from list
  const handleRemoveQuestion = (id) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  // Submit and create Live B2B Test Room
  const handleCreateTest = async (e) => {
    e.preventDefault();

    if (!testTitle.trim()) {
      toast.error("कृपया टेस्ट का नाम (Test Title) दर्ज करें।");
      return;
    }

    if (questions.length === 0) {
      toast.error("कृपया कम से कम 1 प्रश्न जोड़ें (एक्सेल या प्रश्न बैंक से)।");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        testTitle: testTitle.trim(),
        instituteName: (instituteName || "Coaching Institute").trim(),
        subject: (subject || "General").trim(),
        batchName: (batchName || "Batch 1").trim(),
        timingType,
        durationMinutes: Number(durationMinutes) || 20,
        perQuestionSeconds: Number(perQuestionSeconds) || 45,
        marksCorrect: Number(marksCorrect) || 4,
        marksNegative: Number(marksNegative) || 0,
        shuffleQuestions,
        shuffleOptions,
        requireRollNumber,
        tabSwitchLimit: Number(tabSwitchLimit) || 3,
        questions
      };

      const res = await axios.post("/api/b2b/tests/create", payload);
      if (res.data?.success) {
        setCreatedRoom(res.data);
        toast.success("लाइव टेस्ट रूम सफलतापूर्वक तैयार हो गया! 🚀", { duration: 4000 });
      }
    } catch (err) {
      console.error("Failed to create test:", err);
      toast.error(err.response?.data?.error || "टेस्ट बनाने में त्रुटि हुई।");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy link helper
  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    toast.success("छात्रों के लिए टेस्ट लिंक कॉपी हो गया! 📋");
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* 🏛️ HEADER BANNER */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 text-slate-800 shadow-sm border border-slate-200/90 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
                <Building2 className="w-3.5 h-3.5" />
                <span>B2B कोचिंग व स्कूल लाइव टेस्ट इंजन</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                लाइव टेस्ट क्रिएटर स्टूडियो (Create Live Test)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                एक्सेल अपलोड करें या डेटाबेस से प्रश्न चुनें, टेस्ट लिंक शेयर करें और छात्रों का लाइव टेस्ट conduct करें।
              </p>
            </div>

            {/* Quick Action: Template Download */}
            <a
              href="/api/b2b/tests/template"
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
              title="ऑफिशियल एक्सेल टेम्पलेट डाउनलोड करें"
            >
              <Download className="w-4 h-4" />
              <span>एक्सेल टेम्पलेट (.xlsx)</span>
            </a>
          </div>
        </div>

        {/* 📝 FORM CONTAINER */}
        <form onSubmit={handleCreateTest} className="space-y-6">
          
          {/* STEP 1: INSTITUTE & TEST DETAILS */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-black border border-indigo-200/80">
                1
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                संस्थान एवं परीक्षा का विवरण (Institute & Test Details)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  संस्थान / कोचिंग का नाम (Institute Name)
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. Apex IIT Academy / KV School"
                  value={instituteName}
                  onChange={(e) => setInstituteName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  टेस्ट का नाम / शीर्षक (Test Title) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. Physics Mock 1 - Kinematics & Force"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  विषय (Subject)
                </label>
                <input
                  type="text"
                  placeholder="उदा. Physics / Mathematics / General Knowledge"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  बैच / कक्षा (Batch or Class)
                </label>
                <input
                  type="text"
                  placeholder="उदा. Target 2027 / Class 12th A"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-semibold"
                />
              </div>
            </div>
          </div>

          {/* STEP 2: QUESTIONS BUILDER (Excel vs Bank) */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-black border border-indigo-200/80">
                  2
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    प्रश्न जोड़ें (Add Questions)
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold">
                    वर्तमान में जोड़े गए कुल प्रश्न: <span className="text-indigo-600 font-black">{questions.length}</span>
                  </p>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/70 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab("EXCEL")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === "EXCEL"
                      ? "bg-white text-indigo-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>एक्सेल फ़ाइल इम्पोर्ट (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("BANK")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === "BANK"
                      ? "bg-white text-indigo-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>प्रश्न बैंक से चुनें (DB Bank)</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT: EXCEL */}
            {activeTab === "EXCEL" && (
              <div className="space-y-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-3xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100/70 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 flex items-center justify-center transition-all shadow-xs">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-slate-800">
                      एक्सेल फ़ाइल चुनें या ड्रैग करें (.xlsx / .csv)
                    </p>
                    <p className="text-xs text-slate-500 font-semibold">
                      हिंदी व अंग्रेजी दोनों फॉन्ट समर्थित हैं। एक क्लिक में सभी प्रश्न लोड होंगे।
                    </p>
                  </div>
                  {isParsingExcel && (
                    <div className="text-xs font-bold text-indigo-600 animate-pulse">
                      ⏳ एक्सेल फ़ाइल पार्स की जा रही है...
                    </div>
                  )}
                </div>

                {excelStats && (
                  <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-xs font-bold text-emerald-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>कुल {excelStats.valid} प्रश्न सफलतापूर्वक लोड हुए</span>
                    </div>
                    {excelStats.invalid > 0 && (
                      <span className="text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-lg">
                        ⚠️ {excelStats.invalid} अधूरी लाइनें छोड़ी गईं
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: QUESTION BANK */}
            {activeTab === "BANK" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    विषय / श्रेणी चुनें (Select Category)
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategorySelect(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-semibold cursor-pointer"
                  >
                    <option value="">-- श्रेणी चुनें (Select) --</option>
                    {categories.map((c) => (
                      <option key={c.id || c._id} value={c.slug || c.id || c._id}>
                        {c.emoji || "📚"} {c.topicHi || c.topic || c.name || "Category"}
                      </option>
                    ))}
                  </select>
                </div>

                {loadingBank && (
                  <div className="p-6 text-center text-xs font-bold text-slate-400 animate-pulse">
                    📚 प्रश्न लोड हो रहे हैं...
                  </div>
                )}

                {categoryQuestions.length > 0 && (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                    <p className="text-xs font-black text-slate-500 px-1">
                      उपलब्ध प्रश्न ({categoryQuestions.length}):
                    </p>
                    {categoryQuestions.slice(0, 30).map((bq, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-white transition-all text-xs">
                        <span className="font-bold text-slate-800 line-clamp-1 pr-3 flex-1">
                          {i + 1}. {bq.text || bq.question}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddFromBank(bq)}
                          className="shrink-0 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-[11px] cursor-pointer"
                        >
                          + जोड़ें
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PREVIEW OF ADDED QUESTIONS */}
            {questions.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    परीक्षा के प्रश्न ({questions.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setQuestions([])}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                  >
                    सभी हटाएं (Clear All)
                  </button>
                </div>

                <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                  {questions.map((q, idx) => (
                    <div 
                      key={q.id || idx} 
                      className="p-3 sm:p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-white transition-all flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <p className="font-black text-slate-900 leading-snug">
                          {idx + 1}. {q.questionText}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-semibold text-slate-600">
                          <span className={q.correctAnswer === 'A' ? 'text-emerald-700 font-black' : ''}>A: {q.optionA}</span>
                          <span className={q.correctAnswer === 'B' ? 'text-emerald-700 font-black' : ''}>B: {q.optionB}</span>
                          <span className={q.correctAnswer === 'C' ? 'text-emerald-700 font-black' : ''}>C: {q.optionC}</span>
                          <span className={q.correctAnswer === 'D' ? 'text-emerald-700 font-black' : ''}>D: {q.optionD}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold pt-0.5">
                          <span className="bg-emerald-100/80 text-emerald-800 px-2 py-0.5 rounded-md">
                            सही उत्तर: {q.correctAnswer}
                          </span>
                          <span>+{q.marks} अंक</span>
                          {q.negativeMarks > 0 && <span>(-{q.negativeMarks} नेगेटिव)</span>}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-all cursor-pointer shrink-0"
                        title="प्रश्न हटाएं"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: EXAM RULES & ANTI-CHEAT */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-black border border-indigo-200/80">
                3
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                परीक्षा नियम एवं एंटी-चीट सेटिंग्स (Rules & Anti-Cheat)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Timing Mode */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  टाइमर मोड (Timer Mode)
                </label>
                <select
                  value={timingType}
                  onChange={(e) => setTimingType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 font-semibold outline-none"
                >
                  <option value="TOTAL_EXAM_TIMER">पूरे टेस्ट का कुल समय (Total Exam Timer)</option>
                  <option value="PER_QUESTION_TIMER">प्रति-प्रश्न समय (Per-Question Timer)</option>
                </select>
              </div>

              {/* Duration / Seconds */}
              {timingType === "TOTAL_EXAM_TIMER" ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    कुल परीक्षा समय (मिनट में)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 font-semibold outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    प्रति प्रश्न समय (सेकंड में)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={perQuestionSeconds}
                    onChange={(e) => setPerQuestionSeconds(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 font-semibold outline-none"
                  />
                </div>
              )}

              {/* Marking Scheme */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  मार्किंग स्कीम (सही / नेगेटिव अंक)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="सही (+4)"
                    value={marksCorrect}
                    onChange={(e) => setMarksCorrect(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 font-semibold"
                    title="प्रत्येक सही उत्तर पर अंक"
                  />
                  <input
                    type="number"
                    placeholder="गलत (-1)"
                    value={marksNegative}
                    onChange={(e) => setMarksNegative(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 font-semibold"
                    title="प्रत्येक गलत उत्तर पर कटने वाले अंक"
                  />
                </div>
              </div>

            </div>

            {/* Anti-Cheat Toggles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-200/70 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <div>
                  <p className="text-xs font-black text-slate-800">प्रश्नों का क्रम बदलें (Shuffle Questions)</p>
                  <p className="text-[11px] text-slate-500 font-semibold">हर छात्र की स्क्रीन पर सवाल अलग क्रम में दिखेंगे (नकल रोकथाम)।</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-200/70 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <div>
                  <p className="text-xs font-black text-slate-800">विकल्पों का क्रम बदलें (Shuffle Options)</p>
                  <p className="text-[11px] text-slate-500 font-semibold">चारों ऑप्शन A, B, C, D हर छात्र को अलग क्रम में दिखेंगे।</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-200/70 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireRollNumber}
                  onChange={(e) => setRequireRollNumber(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <div>
                  <p className="text-xs font-black text-slate-800">रोल नंबर / स्टूडेंट आईडी अनिवार्य करें</p>
                  <p className="text-[11px] text-slate-500 font-semibold">छात्र केवल नाम व रोल नंबर दर्ज करके टेस्ट शुरू कर सकेंगे।</p>
                </div>
              </label>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-slate-800">टैब स्विचिंग अलर्ट सीमा (Anti-Cheat)</p>
                  <p className="text-[11px] text-slate-500 font-semibold">कितनी बार स्क्रीन छोड़ने पर टेस्ट ऑटो-सबमिट हो?</p>
                </div>
                <select
                  value={tabSwitchLimit}
                  onChange={(e) => setTabSwitchLimit(Number(e.target.value))}
                  className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white"
                >
                  <option value={1}>1 बार (Strict)</option>
                  <option value={2}>2 बार</option>
                  <option value={3}>3 बार (Recommended)</option>
                  <option value={5}>5 बार</option>
                </select>
              </div>
            </div>

          </div>

          {/* 🚀 SUBMIT BUTTON */}
          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting || questions.length === 0}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isSubmitting ? "रूम तैयार हो रहा है..." : "🚀 लाइव टेस्ट रूम बनाएं और लिंक जनरेट करें"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>

        {/* 🎯 MODAL: ROOM CREATED & SHARE LINK */}
        {createdRoom && (
          <div className="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 text-center space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-400 via-indigo-600 to-amber-400" />
              
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-xs border border-emerald-200/80">
                🎉
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  लाइव टेस्ट तैयार है (Live Room Ready)
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {createdRoom.test?.testTitle}
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  संस्थान: {createdRoom.test?.instituteName} | कुल प्रश्न: {createdRoom.test?.questionsCount}
                </p>
              </div>

              {/* Room Code Pill */}
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                  यूनिक रूम कोड (Room Code)
                </span>
                <p className="text-3xl font-black text-indigo-600 tracking-widest tabular-nums">
                  {createdRoom.testCode}
                </p>
              </div>

              {/* Student Shareable Link */}
              <div className="space-y-2 text-left">
                <span className="text-xs font-bold text-slate-700 block">
                  छात्रों के साथ शेयर करने का लिंक:
                </span>
                <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200">
                  <input
                    type="text"
                    readOnly
                    value={createdRoom.studentUrl}
                    className="bg-transparent text-xs text-slate-700 font-semibold flex-1 outline-none truncate"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyLink(createdRoom.studentUrl)}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0"
                    title="लिंक कॉपी करें"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Actions: WhatsApp & Enter Room */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const waMsg = `📢 *${createdRoom.test?.instituteName} - लाइव टेस्ट सूचना*\n\nप्रिय छात्रों, आपका *${createdRoom.test?.testTitle}* लाइव होने जा रहा है।\n\n🔗 नीचे दिए गए लिंक पर क्लिक करें और अपना नाम व रोल नंबर दर्ज करके टेस्ट शुरू करें:\n${createdRoom.studentUrl}\n\nकमरा कोड: *${createdRoom.testCode}*\n\nशुभकामनाएं! 🎯`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(waMsg)}`, "_blank");
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-200 active:scale-98"
                >
                  <Share2 className="w-4 h-4" />
                  <span>व्हाट्सएप पर छात्रों को लिंक भेजें (Share on WhatsApp)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.location.href = createdRoom.hostWarRoomUrl;
                  }}
                  className="w-full py-3.5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98"
                >
                  <span>🚀 टीचर वॉर रूम में प्रवेश करें (Start Examiner War Room)</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
