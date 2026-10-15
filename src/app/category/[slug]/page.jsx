"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useData } from "@/context/DataContext";
import { useQuiz } from "@/context/QuizContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTier } from "@/context/TierContext";
import {
  ArrowLeft,
  Search,
  Timer,
  Eye,
  CheckCircle2,
  Trophy,
  Sparkles,
  Rocket,
  X,
  Clock,
  Layers,
  ChevronRight,
  Flame,
  Check,
  RotateCcw,
  BookOpen,
  Zap,
  Play,
  HelpCircle,
  Swords,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

// Curated Top Practice Subjects for quick topic switching
const AVAILABLE_TOPICS = [
  { id: "india-gk", slug: "india-gk", name: "India GK (भारत सामान्य ज्ञान)", icon: "🇮🇳", questions: 3468, sets: 174 },
  { id: "world-gk", slug: "world-gk", name: "विश्व भूगोल व इतिहास", icon: "🌍", questions: 1840, sets: 92 },
  { id: "science", slug: "science", name: "सामान्य विज्ञान (Science)", icon: "🔬", questions: 1250, sets: 62 },
  { id: "current-affairs", slug: "current-affairs", name: "समसामयिकी (Current Affairs)", icon: "⚡", questions: 980, sets: 49 },
  { id: "constitution", slug: "constitution", name: "भारतीय संविधान व राजव्यवस्था", icon: "📜", questions: 1420, sets: 71 },
];

// Fallback sample questions for preview modal when dynamic questions aren't pre-loaded
const SAMPLE_PREVIEW_QUESTIONS = [
  {
    num: 1,
    text: "भारत के प्रथम मुख्य चुनाव आयुक्त कौन थे?",
    options: ["A) सुकुमार सेन", "B) के.वी.के. सुंदरम", "C) टी.एन. शेषन", "D) सुनील अरोड़ा"],
    correct: 0,
  },
  {
    num: 2,
    text: "भारतीय संविधान की प्रारूप समिति (Drafting Committee) के अध्यक्ष कौन थे?",
    options: ["A) डॉ. राजेन्द्र प्रसाद", "B) डॉ. बी.आर. अम्बेडकर", "C) जवाहरलाल नेहरू", "D) सरदार पटेल"],
    correct: 1,
  },
  {
    num: 3,
    text: "भारत में 'राष्ट्रीय विज्ञान दिवस' किस वैज्ञानिक के सम्मान में मनाया जाता है?",
    options: ["A) डॉ. ए.पी.जे. अब्दुल कलाम", "B) होमी जहाँगीर भाभा", "C) सी.वी. रमन", "D) सत्येन्द्र नाथ बोस"],
    correct: 2,
  },
  {
    num: 4,
    text: "भारतीय मानक समय (IST) किस देशांतर रेखा पर आधारित है?",
    options: ["A) 82.5° पूर्वी देशांतर", "B) 75° पूर्वी देशांतर", "C) 90° पूर्वी देशांतर", "D) 0° ग्रीनविच"],
    correct: 0,
  },
];

export default function CategoryPracticeSetsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const setParam = searchParams?.get("set") || null;
  const initialMode = searchParams?.get("mode") === "live" ? "live" : "solo";

  const currentSlug = params?.slug ? String(params.slug).toLowerCase() : "india-gk";

  const { data: session } = useSession();
  const { startQuizSet } = useQuiz();
  const { isHindi, language } = useLanguage();
  const { tier } = useTier();
  const { categories } = useData();

  // Active Category & Questions state
  const [categoryData, setCategoryData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mode Selection: 'solo' (Solo Practice) | 'live' (1v1 Live Quiz Battle)
  const [quizMode, setQuizMode] = useState(initialMode);

  // Configuration States
  const [selectedSet, setSelectedSet] = useState(setParam ? parseInt(setParam, 10) : 1);
  const [selectedTimer, setSelectedTimer] = useState("30s"); // 'off' | '15s' | '30s' | '60s'
  const [activeRange, setActiveRange] = useState("1–25");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Sheets
  const [previewSetId, setPreviewSetId] = useState(null);
  const [isChangeTopicOpen, setIsChangeTopicOpen] = useState(false);
  const [isTestStarting, setIsTestStarting] = useState(false);

  // Track completed sets & scores
  const [progressMap, setProgressMap] = useState({});

  // 1. Fetch Category & Questions
  useEffect(() => {
    if (!currentSlug) return;
    setLoading(true);

    fetch(`/api/categories/${currentSlug}?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Category not found");
        return res.json();
      })
      .then((data) => {
        setCategoryData(data);
        if (Array.isArray(data.questions)) {
          setQuestions(data.questions);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Could not fetch category API, using fallback config:", err);
        const match = AVAILABLE_TOPICS.find((t) => t.slug === currentSlug) || AVAILABLE_TOPICS[0];
        setCategoryData({
          id: match.id,
          slug: match.slug,
          topic: match.name,
          emoji: match.icon,
          questionCount: match.questions,
        });
        setLoading(false);
      });
  }, [currentSlug]);

  // 2. Load User Progress / Local Scores
  useEffect(() => {
    const map = {};
    // Load guest completed scores from localStorage
    try {
      const guestScores = JSON.parse(localStorage.getItem("quiz_guest_scores") || "{}");
      Object.keys(guestScores).forEach((key) => {
        if (key.includes(currentSlug)) {
          const item = guestScores[key];
          const setMatch = key.match(/set_(\d+)/);
          if (setMatch && setMatch[1]) {
            const setNum = parseInt(setMatch[1], 10);
            map[setNum] = {
              completed: true,
              score: item.score || 16,
              total: item.total || 20,
              accuracy: Math.round(((item.score || 16) / (item.total || 20)) * 100),
            };
          }
        }
      });
    } catch {}

    // Seed realistic gamified demonstration state if fresh user (matches reference prototype)
    if (!map[1]) map[1] = { completed: true, score: 18, total: 20, accuracy: 90 };
    if (!map[2]) map[2] = { completed: true, score: 14, total: 20, accuracy: 70 };
    if (!map[4]) map[4] = { completed: true, score: 19, total: 20, accuracy: 95 };
    if (!map[8]) map[8] = { completed: true, score: 12, total: 20, accuracy: 60 };

    setProgressMap(map);
  }, [currentSlug]);

  // Determine current active topic metadata
  const currentTopic = useMemo(() => {
    const preset = AVAILABLE_TOPICS.find((t) => t.slug === currentSlug);
    if (preset) return preset;
    if (categoryData) {
      return {
        id: categoryData.id || currentSlug,
        slug: categoryData.slug || currentSlug,
        name: categoryData.topic || currentSlug,
        icon: categoryData.emoji === "IN" ? "🇮🇳" : (categoryData.emoji || "📚"),
        questions: categoryData.questionCount || (questions.length > 0 ? questions.length : 3468),
        sets: Math.max(1, Math.ceil((categoryData.questionCount || questions.length || 3468) / 20)),
      };
    }
    return AVAILABLE_TOPICS[0];
  }, [categoryData, currentSlug, questions.length]);

  // Calculate total sets count
  const totalSetsCount = useMemo(() => {
    if (currentSlug === "india-gk") return 174;
    if (questions.length > 0) return Math.max(1, Math.ceil(questions.length / 20));
    return currentTopic.sets || 174;
  }, [currentSlug, questions.length, currentTopic.sets]);

  // Generate 25-step ranges (e.g., 1–25, 26–50, 51–75...)
  const ranges = useMemo(() => {
    const list = [];
    const step = 25;
    for (let start = 1; start <= totalSetsCount; start += step) {
      const end = Math.min(start + step - 1, totalSetsCount);
      list.push({ label: `${start}–${end}`, start, end });
    }
    return list.length > 0 ? list : [{ label: "1–25", start: 1, end: 25 }];
  }, [totalSetsCount]);

  // Generate all sets with questions & mastery metadata
  const allSets = useMemo(() => {
    return Array.from({ length: totalSetsCount }, (_, i) => {
      const id = i + 1;
      const progress = progressMap[id];
      const isNew = id === 3 || (!progress && id <= 6);

      // Slice real questions if available
      const startIdx = (id - 1) * 20;
      const setQuestions = questions.slice(startIdx, startIdx + 20);

      return {
        id,
        questionsCount: 20,
        questions: setQuestions,
        completed: Boolean(progress?.completed),
        score: progress?.score || 0,
        accuracy: progress?.accuracy || 0,
        isNew,
      };
    });
  }, [totalSetsCount, progressMap, questions]);

  // Filter sets according to active range & search input
  const displayedSets = useMemo(() => {
    if (searchQuery.trim()) {
      const num = parseInt(searchQuery.replace(/\D/g, ""), 10);
      if (!isNaN(num)) {
        return allSets.filter((s) => s.id === num);
      }
      return allSets.filter((s) => `सेट ${s.id}`.includes(searchQuery) || `set ${s.id}`.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    const currentRangeObj = ranges.find((r) => r.label === activeRange) || ranges[0];
    return allSets.filter((s) => s.id >= currentRangeObj.start && s.id <= currentRangeObj.end);
  }, [activeRange, searchQuery, allSets, ranges]);

  const activeSetData = useMemo(() => {
    return allSets.find((s) => s.id === selectedSet) || allSets[0] || { id: 1, questionsCount: 20 };
  }, [selectedSet, allSets]);

  // Timer seconds conversion
  const timerSeconds = useMemo(() => {
    if (selectedTimer === "off") return 0;
    if (selectedTimer === "15s") return 15;
    if (selectedTimer === "60s") return 60;
    return 30; // default 30s
  }, [selectedTimer]);

  // Launch Solo Quiz
  const handleLaunchSoloQuiz = () => {
    setIsTestStarting(false);
    toast.success(`🚀 सेट ${selectedSet} शुरू हो रहा है...`);

    // Prepare questions for this set
    let targetQuestions = activeSetData.questions;
    if (!targetQuestions || targetQuestions.length === 0) {
      targetQuestions = Array.from({ length: 20 }, (_, idx) => {
        const sample = SAMPLE_PREVIEW_QUESTIONS[idx % SAMPLE_PREVIEW_QUESTIONS.length];
        return {
          id: `q_${currentSlug}_${selectedSet}_${idx + 1}`,
          text: sample.text,
          options: sample.options,
          correctAnswer: sample.options[sample.correct],
          difficulty: "medium",
        };
      });
    }

    const topicLabel = `${currentTopic.name} सेट ${selectedSet}`;
    startQuizSet(
      categoryData?.id || currentSlug,
      targetQuestions,
      timerSeconds,
      language || "hi",
      selectedSet,
      topicLabel,
      true
    );

    // Save recent category
    try {
      const recent = JSON.parse(localStorage.getItem("quiz_recent_categories") || "[]");
      const filtered = recent.filter((id) => id !== currentSlug);
      filtered.unshift(currentSlug);
      localStorage.setItem("quiz_recent_categories", JSON.stringify(filtered.slice(0, 5)));
    } catch {}

    router.push(`/quiz/${currentSlug}?set=${selectedSet}`);
  };

  // Launch 1v1 Live Multiplayer Room for the selected set
  const handleLaunchLiveBattle = (targetSetNum = selectedSet) => {
    setIsTestStarting(false);
    const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();
    toast.success(isHindi ? `⚔️ सेट ${targetSetNum} के लिए लाइव मुकाबला रूम तैयार किया जा रहा है...` : `Creating Live Room for Set ${targetSetNum}...`);
    router.push(`/live/${sessionId}?is_host=true&categoryId=${categoryData?.id || currentSlug}&setIndex=${targetSetNum}`);
  };

  // Preview Questions for the selected previewSetId
  const previewSetQuestions = useMemo(() => {
    if (!previewSetId) return [];
    const targetSet = allSets.find((s) => s.id === previewSetId);
    if (targetSet && targetSet.questions && targetSet.questions.length > 0) {
      return targetSet.questions.slice(0, 4);
    }
    return SAMPLE_PREVIEW_QUESTIONS;
  }, [previewSetId, allSets]);

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center text-slate-800 antialiased font-sans select-none">
      {/* Mobile-Optimized Frame Container */}
      <div className="w-full max-w-[430px] min-h-screen bg-slate-50 flex flex-col relative shadow-2xl border-x border-slate-200 overflow-x-hidden">

        {/* ================= 1. COMPACT STICKY TOP HEADER ================= */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-700 transition"
              aria-label="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base">{currentTopic.icon}</span>
                <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                  {currentTopic.name}
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {currentTopic.questions.toLocaleString()} प्रश्न उपलब्ध • {totalSetsCount} सेट
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsChangeTopicOpen(true)}
            className="text-xs font-bold text-indigo-600 bg-indigo-50/90 hover:bg-indigo-100 active:scale-95 px-3 py-1.5 rounded-xl border border-indigo-200/80 transition"
          >
            बदलें
          </button>
        </header>

        {/* ================= MAIN SCROLLABLE VIEW ================= */}
        <main className="flex-1 px-3.5 pt-3 pb-52 space-y-3 overflow-y-auto">

          {/* ================= MODE TOGGLE: SOLO vs 1v1 LIVE QUIZ ================= */}
          <div className="flex items-center justify-center">
            <div className="grid grid-cols-2 p-1 w-full bg-slate-200/70 border border-slate-300/70 rounded-2xl shadow-2xs gap-1">
              <button
                type="button"
                onClick={() => setQuizMode("solo")}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  quizMode === "solo"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Rocket className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isHindi ? "सोलो अभ्यास" : "Solo Practice"}</span>
              </button>

              <button
                type="button"
                onClick={() => setQuizMode("live")}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  quizMode === "live"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Swords className="w-3.5 h-3.5 text-amber-300" />
                <span>{isHindi ? "1v1 लाइव मुकाबला" : "Live Battle"}</span>
                <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full tracking-wider animate-pulse">
                  LIVE
                </span>
              </button>
            </div>
          </div>

          {/* ================= 2. SMART CONTROL DECK (ABOVE GRID) ================= */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs space-y-3">
            {/* Timer preference selector */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-indigo-600" />
                {quizMode === "live" ? (isHindi ? "लाइव मुकाबला समय सीमा" : "Live Battle Timer") : (isHindi ? "प्रति प्रश्न समय सीमा" : "Question Timer")}
              </span>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                {selectedTimer === "off" ? "असीमित" : selectedTimer}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: "बंद", value: "off", hint: "No limit" },
                { label: "15s", value: "15s", hint: "तेज़" },
                { label: "30s", value: "30s", hint: "मानक" },
                { label: "60s", value: "60s", hint: "शांत" },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setSelectedTimer(t.value)}
                  className={`py-2 rounded-xl text-xs font-extrabold transition-all flex flex-col items-center justify-center active:scale-95 cursor-pointer ${
                    selectedTimer === t.value
                      ? "bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/25 ring-2 ring-indigo-500/20"
                      : "bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100"
                  }`}
                >
                  <span>{t.label}</span>
                  <span className={`text-[9px] font-normal ${selectedTimer === t.value ? "text-indigo-100" : "text-slate-400"}`}>
                    {t.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Range Carousel Pills */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" /> सेट्स रेंज चुनें
              </span>
              <span className="text-[11px] font-semibold text-slate-400">{totalSetsCount} सेट्स</span>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
              {ranges.map((range) => {
                const isActive = activeRange === range.label && !searchQuery;
                return (
                  <button
                    key={range.label}
                    onClick={() => {
                      setActiveRange(range.label);
                      setSearchQuery("");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all active:scale-95 cursor-pointer ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/10"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unified Numeric & Set Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="सेट नंबर ढूंढें (उदा. 5, 24, 110)..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* ================= 3. TACTILE 2-COLUMN SET GRID ================= */}
          <div className="grid grid-cols-2 gap-2.5">
            {displayedSets.length === 0 ? (
              <div className="col-span-2 py-10 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-4 space-y-2">
                <p className="text-xs font-bold text-slate-700">कोई सेट नहीं मिला!</p>
                <p className="text-[11px] text-slate-400">कृपया 1 से {totalSetsCount} के बीच सेट नंबर दर्ज करें।</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 cursor-pointer"
                >
                  सभी सेट्स रीसेट करें
                </button>
              </div>
            ) : (
              displayedSets.map((set) => {
                const isSelected = selectedSet === set.id;

                return (
                  <div
                    key={set.id}
                    onClick={() => setSelectedSet(set.id)}
                    className={`relative rounded-2xl p-3 border transition-all cursor-pointer flex flex-col justify-between active:scale-[0.98] ${
                      isSelected
                        ? "bg-gradient-to-br from-indigo-50/90 to-violet-50/50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
                        : set.completed
                        ? "bg-white border-emerald-200/90 shadow-2xs hover:shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs"
                    }`}
                  >
                    {/* Card Top: Number & Badges */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-black ${isSelected ? "text-indigo-950" : "text-slate-900"}`}>
                            सेट {set.id}
                          </span>
                          {set.isNew && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded-md">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {set.questionsCount} प्रश्न (~10m)
                        </p>
                      </div>

                      {/* State Badge */}
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : set.completed ? (
                        <div className="flex items-center gap-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-black px-1.5 py-0.5 rounded-md border border-emerald-200">
                          <Trophy className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />
                          <span>{set.score}/20</span>
                        </div>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-300 mt-1 mr-1" />
                      )}
                    </div>

                    {/* Card Bottom: Preview Action & Accuracy */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400">
                        {set.completed ? `${set.accuracy}% सही` : "अनदेखा"}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewSetId(set.id);
                          }}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50/70 hover:bg-indigo-100/70 px-2 py-0.5 rounded-lg border border-indigo-100 transition cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-indigo-500" />
                          <span>देखें</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>

        {/* ================= 4. FIXED FROSTED GLASS ACTION TRAY ================= */}
        <div className="fixed bottom-[62px] sm:bottom-[66px] left-0 right-0 z-40 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom,0px)]">
          <div className="w-full max-w-[430px] bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 px-3.5 shadow-[0_-8px_25px_rgba(0,0,0,0.08)] pointer-events-auto">
            <div className="flex items-center justify-between gap-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">चुना गया:</span>
                  <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    सेट {selectedSet}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-500 font-semibold mt-0.5 truncate">
                  {quizMode === "live" ? "⚔️ 1v1 लाइव मुकाबला" : `${activeSetData.questionsCount} प्रश्न • ${selectedTimer === "off" ? "असीमित" : selectedTimer}`}
                </p>
              </div>

              {quizMode === "live" ? (
                /* LIVE QUIZ CTA */
                <button
                  onClick={() => handleLaunchLiveBattle(selectedSet)}
                  className="flex-1 max-w-[210px] bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 active:scale-95 text-white py-3 px-3.5 rounded-xl font-black text-xs sm:text-sm shadow-md shadow-purple-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Swords className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="truncate">लाइव रूम बनाएं</span>
                </button>
              ) : (
                /* SOLO PRACTICE CTA + QUICK LIVE BUTTON */
                <div className="flex items-center gap-1.5 flex-1 max-w-[225px] justify-end">
                  <button
                    onClick={() => handleLaunchLiveBattle(selectedSet)}
                    title={isHindi ? "सेट 1 के साथ लाइव रूम बनाएं" : "Live Room with Set"}
                    className="p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition cursor-pointer shrink-0"
                  >
                    <Swords className="w-4 h-4 text-purple-600" />
                    <span className="hidden sm:inline">लाइव</span>
                  </button>

                  <button
                    onClick={() => setIsTestStarting(true)}
                    className="flex-1 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-95 text-white py-3 px-3 rounded-xl font-black text-xs sm:text-sm shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Rocket className="w-4 h-4 text-amber-300 shrink-0" />
                    <span className="truncate">क्विज़ शुरू करें</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= MODAL 1: QUESTION PREVIEW BOTTOM SHEET ================= */}
        {previewSetId !== null && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
            onClick={() => setPreviewSetId(null)}
          >
            <div
              className="w-full max-w-[430px] bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-6 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200">
                    सेट {previewSetId}
                  </span>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">प्रश्नों का नमूना</h3>
                    <p className="text-[10px] text-slate-400">कुल 20 वस्तुनिष्ठ प्रश्न</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewSetId(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sample Questions List */}
              <div className="overflow-y-auto space-y-3.5 pr-1 text-xs text-slate-700 flex-1">
                {previewSetQuestions.map((q, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <span className="font-black text-indigo-600 text-[11px] block">
                      प्रश्न {String(idx + 1).padStart(2, "0")}:
                    </span>
                    <p className="font-bold text-slate-800 text-xs">{q.text}</p>
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                      {q.options.map((opt, oIdx) => (
                        <span
                          key={oIdx}
                          className="bg-white p-2 rounded-xl border border-slate-200 font-medium text-slate-700 truncate"
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Dual Action Buttons: Solo Practice OR 1v1 Live Room */}
              <div className="pt-3 border-t border-slate-100 mt-2 flex gap-2">
                <button
                  onClick={() => {
                    setSelectedSet(previewSetId);
                    setPreviewSetId(null);
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>यह सेट चुनें</span>
                </button>

                <button
                  onClick={() => {
                    setPreviewSetId(null);
                    handleLaunchLiveBattle(previewSetId);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md active:scale-95 transition cursor-pointer"
                >
                  <Swords className="w-4 h-4 text-amber-300" />
                  <span>लाइव खेलें</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL 2: CHANGE TOPIC DRAWER ================= */}
        {isChangeTopicOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
            onClick={() => setIsChangeTopicOpen(false)}
          >
            <div
              className="w-full max-w-[430px] bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">विषय बदलें (Change Topic)</h3>
                    <p className="text-[10px] text-slate-400">उपलब्ध अन्य सामान्य ज्ञान विषय</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChangeTopicOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                {AVAILABLE_TOPICS.map((topic) => {
                  const isCurrent = currentTopic.slug === topic.slug;
                  return (
                    <div
                      key={topic.id}
                      onClick={() => {
                        setIsChangeTopicOpen(false);
                        router.push(`/category/${topic.slug}`);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between active:scale-[0.99] ${
                        isCurrent
                          ? "bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-2 bg-slate-50 rounded-xl border border-slate-200">
                          {topic.icon}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{topic.name}</h4>
                          <p className="text-[11px] text-slate-500">
                            {topic.questions.toLocaleString()} प्रश्न • {topic.sets} सेट
                          </p>
                        </div>
                      </div>
                      {isCurrent ? (
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL 3: STARTING TEST CONFIRMATION ================= */}
        {isTestStarting && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl text-center border border-slate-100 animate-in zoom-in-95 duration-150">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                <Rocket className="w-7 h-7 text-amber-300" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">क्विज़ शुरू करने के लिए तैयार?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {currentTopic.name} • <b>सेट {selectedSet}</b>
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-700 space-y-1.5 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-500">प्रश्नों की संख्या:</span>
                  <span className="font-bold text-slate-800">{activeSetData.questionsCount} वस्तुनिष्ठ प्रश्न</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">समय सीमा:</span>
                  <span className="font-bold text-slate-800">
                    {selectedTimer === "off" ? "असीमित" : `${selectedTimer} प्रति प्रश्न`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">मार्किंग:</span>
                  <span className="font-bold text-emerald-700">+1 सही, 0 गलत (कोई नेगेटिव नहीं)</span>
                </div>
              </div>

              {/* Action Buttons: Solo Practice OR 1v1 Live Room */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleLaunchSoloQuiz}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white font-black text-xs rounded-xl shadow-md shadow-indigo-600/20 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Rocket className="w-4 h-4 text-amber-300" />
                  <span>सोलो अभ्यास शुरू करें</span>
                </button>

                <button
                  onClick={() => handleLaunchLiveBattle(selectedSet)}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xs rounded-xl shadow-md shadow-purple-600/20 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Swords className="w-4 h-4 text-amber-300" />
                  <span>⚔️ 1v1 लाइव रूम बनाएं (दोस्तों के साथ खेलें)</span>
                </button>

                <button
                  onClick={() => setIsTestStarting(false)}
                  className="w-full py-2 text-slate-400 hover:text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  रद्द करें
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
