"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  BookOpen,
  Zap,
  ChevronRight,
  Sparkles,
  ArrowUp,
  X,
  Bookmark,
  CheckCircle2,
  Layers,
  GraduationCap,
  Flame,
  FileText,
  Clock,
  Play,
  Share2,
  Calendar,
  ShieldCheck,
  Check,
} from "lucide-react";

const EXAM_DATA = [
  {
    id: "ssc-cgl",
    slug: "ssc-cgl",
    category: "ssc",
    title: "SSC CGL 2026",
    hindiTitle: "संयुक्त स्नातक स्तरीय परीक्षा (Tier-I & II)",
    dept: "Staff Selection Commission (Govt. of India)",
    badgeText: "🔴 टियर-I मॉक लाइव",
    badgeType: "hot",
    icon: "🏆",
    iconBg: "bg-amber-50 text-amber-600 border-amber-200",
    totalModules: 48,
    freeTests: 6,
    features: ["Tier-I Full Mocks", "Tier-II Mocks", "Chapter PYQs", "Maths Formulae"],
    syllabus: [
      { section: "जनरल इंटेलिजेंस व रीजनिंग", topics: "एनालॉजी, कोडिंग-डिकोडिंग, सिम्बॉलिक ऑपरेशन्स", weightage: "25 प्रश्न (50 अंक)" },
      { section: "सामान्य जागरूकता (GA)", topics: "भारतीय इतिहास, संस्कृति, संविधान, समसामयिकी 2025-26", weightage: "25 प्रश्न (50 अंक)" },
      { section: "क्वांटिटेटिव एप्टीट्यूड", topics: "अंकगणित, बीजगणित, त्रिकोणमिति, ज्यामिति", weightage: "25 प्रश्न (50 अंक)" },
      { section: "अंग्रेजी समझ (English)", topics: "वोकैबुलरी, ग्रामर एरर, कॉम्प्रीहेंशन", weightage: "25 प्रश्न (50 अंक)" }
    ],
    mockSets: [
      { title: "SSC CGL Tier-I ऑल इंडिया लाइव मॉक 01", questions: 100, duration: "60 मिनट", isFree: true },
      { title: "SSC CGL Tier-I ऑल इंडिया लाइव मॉक 02", questions: 100, duration: "60 मिनट", isFree: true },
      { title: "जनरल अवेयरनेस 2025-26 स्पेशल मॉक", questions: 50, duration: "30 मिनट", isFree: true },
      { title: "रीजनिंग 500 महत्वपूर्ण PYQ सेट", questions: 100, duration: "60 मिनट", isFree: false }
    ]
  },
  {
    id: "ssc-gd",
    slug: "ssc-gd-constable",
    category: "ssc",
    title: "SSC GD Constable",
    hindiTitle: "जनरल ड्यूटी कांस्टेबल (CAPF, BSF, CISF)",
    dept: "Ministry of Home Affairs & SSC",
    badgeText: "52,000+ पद",
    badgeType: "popular",
    icon: "🛡️",
    iconBg: "bg-blue-50 text-blue-600 border-blue-200",
    totalModules: 36,
    freeTests: 5,
    features: ["Full-Length Tests", "हिंदी व अंग्रेजी भाषा", "फिजिकल टेस्ट गाइड"],
    syllabus: [
      { section: "सामान्य बुद्धिमत्ता एवं तर्कशक्ति", topics: "चित्र आधारित प्रश्न, कोडिंग, वर्गीकरण", weightage: "20 प्रश्न (40 अंक)" },
      { section: "सामान्य ज्ञान व सामान्य जानकारी", topics: "भारत व उसके पड़ोसी देश, खेल, इतिहास", weightage: "20 प्रश्न (40 अंक)" },
      { section: "प्रारंभिक गणित", topics: "संख्या प्रणाली, औसत, अनुपात, लाभ-हानि", weightage: "20 प्रश्न (40 अंक)" },
      { section: "हिंदी / English", topics: "व्याकरण, विलोम, पर्यायवाची, मुहावरे", weightage: "20 प्रश्न (40 अंक)" }
    ],
    mockSets: [
      { title: "SSC GD फुल मॉक टेस्ट 01 (न्यू पैटर्न)", questions: 80, duration: "60 मिनट", isFree: true },
      { title: "SSC GD हिंदी व्याकरण स्पेशल 40 प्रश्न", questions: 40, duration: "30 मिनट", isFree: true },
      { title: "सामान्य ज्ञान व विज्ञान बूस्टर", questions: 40, duration: "30 मिनट", isFree: true }
    ]
  },
  {
    id: "rrb-ntpc",
    slug: "rrb-ntpc",
    category: "railways",
    title: "RRB NTPC (Grad & Undergrad)",
    hindiTitle: "रेलवे गैर-तकनीकी लोकप्रिय श्रेणियां",
    dept: "Railway Recruitment Boards (Indian Railways)",
    badgeText: "CBT 1 & 2 Mocks",
    badgeType: "new",
    icon: "🚆",
    iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
    totalModules: 42,
    freeTests: 8,
    features: ["CBT-1 Tests", "CBT-2 Mocks", "General Awareness 2026", "Railway GK"],
    syllabus: [
      { section: "General Awareness (GA)", topics: "राष्ट्रीय/अंतर्राष्ट्रीय समसामयिकी, भारतीय रेलवे इतिहास", weightage: "40 प्रश्न (40 अंक)" },
      { section: "गणित (Mathematics)", topics: "संख्या पद्धति, प्रतिशत, कार्य-समय, क्षेत्रमिति", weightage: "30 प्रश्न (30 अंक)" },
      { section: "General Intelligence & Reasoning", topics: "समानता, कोडिंग, वेन आरेख, विश्लेषणात्मक तर्क", weightage: "30 प्रश्न (30 अंक)" }
    ],
    mockSets: [
      { title: "RRB NTPC CBT-1 फुल लेंथ मॉक 01", questions: 100, duration: "90 मिनट", isFree: true },
      { title: "रेलवे सामान्य विज्ञान 100 महत्वपूर्ण PYQ", questions: 100, duration: "60 मिनट", isFree: true },
      { title: "रेलवे स्टेटिक GK व करंट अफेयर्स 2026", questions: 50, duration: "40 मिनट", isFree: true }
    ]
  },
  {
    id: "rrb-group-d",
    slug: "rrb-group-d",
    category: "railways",
    title: "RRB Group D (Level-1)",
    hindiTitle: "रेलवे ग्रुप डी भर्ती परीक्षा",
    dept: "Railway Recruitment Cell (RRC)",
    icon: "⚡",
    iconBg: "bg-teal-50 text-teal-600 border-teal-200",
    totalModules: 30,
    freeTests: 4,
    features: ["General Science Special", "Reasoning Drills", "Solved PYQ 2018-2022"],
    syllabus: [
      { section: "सामान्य विज्ञान (Science)", topics: "10वीं कक्षा स्तर की भौतिकी, रसायन व जीव विज्ञान", weightage: "25 प्रश्न" },
      { section: "गणित (Maths)", topics: "सरलीकरण, अनुपात, चाल-दूरी, त्रिकोणमिति", weightage: "25 प्रश्न" },
      { section: "रीजनिंग", topics: "दिशा-दूरी, रक्त संबंध, कथन-निष्कर्ष", weightage: "30 प्रश्न" },
      { section: "करंट अफेयर्स व समसामयिकी", topics: "योजनाएं, वैज्ञानिक खोज, खेल व पुरस्कार", weightage: "20 प्रश्न" }
    ],
    mockSets: [
      { title: "ग्रुप डी सामान्य विज्ञान 50 स्पेशल प्रश्न", questions: 50, duration: "45 मिनट", isFree: true },
      { title: "फुल मॉक टेस्ट 01 (CBT पैटर्न)", questions: 100, duration: "90 मिनट", isFree: true }
    ]
  },
  {
    id: "mp-police",
    slug: "mp-police",
    category: "police",
    title: "MP Police Constable & SI",
    hindiTitle: "मध्य प्रदेश पुलिस उपनिरीक्षक व आरक्षक",
    dept: "MPESB / मध्य प्रदेश पुलिस भर्ती बोर्ड",
    badgeText: "मध्य प्रदेश विशेष",
    badgeType: "popular",
    icon: "🚔",
    iconBg: "bg-indigo-50 text-indigo-600 border-indigo-200",
    totalModules: 28,
    freeTests: 4,
    features: ["MP GK Special (1,500 Qs)", "Science Booster", "10 Full Mocks"],
    syllabus: [
      { section: "सामान्य ज्ञान व तार्किक ज्ञान", topics: "मध्य प्रदेश का इतिहास, नदियां, अभयारण्य, संस्कृति", weightage: "40 अंक" },
      { section: "बौद्धिक क्षमता व मानसिक अभिरुचि", topics: "तार्किक निष्कर्ष, पहेलियां, सादृश्यता", weightage: "30 अंक" },
      { section: "विज्ञान एवं सरल अंकगणित", topics: "दैनिक विज्ञान, समीकरण, प्रतिशत, लाभ-हानि", weightage: "30 अंक" }
    ],
    mockSets: [
      { title: "MP पुलिस आरक्षक सम्पूर्ण मॉक 01", questions: 100, duration: "120 मिनट", isFree: true },
      { title: "MP GK 100 रामबाण प्रश्न सेट", questions: 100, duration: "60 मिनट", isFree: true }
    ]
  },
  {
    id: "up-police",
    slug: "up-police",
    category: "police",
    title: "UP Police Constable & SI",
    hindiTitle: "उत्तर प्रदेश पुलिस नागरिक पुलिस भर्ती",
    dept: "UPPRPB लखनऊ",
    badgeText: "विशाल भर्ती",
    badgeType: "hot",
    icon: "🚨",
    iconBg: "bg-rose-50 text-rose-600 border-rose-200",
    totalModules: 35,
    freeTests: 6,
    features: ["सामान्य हिंदी Special", "मूलविधि व संविधान", "पिछले 10 वर्ष के हल पेपर"],
    syllabus: [
      { section: "सामान्य ज्ञान", topics: "UP स्पेशल, कृषि, वाणिज्य, पर्यावरण, GST", weightage: "38 प्रश्न (76 अंक)" },
      { section: "सामान्य हिंदी", topics: "वर्णमाला, तद्भव-तत्सम, समास, लोकोक्तियाँ", weightage: "37 प्रश्न (74 अंक)" },
      { section: "संख्यात्मक व मानसिक योग्यता", topics: "दशमलव, साधारण ब्याज, ग्राफ तालिका", weightage: "38 प्रश्न (76 अंक)" },
      { section: "मानसिक अभिरुचि व बुद्धि परीक्षा", topics: "जनहित, कानून व्यवस्था, अपराध नियंत्रण", weightage: "37 प्रश्न (74 अंक)" }
    ],
    mockSets: [
      { title: "UP पुलिस 150 प्रश्न सम्पूर्ण मॉक टेस्ट", questions: 150, duration: "120 मिनट", isFree: true },
      { title: "सामान्य हिंदी 100 अति महत्वपूर्ण प्रश्न", questions: 100, duration: "60 मिनट", isFree: true }
    ]
  },
  {
    id: "ibps-po",
    slug: "ibps-po",
    category: "banking",
    title: "IBPS & SBI PO / Clerk",
    hindiTitle: "बैंकिंग कार्मिक चयन संस्थान (Probationary Officer)",
    dept: "IBPS / State Bank of India",
    icon: "🏦",
    iconBg: "bg-cyan-50 text-cyan-600 border-cyan-200",
    totalModules: 40,
    freeTests: 5,
    features: ["Prelims Speed Tests", "Mains Reasoning", "Banking Awareness 2026"],
    syllabus: [
      { section: "Quantitative Aptitude", topics: "Data Interpretation (DI), Simplification, Series", weightage: "35 प्रश्न (35 अंक)" },
      { section: "Reasoning Ability", topics: "Puzzles, Seating Arrangement, Syllogism", weightage: "35 प्रश्न (35 अंक)" },
      { section: "English Language", topics: "Reading Comprehension, Cloze Test, Error Spotting", weightage: "30 प्रश्न (30 अंक)" }
    ],
    mockSets: [
      { title: "SBI / IBPS PO Prelims ऑल इंडिया मॉक", questions: 100, duration: "60 मिनट", isFree: true },
      { title: "डाटा इंटरप्रिटेशन (DI) 5 सेट्स प्रैक्टिस", questions: 25, duration: "20 मिनट", isFree: true }
    ]
  }
];

