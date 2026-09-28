"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Play,
  RotateCcw,
  Clock,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Layers,
  Zap,
  ArrowRight,
  ArrowLeft,
  Check,
  Sliders,
  Flame,
  Shield,
  Loader2,
  Landmark,
  Globe,
  TrendingUp,
  Atom,
  Newspaper,
  MapPin,
  Palette,
  Calculator,
  Brain,
  Languages,
  Laptop,
  Trophy,
  Search,
  X,
} from "lucide-react";
import { useQuiz } from "@/context/QuizContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTier } from "@/context/TierContext";
import toast from "react-hot-toast";

const STORAGE_KEY = "quizweb_arena_settings";

// Map category icon slugs to real Lucide icons
const CATEGORY_ICON_MAP = {
  landmark: Landmark,
  globe: Globe,
  shield: Shield,
  "trending-up": TrendingUp,
  atom: Atom,
  newspaper: Newspaper,
  "map-pin": MapPin,
  palette: Palette,
  calculator: Calculator,
  brain: Brain,
  "book-open": BookOpen,
  languages: Languages,
  laptop: Laptop,
  sparkles: Sparkles,
  trophy: Trophy,
};

function CategoryIcon({ icon, className = "w-5 h-5" }) {
  const IconComponent = CATEGORY_ICON_MAP[icon] || BookOpen;
  return <IconComponent className={className} />;
}

const STEPS = [
  { id: 1, label: "Category", labelHi: "श्रेणी", icon: Layers },
  { id: 2, label: "Questions", labelHi: "प्रश्न", icon: BookOpen },
  { id: 3, label: "Difficulty", labelHi: "कठिनाई", icon: Sliders },
  { id: 4, label: "Timer", labelHi: "टाइमर", icon: Clock },
  { id: 5, label: "Play", labelHi: "शुरू", icon: Play },
];