const CATEGORIES = [
  { id: "all", label: "All Exams", icon: "🌐", count: "50+" },
  { id: "ssc", label: "SSC Exams", icon: "🦁", count: "12" },
  { id: "railways", label: "Railways RRB", icon: "🚆", count: "8" },
  { id: "police", label: "Police & State", icon: "🚔", count: "16" },
  { id: "banking", label: "Banking & IBPS", icon: "🏦", count: "9" }
];

export default function GovtExamsPage() {
  const router = useRouter();
  const [selectedCat, setSelectedCat] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [savedExams, setSavedExams] = useState({ "ssc-cgl": true });

  // Modal states
  const [selectedExamDetail, setSelectedExamDetail] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState("mocks");
  const [activeShortcutModal, setActiveShortcutModal] = useState(null);

  const toggleSave = (id, e) => {
    e.stopPropagation();
    setSavedExams((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredExams = useMemo(() => {
    return EXAM_DATA.filter((exam) => {
      const matchesCat = selectedCat === "all" || exam.category === selectedCat;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        exam.title.toLowerCase().includes(q) ||
        (exam.hindiTitle && exam.hindiTitle.toLowerCase().includes(q)) ||
        exam.dept.toLowerCase().includes(q) ||
        exam.features.some((f) => f.toLowerCase().includes(q));

      return matchesCat && matchesSearch;
    });
  }, [selectedCat, searchQuery]);

  return (
    <div className="w-full min-h-screen bg-slate-50/70 select-none pb-32">
      <div className="w-full max-w-2xl mx-auto px-3.5 pt-3.5 space-y-4">
        
        {/* ================= 1. COMPACT HERO HEADER ================= */}
        <section className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-4 sm:p-5 relative overflow-hidden shadow-lg border border-indigo-800/40">
          <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -mr-8 -mt-8" />
          <div className="absolute bottom-0 left-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none -ml-8 -mb-8" />

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide text-indigo-200 border border-white/15">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>🏛️ भारत की प्रमुख प्रतियोगी परीक्षाएं</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
              Government Exam{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200">
                Mastery Hub
              </span>
            </h1>

            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Complete preparation portal with Syllabus, Career Guides, Digital FlexBooks with Chapter Quizzes, and Official Mocks.
            </p>

            {/* 3 Micro Stats */}
            <div className="grid grid-cols-3 gap-2 pt-3 mt-1 border-t border-white/15 text-center">
              <div className="bg-white/5 py-1.5 rounded-xl border border-white/5">
                <span className="text-sm font-black text-amber-400 block font-mono">50+</span>
                <span className="text-[10px] text-slate-300 font-medium">प्रमुख परीक्षाएं</span>
              </div>
              <div className="bg-white/5 py-1.5 rounded-xl border border-white/5">
                <span className="text-sm font-black text-emerald-400 block font-mono">100% Free</span>
                <span className="text-[10px] text-slate-300 font-medium">मॉक टेस्ट</span>
              </div>
              <div className="bg-white/5 py-1.5 rounded-xl border border-white/5">
                <span className="text-sm font-black text-indigo-300 block font-mono">2018–2025</span>
                <span className="text-[10px] text-slate-300 font-medium">सॉल्व्ड PYQ पेपर्स</span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 2. SEARCH & QUICK CLEAR ================= */}
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 50+ exams (e.g. SSC CGL, RRB NTPC, MP SI)..."
              className="w-full bg-white border border-slate-200/90 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                aria-label="क्लियर करें"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Horizontal Category Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-3.5 px-3.5 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCat === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCat(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 ring-2 ring-indigo-500/20"
                      : "bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= 3. THREE FAST-ACCESS SHORTCUT TILES ================= */}
        <div className="grid grid-cols-3 gap-2">
          {/* FlexBooks */}
          <div
            onClick={() => setActiveShortcutModal("flexbooks")}
            className="bg-white p-2.5 rounded-2xl border border-slate-200/90 hover:border-indigo-300 transition-all flex flex-col justify-between cursor-pointer group shadow-2xs active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xl">📚</span>
              <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">FREE</span>
            </div>
            <div>
              <h4 className="text-[11px] font-black text-slate-900 group-hover:text-indigo-600 leading-tight">
                Digital FlexBooks
              </h4>
              <p className="text-[9px] text-slate-400 mt-0.5">थ्योरी व नोट्स</p>
            </div>
          </div>

          {/* Solved PYQs */}
          <div
            onClick={() => setActiveShortcutModal("pyq")}
            className="bg-white p-2.5 rounded-2xl border border-slate-200/90 hover:border-indigo-300 transition-all flex flex-col justify-between cursor-pointer group shadow-2xs active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xl">⚡</span>
              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-mono">2025</span>
            </div>
            <div>
              <h4 className="text-[11px] font-black text-slate-900 group-hover:text-indigo-600 leading-tight">
                Solved PYQs
              </h4>
              <p className="text-[9px] text-slate-400 mt-0.5">पिछले वर्ष के हल</p>
            </div>
          </div>

          {/* Daily Current */}
          <div
            onClick={() => setActiveShortcutModal("current")}
            className="bg-white p-2.5 rounded-2xl border border-slate-200/90 hover:border-indigo-300 transition-all flex flex-col justify-between cursor-pointer group shadow-2xs active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xl">🎯</span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">DAILY</span>
            </div>
            <div>
              <h4 className="text-[11px] font-black text-slate-900 group-hover:text-indigo-600 leading-tight">
                Daily Current
              </h4>
              <p className="text-[9px] text-slate-400 mt-0.5">10Q स्पीड टेस्ट</p>
            </div>
          </div>
        </div>

        {/* Section Heading & Result Meta */}
        <div className="flex items-center justify-between px-1 pt-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <span>🏛️</span>
            <span>
              {CATEGORIES.find((c) => c.id === selectedCat)?.label || "All Exams"} ({filteredExams.length})
            </span>
          </h2>
          <span className="text-[11px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            100% फ्री मॉक टेस्ट
          </span>
        </div>

        {/* ================= 4. HIGH-EFFICIENCY EXAM CARDS ================= */}
        <div className="space-y-3">
          {filteredExams.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-slate-200">
              <span className="text-3xl block mb-2">🔍</span>
              <h4 className="text-xs font-bold text-slate-800">कोई परीक्षा नहीं मिली</h4>
              <p className="text-[11px] text-slate-400 mt-1">कृपया स्पेलिंग जांचें या कोई अन्य श्रेणी चुनें।</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCat("all");
                }}
                className="mt-3 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 cursor-pointer"
              >
                सभी परीक्षाएं दिखाएं
              </button>
            </div>
          ) : (
            filteredExams.map((exam) => {
              const isSaved = !!savedExams[exam.id];

              return (
                <div
                  key={exam.id}
                  onClick={() => {
                    setSelectedExamDetail(exam);
                    setActiveDetailTab("mocks");
                  }}
                  className="bg-white rounded-3xl p-3.5 border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between group relative cursor-pointer"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0 border shadow-inner ${exam.iconBg}`}
                      >
                        {exam.icon}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {exam.title}
                          </h3>
                          {exam.badgeText && (
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                                exam.badgeType === "hot"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : exam.badgeType === "new"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : "bg-indigo-50 text-indigo-800 border border-indigo-200"
                              }`}
                            >
                              {exam.badgeText}
                            </span>
                          )}
                        </div>

                        {exam.hindiTitle && (
                          <p className="text-[11px] font-semibold text-slate-600 mt-0.5 leading-snug">
                            {exam.hindiTitle}
                          </p>
                        )}

                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{exam.dept}</p>
                      </div>
                    </div>

                    {/* Interactive Bookmark Button */}
                    <button
                      type="button"
                      onClick={(e) => toggleSave(exam.id, e)}
                      className={`p-1.5 rounded-xl border transition-all active:scale-90 cursor-pointer ${
                        isSaved
                          ? "bg-amber-50 text-amber-500 border-amber-200 shadow-2xs"
                          : "bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600"
                      }`}
                      title={isSaved ? "बुकमार्क हटाया" : "बुकमार्क करें"}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-amber-500" : ""}`} />
                    </button>
                  </div>

                  {/* Feature Tag Chips */}
                  <div className="flex flex-wrap gap-1.5 my-2.5">
                    {exam.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-bold bg-slate-50 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200/70"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Card Footer: Metrics & View Details Action */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 font-mono">
                        <Layers className="w-3.5 h-3.5 text-indigo-600" />
                        {exam.totalModules}+ Modules
                      </span>
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {exam.freeTests} Free Mocks
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedExamDetail(exam);
                        setActiveDetailTab("mocks");
                      }}
                      className="inline-flex items-center gap-1 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 px-3 py-1.5 rounded-xl shadow-xs shadow-indigo-600/30 transition-all cursor-pointer"
                    >
                      <span>View Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* ================= MODAL 1: EXAM DETAIL & MOCK SETS ================= */}
      {selectedExamDetail && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedExamDetail(null)}
        >
          <div
            className="w-full max-w-[430px] bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-6 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-2xl border ${selectedExamDetail.iconBg}`}>
                  {selectedExamDetail.icon}
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 leading-snug">
                    {selectedExamDetail.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {selectedExamDetail.dept}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedExamDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Subtabs: Mocks vs Syllabus */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-3 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveDetailTab("mocks")}
                className={`py-2 rounded-xl transition-all cursor-pointer ${
                  activeDetailTab === "mocks"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                📝 मॉक टेस्ट ({selectedExamDetail.mockSets.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab("syllabus")}
                className={`py-2 rounded-xl transition-all cursor-pointer ${
                  activeDetailTab === "syllabus"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                📖 सिलेबस (Pattern)
              </button>
            </div>

            {/* Tab Content */}
            <div className="overflow-y-auto space-y-2.5 pr-1 flex-1 text-xs">
              {activeDetailTab === "mocks" ? (
                <>
                  <p className="text-[11px] font-black text-slate-700">उपलब्ध ऑनलाइन टेस्ट सेट्स:</p>
                  {selectedExamDetail.mockSets.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 hover:border-indigo-300 transition-all flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs">{m.title}</span>
                          {m.isFree && (
                            <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                              FREE
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {m.questions} प्रश्न • {m.duration} • नकारात्मक अंकन लागू
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedExamDetail(null);
                          router.push(`/govt-exams/${selectedExamDetail.slug}`);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs active:scale-95 transition flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>स्टार्ट</span>
                      </button>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <p className="text-[11px] font-black text-slate-700">नवीनतम परीक्षा पैटर्न व विषय सूची:</p>
                  {selectedExamDetail.syllabus.map((s, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{s.section}</span>
                        <span className="text-indigo-600 font-mono text-[11px]">{s.weightage}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">{s.topics}</p>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 mt-2 space-y-2">
              <Link
                href={`/govt-exams/${selectedExamDetail.slug}`}
                onClick={() => setSelectedExamDetail(null)}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all active:scale-95 text-center"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>फ्री मॉक टेस्ट व पूर्ण तैयारी शुरू करें</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: FAST SHORTCUTS MODAL ================= */}
      {activeShortcutModal && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveShortcutModal(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {activeShortcutModal === "flexbooks" ? "📚" : activeShortcutModal === "pyq" ? "⚡" : "🎯"}
                </span>
                <h3 className="font-black text-sm text-slate-900">
                  {activeShortcutModal === "flexbooks"
                    ? "Digital FlexBooks & Notes"
                    : activeShortcutModal === "pyq"
                    ? "Solved PYQs (2018–2025)"
                    : "Daily Current Affairs Quiz"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveShortcutModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              {activeShortcutModal === "flexbooks" && (
                <>
                  <p className="font-medium">विषय-वार डिजिटल नोट्स और फॉर्मूला शीट्स सीधे अपने फ़ोन पर पढ़ें:</p>
                  <div className="space-y-1.5 font-bold">
                    <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl flex justify-between items-center">
                      <span>📐 क्वांटिटेटिव एप्टीट्यूड फॉर्मूला बुक</span>
                      <span className="text-indigo-600 text-[10px] bg-white px-1.5 py-0.5 rounded border border-indigo-100">FREE</span>
                    </div>
                    <div className="p-2 bg-amber-50 border border-amber-100 rounded-xl flex justify-between items-center">
                      <span>📜 भारतीय संविधान व राजव्यवस्था 500 फैक्ट्स</span>
                      <span className="text-amber-800 text-[10px] bg-white px-1.5 py-0.5 rounded border border-amber-100">FREE</span>
                    </div>
                  </div>
                </>
              )}

              {activeShortcutModal === "pyq" && (
                <>
                  <p className="font-medium">पिछले 7 वर्षों के SSC, रेलवे व पुलिस परीक्षाओं के आधिकारिक प्रश्नपत्र:</p>
                  <div className="space-y-1.5 font-bold">
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                      <span>SSC CGL 2024 Tier-I (सभी 39 शिफ्ट्स)</span>
                      <span className="text-emerald-700 text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">सॉल्व्ड</span>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                      <span>RRB NTPC CBT-1 & 2 PYQ बैंक</span>
                      <span className="text-emerald-700 text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">सॉल्व्ड</span>
                    </div>
                  </div>
                </>
              )}

              {activeShortcutModal === "current" && (
                <>
                  <p className="font-medium">आज के प्रमुख राष्ट्रीय व अंतर्राष्ट्रीय समाचारों पर आधारित 10 प्रश्न:</p>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 font-bold space-y-1">
                    <p>🗓️ आज का क्विज़: 15 अक्टूबर 2026</p>
                    <p className="text-[11px] font-normal text-emerald-800">10 वस्तुनिष्ठ प्रश्न • 5 मिनट • ऑल इंडिया रैंक</p>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                const target =
                  activeShortcutModal === "flexbooks"
                    ? "/gk-book"
                    : activeShortcutModal === "pyq"
                    ? "/mock-tests"
                    : "/daily-current-affairs";
                setActiveShortcutModal(null);
                router.push(target);
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs active:scale-95 transition cursor-pointer"
            >
              खोलें और अभ्यास करें →
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