export default function ArenaClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startMixedQuiz } = useQuiz();
  const { isHindi } = useLanguage();
  const { tier } = useTier();

  // Wizard active step (1 to 5)
  const [currentStep, setCurrentStep] = useState(1);

  // Audience pre-filter from URL or Tier
  const urlAudience =
    searchParams.get("audience") ||
    (tier === "kids" ? "kids" : tier === "students" ? "students" : "all");

  // State
  const [meta, setMeta] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  // Search filter inside Category step
  const [catSearch, setCatSearch] = useState("");

  // Quiz Engine Settings
  const [selectedCats, setSelectedCats] = useState([]);
  const [questionCount, setQuestionCount] = useState(20);
  const [difficulty, setDifficulty] = useState(urlAudience === "kids" ? "easy" : "all");
  const [timerMode, setTimerMode] = useState("per_question_30");
  const [quizMode, setQuizMode] = useState("practice"); // 'practice' | 'test'
  const [language, setLanguage] = useState("all");

  // Optional collapsed advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [skipCorrect, setSkipCorrect] = useState(false);
  const [onlyWrong, setOnlyWrong] = useState(false);
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [friendSeed, setFriendSeed] = useState("");

  // Live match count
  const [matchCount, setMatchCount] = useState(null);
  const [counting, setCounting] = useState(false);

  // 1. Fetch metadata on mount
  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch("/api/arena/meta");
        if (!res.ok) throw new Error("Failed to load metadata");
        const data = await res.json();
        setMeta(data);

        // Load saved preferences if available
        let saved = null;
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) saved = JSON.parse(raw);
        } catch {}

        if (saved && !searchParams.get("audience")) {
          setSelectedCats(saved.selectedCats || []);
          setDifficulty(saved.difficulty || "all");
          setQuestionCount(saved.questionCount || 20);
          setTimerMode(saved.timerMode || "per_question_30");
          setQuizMode(saved.quizMode || "practice");
          setLanguage(saved.language || "all");
          setSkipCorrect(Boolean(saved.skipCorrect));
          setOnlyWrong(Boolean(saved.onlyWrong));
          setOnlyBookmarked(Boolean(saved.onlyBookmarked));
        } else {
          // Pre-select categories matching current audience
          const relevant = (data.categories || []).filter((c) => {
            if (urlAudience === "kids")
              return Array.isArray(c.audience) ? c.audience.includes("kids") : c.audience === "kids";
            if (urlAudience === "students")
              return Array.isArray(c.audience) ? c.audience.includes("students") : true;
            return true;
          });
          setSelectedCats(relevant.map((c) => c.id));
        }
      } catch (err) {
        console.error("Meta load error:", err);
      } finally {
        setLoadingMeta(false);
      }
    }
    loadMeta();
  }, [searchParams, urlAudience]);

  // 2. Save settings to localStorage
  useEffect(() => {
    if (loadingMeta) return;
    try {
      const payload = {
        selectedCats,
        difficulty,
        questionCount,
        timerMode,
        quizMode,
        language,
        skipCorrect,
        onlyWrong,
        onlyBookmarked,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {}
  }, [
    selectedCats,
    difficulty,
    questionCount,
    timerMode,
    quizMode,
    language,
    skipCorrect,
    onlyWrong,
    onlyBookmarked,
    loadingMeta,
  ]);

  // 3. Debounced live match count fetching
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setCounting(true);
      try {
        const diffList = difficulty === "all" ? [] : [difficulty];
        const res = await fetch("/api/arena/count", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categories: selectedCats,
            difficulties: diffList,
            audience: urlAudience,
            language: language === "all" ? null : language,
            skipCorrect,
            onlyWrong,
            onlyBookmarked,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (active) setMatchCount(data.matchCount ?? 0);
        }
      } catch (err) {
        console.warn("Count error:", err);
      } finally {
        if (active) setCounting(false);
      }
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    selectedCats,
    difficulty,
    urlAudience,
    language,
    skipCorrect,
    onlyWrong,
    onlyBookmarked,
  ]);

  // Category toggle handlers
  const handleToggleCat = (catId) => {
    setSelectedCats((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleSelectAllCats = () => {
    if (!meta?.categories) return;
    setSelectedCats(meta.categories.map((c) => c.id));
  };

  const handleClearCats = () => {
    setSelectedCats([]);
  };

  // Step navigation validations
  const canGoNext = () => {
    if (currentStep === 1) return selectedCats.length > 0;
    return true;
  };

  const handleNext = () => {
    if (!canGoNext()) {
      toast.error(isHindi ? "कृपया कम से कम एक श्रेणी चुनें" : "Select at least one category");
      return;
    }
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleJumpToStep = (stepNum) => {
    if (stepNum > 1 && selectedCats.length === 0) {
      toast.error(isHindi ? "पहले श्रेणी चुनें" : "Select categories first");
      return;
    }
    setCurrentStep(stepNum);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Launch Quiz
  const handleStartQuiz = async () => {
    if (isStarting) return;
    if (selectedCats.length === 0) {
      toast.error(isHindi ? "कृपया कम से कम एक श्रेणी चुनें" : "Select at least one category");
      setCurrentStep(1);
      return;
    }
    if (matchCount === 0) {
      toast.error(
        isHindi
          ? "चयनित विकल्पों में कोई प्रश्न उपलब्ध नहीं है"
          : "No questions match your current filters"
      );
      return;
    }

    setIsStarting(true);
    try {
      const diffList = difficulty === "all" ? [] : [difficulty];
      const timerSeconds =
        timerMode === "off"
          ? 0
          : timerMode === "per_question_15"
          ? 15
          : timerMode === "per_question_30"
          ? 30
          : timerMode === "total_5m"
          ? 300
          : timerMode === "total_10m"
          ? 600
          : 30;

      const res = await fetch("/api/arena/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: questionCount,
          categories: selectedCats,
          difficulties: diffList,
          audience: urlAudience,
          language: language === "all" ? null : language,
          skipCorrect,
          onlyWrong,
          onlyBookmarked,
          seed: friendSeed.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate quiz");
      const data = await res.json();

      if (!data.questions || data.questions.length === 0) {
        toast.error(isHindi ? "कोई प्रश्न नहीं मिला" : "No questions returned");
        setIsStarting(false);
        return;
      }

      // Configure QuizContext
      const title = isHindi ? "क्विज़ इंजन" : "Quiz Engine";
      const targetLang = language === "hi" ? "hi" : "en";

      startMixedQuiz(
        data.questions,
        title,
        timerSeconds,
        difficulty.toUpperCase(),
        targetLang
      );

      // Save arena preferences for the quiz session
      try {
        sessionStorage.setItem("arena_session_mode", quizMode);
      } catch {}

      router.push("/quiz/arena");
    } catch (err) {
      console.error("Quiz launch error:", err);
      toast.error(isHindi ? "क्विज़ शुरू करने में त्रुटि" : "Failed to start quiz");
      setIsStarting(false);
    }
  };

  if (loadingMeta) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
        <p className="text-sm font-medium text-slate-600">
          {isHindi ? "क्विज़ इंजन लोड हो रहा है..." : "Loading Quiz Engine..."}
        </p>
      </div>
    );
  }

  const allCategories = meta?.categories || [];
  const filteredCategories = catSearch.trim()
    ? allCategories.filter((c) => {
        const query = catSearch.toLowerCase();
        return (
          c.name?.toLowerCase().includes(query) ||
          c.nameHi?.includes(query) ||
          c.slug?.includes(query)
        );
      })
    : allCategories;

  // Difficulty presets with friendly soft-tinted icons
  const difficultyOptions = [
    { id: "all", label: "Mixed / All", labelHi: "मिश्रित (सभी)", icon: Sparkles, iconBg: "bg-amber-100 text-amber-700" },
    { id: "easy", label: "Easy", labelHi: "सरल", icon: Shield, iconBg: "bg-emerald-100 text-emerald-700" },
    { id: "medium", label: "Medium", labelHi: "मध्यम", icon: Zap, iconBg: "bg-blue-100 text-blue-700" },
    { id: "hard", label: "Hard", labelHi: "कठिन", icon: Flame, iconBg: "bg-rose-100 text-rose-700" },
  ];

  // Question count presets
  const countOptions = [10, 20, 30, 50];

  // Timer options
  const timerOptions = [
    { id: "off", label: "Untimed", labelHi: "बिना समय सीमा", sub: "Off" },
    { id: "per_question_30", label: "30s / Question", labelHi: "30 से. प्रति प्रश्न", sub: "Standard" },
    { id: "per_question_15", label: "15s / Question", labelHi: "15 से. प्रति प्रश्न", sub: "Speed" },
    { id: "total_10m", label: "10 Mins Total", labelHi: "10 मिनट कुल", sub: "Exam" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-36 text-slate-900">
      {/* ── Sleek Light Stepper ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 bg-white border border-slate-200/90 rounded-2xl p-1.5 sm:p-2 shadow-sm">
          {STEPS.map((s) => {
            const isActive = currentStep === s.id;
            const isCompleted = currentStep > s.id;
            const Icon = s.icon;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleJumpToStep(s.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-1 sm:px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-amber-500 text-white font-bold shadow-md shadow-amber-500/25"
                    : isCompleted
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100/60"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                ) : (
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
                <span className="hidden xs:inline truncate">
                  {isHindi ? s.labelHi : s.label}
                </span>
                <span className="xs:hidden font-mono text-[11px]">{s.id}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── STEP 1: SELECT CATEGORY (Multi-Select) ── */}
      {currentStep === 1 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-500" />
                <span>{isHindi ? "1. श्रेणियां चुनें" : "1. Select Categories"}</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedCats.length > 0
                  ? isHindi
                    ? `${selectedCats.length} चुनी गई · ${matchCount !== null ? matchCount.toLocaleString() : "..."} उपलब्ध प्रश्न`
                    : `${selectedCats.length} selected · ${matchCount !== null ? matchCount.toLocaleString() : "..."} questions match`
                  : isHindi
                  ? "कम से कम 1 श्रेणी चुनें"
                  : "Select at least 1 category"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllCats}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200/80 transition-colors"
              >
                {isHindi ? "सभी चुनें" : "Select All"}
              </button>
              <button
                type="button"
                onClick={handleClearCats}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-500 border border-slate-200/80 transition-colors"
              >
                {isHindi ? "हटाएं" : "Clear"}
              </button>
            </div>
          </div>

          {/* Quick Search Input */}
          {allCategories.length > 6 && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                placeholder={isHindi ? "श्रेणी खोजें..." : "Filter categories..."}
                className="w-full bg-white border border-slate-200/90 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 shadow-sm"
              />
              {catSearch && (
                <button
                  type="button"
                  onClick={() => setCatSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Categories Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {filteredCategories.map((c) => {
              const isSelected = selectedCats.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleToggleCat(c.id)}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all min-h-[92px] shadow-sm ${
                    isSelected
                      ? "bg-amber-50/70 border-amber-500 text-slate-900 ring-2 ring-amber-400/25 shadow-md shadow-amber-500/10"
                      : "bg-white border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <CategoryIcon icon={c.icon} className="w-4 h-4" />
                    </div>
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition-colors ${
                        isSelected
                          ? "bg-amber-500 text-white font-bold"
                          : "border border-slate-300 text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </div>

                  <div className="mt-2">
                    <span className="block text-xs sm:text-sm font-semibold line-clamp-1 text-slate-900">
                      {isHindi ? c.nameHi || c.name : c.name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {c.questionCount} {isHindi ? "प्रश्न" : "Qs"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 2: NUMBER OF QUESTIONS ── */}
      {currentStep === 2 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-500" />
              <span>{isHindi ? "2. प्रश्नों की संख्या" : "2. Questions to Attempt"}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isHindi ? "इस क्विज़ में कितने प्रश्न हल करना चाहते हैं?" : "How many questions would you like to play?"}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {countOptions.map((num) => {
              const isSelected = questionCount === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuestionCount(num)}
                  className={`py-8 px-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 shadow-sm ${
                    isSelected
                      ? "bg-amber-50/70 border-amber-500 text-amber-950 ring-2 ring-amber-500/25 shadow-md shadow-amber-500/10"
                      : "bg-white border-slate-200/90 text-slate-800 hover:border-slate-300 hover:bg-slate-50/80"
                  }`}
                >
                  <span
                    className={`text-3xl sm:text-4xl font-black tracking-tight ${
                      isSelected ? "text-amber-600" : "text-slate-900"
                    }`}
                  >
                    {num}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {isHindi ? "प्रश्न" : "Questions"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 3: DIFFICULTY LEVEL ── */}
      {currentStep === 3 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-500" />
              <span>{isHindi ? "3. कठिनाई स्तर" : "3. Difficulty Level"}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isHindi ? "प्रश्नों का स्तर चुनें" : "Select question difficulty"}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {difficultyOptions.map((d) => {
              const isSelected = difficulty === d.id;
              const Icon = d.icon;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDifficulty(d.id)}
                  className={`py-6 px-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2.5 shadow-sm ${
                    isSelected
                      ? "bg-amber-50/70 border-amber-500 text-amber-950 ring-2 ring-amber-500/25 shadow-md shadow-amber-500/10"
                      : "bg-white border-slate-200/90 text-slate-800 hover:border-slate-300 hover:bg-slate-50/80"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-amber-500 text-white shadow-sm"
                        : d.iconBg
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-sm sm:text-base font-bold text-slate-900">
                      {isHindi ? d.labelHi : d.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 4: TIMER OPTION ── */}
      {currentStep === 4 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>{isHindi ? "4. टाइमर सेटिंग" : "4. Timer Option"}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isHindi ? "प्रति प्रश्न समय सीमा या कुल समय चुनें" : "Select time limit per question or total time"}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {timerOptions.map((t) => {
              const isSelected = timerMode === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimerMode(t.id)}
                  className={`py-6 px-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 shadow-sm ${
                    isSelected
                      ? "bg-amber-50/70 border-amber-500 text-amber-950 ring-2 ring-amber-500/25 shadow-md shadow-amber-500/10"
                      : "bg-white border-slate-200/90 text-slate-800 hover:border-slate-300 hover:bg-slate-50/80"
                  }`}
                >
                  <Clock className={`w-6 h-6 ${isSelected ? "text-amber-500" : "text-slate-400"}`} />
                  <div>
                    <span className="block text-xs sm:text-sm font-bold text-slate-900">
                      {isHindi ? t.labelHi : t.label}
                    </span>
                    <span className="text-[11px] text-slate-500">{t.sub}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 5: READY / GET SET GO ── */}
      {currentStep === 5 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Summary Box */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>{isHindi ? "क्विज़ तैयार है!" : "Ready to Play!"}</span>
              </h1>
              <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80">
                {counting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1 text-amber-600" />
                ) : (
                  <span className="text-amber-700 font-bold tabular-nums">
                    {(matchCount ?? 0).toLocaleString()}
                  </span>
                )}{" "}
                {isHindi ? "प्रश्न उपलब्ध" : "matching Qs"}
              </div>
            </div>

            {/* Clean summary chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div
                onClick={() => setCurrentStep(1)}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 text-left cursor-pointer transition-colors"
              >
                <span className="block text-[11px] text-slate-500 font-medium">
                  {isHindi ? "श्रेणियां" : "Categories"}
                </span>
                <span className="block text-xs sm:text-sm font-bold text-slate-900 truncate mt-0.5">
                  {selectedCats.length === allCategories.length
                    ? isHindi ? "सभी श्रेणियां" : "All Categories"
                    : `${selectedCats.length} ${isHindi ? "चयनित" : "Selected"}`}
                </span>
              </div>

              <div
                onClick={() => setCurrentStep(2)}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 text-left cursor-pointer transition-colors"
              >
                <span className="block text-[11px] text-slate-500 font-medium">
                  {isHindi ? "प्रश्न" : "Questions"}
                </span>
                <span className="block text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                  {questionCount} {isHindi ? "प्रश्न" : "Qs"}
                </span>
              </div>

              <div
                onClick={() => setCurrentStep(3)}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 text-left cursor-pointer transition-colors"
              >
                <span className="block text-[11px] text-slate-500 font-medium">
                  {isHindi ? "कठिनाई" : "Difficulty"}
                </span>
                <span className="block text-xs sm:text-sm font-bold text-slate-900 capitalize mt-0.5">
                  {difficulty}
                </span>
              </div>

              <div
                onClick={() => setCurrentStep(4)}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 text-left cursor-pointer transition-colors"
              >
                <span className="block text-[11px] text-slate-500 font-medium">
                  {isHindi ? "टाइमर" : "Timer"}
                </span>
                <span className="block text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                  {timerMode === "off"
                    ? isHindi ? "बंद" : "Off"
                    : timerMode === "per_question_30"
                    ? "30s / Q"
                    : timerMode === "per_question_15"
                    ? "15s / Q"
                    : "10 Mins"}
                </span>
              </div>
            </div>

            {/* Quick Mode & Language Pills */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">
                  {isHindi ? "मोड:" : "Mode:"}
                </span>
                <button
                  type="button"
                  onClick={() => setQuizMode("practice")}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                    quizMode === "practice"
                      ? "bg-amber-500 text-white font-bold shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/70"
                  }`}
                >
                  {isHindi ? "अभ्यास (Practice)" : "Practice"}
                </button>
                <button
                  type="button"
                  onClick={() => setQuizMode("test")}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                    quizMode === "test"
                      ? "bg-amber-500 text-white font-bold shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/70"
                  }`}
                >
                  {isHindi ? "परीक्षा (Test)" : "Test Exam"}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">
                  {isHindi ? "भाषा:" : "Language:"}
                </span>
                {["all", "en", "hi"].map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLanguage(l)}
                    className={`px-2.5 py-1 rounded-lg uppercase font-semibold text-[11px] transition-colors ${
                      language === l
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/70"
                    }`}
                  >
                    {l === "all" ? (isHindi ? "सभी" : "All") : l === "en" ? "EN" : "हिन्दी"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Optional Collapsed Advanced Settings */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <span>{isHindi ? "उन्नत विकल्प (ऐच्छिक)" : "Advanced Options (Optional)"}</span>
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>
            {showAdvanced && (
              <div className="p-4 pt-2 border-t border-slate-100 space-y-2 text-xs">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipCorrect}
                    onChange={(e) => setSkipCorrect(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500 border-slate-300"
                  />
                  <span>{isHindi ? "जो प्रश्न सही हो चुके हैं उन्हें छोड़ें" : "Skip questions I already got right"}</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyWrong}
                    onChange={(e) => setOnlyWrong(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500 border-slate-300"
                  />
                  <span>{isHindi ? "केवल पहले गलत हुए प्रश्न (रिवीजन)" : "Only questions I previously got wrong"}</span>
                </label>
                <div className="pt-2">
                  <input
                    type="text"
                    value={friendSeed}
                    onChange={(e) => setFriendSeed(e.target.value)}
                    placeholder={isHindi ? "मित्र चुनौती कोड (उदा: FRIEND-10)" : "Challenge Friend Seed (optional)"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Big GET SET GO CTA */}
          <button
            type="button"
            onClick={handleStartQuiz}
            disabled={isStarting || selectedCats.length === 0 || matchCount === 0}
            className="w-full py-4 sm:py-5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-lg sm:text-xl shadow-xl shadow-orange-500/25 flex items-center justify-center gap-3 transition-transform active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isStarting ? (
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            ) : (
              <Play className="w-6 h-6 fill-white" />
            )}
            <span>
              {isHindi
                ? `गेट सेट गो (${questionCount} प्रश्न)`
                : `GET SET GO (${questionCount} Questions)`}
            </span>
          </button>
        </div>
      )}

      {/* ── Light Bottom Wizard Navigation ── */}
      {currentStep < 5 && (
        <div className="mt-8 flex items-center justify-between gap-3 pt-4 border-t border-slate-200/90">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isHindi ? "पीछे" : "Back"}</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext()}
            className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-amber-500/25 transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            <span>
              {currentStep === 4
                ? isHindi
                  ? "गेट सेट गो →"
                  : "Get Set Go →"
                : isHindi
                ? "आगे बढ़ें →"
                : "Next →"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
