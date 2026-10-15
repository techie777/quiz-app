"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Swords,
  Target,
  Trophy,
  ArrowLeft,
  Sparkles,
  Link2,
  Clock,
  HelpCircle,
  Check,
  Copy,
  Share2,
  Users,
  X,
  Flame,
  ChevronRight,
  Send,
  Crown,
  Play,
  RotateCcw,
  Search,
  Layers,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useQuiz } from "@/context/QuizContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTier } from "@/context/TierContext";
import { useData } from "@/context/DataContext";
import toast from "react-hot-toast";
import ContextualLoader from "@/components/ContextualLoader";

const STORAGE_KEY = "quizweb_gk_engine_settings";

let cachedArenaMeta = null;

export default function ArenaClient({ initialSelectedCategoryIds = null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startMixedQuiz } = useQuiz();
  const { isHindi } = useLanguage();
  const { quizzes } = useData();
  const { data: authSession } = useSession();

  // Mode Selection: 'battle' (1v1 Friend Challenge) | 'solo' (Solo Test Practice)
  const isBattleRequested =
    searchParams?.get("battle") === "true" ||
    searchParams?.get("mode") === "battle" ||
    searchParams?.get("tab") === "join";
  const [mode, setMode] = useState(() => (isBattleRequested ? "battle" : "battle"));
  const [subTab, setSubTab] = useState(() =>
    searchParams?.get("tab") === "join" ? "join" : "create"
  );

  // Battle Configuration Parameters
  const [questionCount, setQuestionCount] = useState(10);
  const [timePerQ, setTimePerQ] = useState(15);
  const [selectedTopicId, setSelectedTopicId] = useState("bharat_gk");

  // Join Room PIN state (6 individual digits)
  const [pinDigits, setPinDigits] = useState(["", "", "", "", "", ""]);

  // Modals & Overlays
  const [isLobbyOpen, setIsLobbyOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isAsyncChallengeOpen, setIsAsyncChallengeOpen] = useState(false);

  // Lobby simulation state
  const [generatedRoomCode, setGeneratedRoomCode] = useState("583921");
  const [copied, setCopied] = useState(false);
  const [opponentJoined, setOpponentJoined] = useState(false);

  // Solo Practice Metadata & Settings
  const [meta, setMeta] = useState(() => cachedArenaMeta);
  const [loadingMeta, setLoadingMeta] = useState(() => !cachedArenaMeta);
  const [isStartingSolo, setIsStartingSolo] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [difficulty, setDifficulty] = useState("all");
  const [soloTimerSeconds, setSoloTimerSeconds] = useState(20);
  const [soloQuestionCount, setSoloQuestionCount] = useState(20);
  const [selectedSoloCats, setSelectedSoloCats] = useState(["india-gk"]);

  // Load arena metadata for solo practice
  useEffect(() => {
    let mounted = true;
    async function loadMeta() {
      try {
        const res = await fetch("/api/arena/meta");
        if (!res.ok) throw new Error("Failed to load metadata");
        const data = await res.json();
        if (mounted) {
          cachedArenaMeta = data;
          setMeta(data);
          setLoadingMeta(false);
        }
      } catch (err) {
        if (mounted) setLoadingMeta(false);
      }
    }
    if (!cachedArenaMeta) {
      loadMeta();
    }
    return () => {
      mounted = false;
    };
  }, []);

  // Available Battle Topics (Synced with database counts)
  const topics = useMemo(() => {
    const getCount = (slug, fallback) => {
      if (Array.isArray(quizzes)) {
        const q = quizzes.find((c) => c.slug === slug || c.id === slug);
        if (q) {
          const count =
            q.questionCount ??
            q._count?.questions ??
            (Array.isArray(q.questions) ? q.questions.length : 0);
          if (count > 0) return `${count.toLocaleString()} प्रश्न`;
        }
      }
      return fallback;
    };

    return [
      {
        id: "bharat_gk",
        slug: "india-gk",
        title: isHindi ? "भारत सामान्य ज्ञान" : "Bharat GK",
        subtitle: isHindi
          ? "इतिहास, भूगोल, राजनीति और राष्ट्रीय प्रतीक"
          : "History, Geography, Polity & National Symbols",
        emoji: "🇮🇳",
        questionCount: getCount("india-gk", "3,468 प्रश्न"),
        popular: true,
        tag: isHindi ? "सर्वाधिक लोकप्रिय" : "Most Popular",
      },
      {
        id: "science",
        slug: "science--discovery",
        title: isHindi ? "विज्ञान और खोज" : "Science & Discovery",
        subtitle: isHindi
          ? "भौतिकी, रसायन, जीव विज्ञान एवं आविष्कार"
          : "Physics, Chemistry, Biology & Inventions",
        emoji: "🔬",
        questionCount: getCount("science--discovery", "508 प्रश्न"),
        popular: false,
        tag: isHindi ? "ज्ञानवर्धक" : "Informative",
      },
      {
        id: "nature",
        slug: "nature-animals",
        title: isHindi ? "प्रकृति और पर्यावरण" : "Nature & Environment",
        subtitle: isHindi
          ? "वन्यजीव, पारिस्थितिकी, राष्ट्रीय उद्यान व जलवायु"
          : "Wildlife, Ecology, National Parks & Climate",
        emoji: "🌿",
        questionCount: getCount("nature-animals", "319 प्रश्न"),
        popular: false,
        tag: isHindi ? "रोचक" : "Fascinating",
      },
      {
        id: "history_culture",
        slug: "india-history",
        title: isHindi ? "इतिहास और संस्कृति" : "History & Culture",
        subtitle: isHindi
          ? "प्राचीन से आधुनिक भारत, कला व विरासत"
          : "Ancient to Modern India, Art & Heritage",
        emoji: "📜",
        questionCount: getCount("india-history", "892 प्रश्न"),
        popular: false,
        tag: isHindi ? "महत्वपूर्ण" : "Important",
      },
      {
        id: "world_current",
        slug: "world-gk",
        title: isHindi ? "विश्व भूगोल और समसामयिकी" : "World GK & Current Affairs",
        subtitle: isHindi
          ? "करंट अफेयर्स, वैश्विक संगठन व देश-राजधानियां"
          : "Current Affairs, Global Orgs & Capitals",
        emoji: "🌍",
        questionCount: getCount("world-gk", "1,120 प्रश्न"),
        popular: true,
        tag: isHindi ? "ट्रेंडिंग" : "Trending",
      },
      {
        id: "misc_gk",
        slug: "others",
        title: isHindi ? "अन्य विविध सामान्य ज्ञान" : "Miscellaneous GK",
        subtitle: isHindi
          ? "खेलकूद, पुरस्कार, सिनेमा, प्रसिद्ध पुस्तकें"
          : "Sports, Awards, Cinema, Books",
        emoji: "📦",
        questionCount: getCount("others", "767 प्रश्न"),
        popular: false,
        tag: isHindi ? "मिश्रित" : "Mixed",
      },
    ];
  }, [quizzes, isHindi]);

  const selectedTopic = topics.find((t) => t.id === selectedTopicId) || topics[0];

  // PIN Input Handlers
  const handlePinInput = (index, val) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...pinDigits];
    newDigits[index] = val.slice(-1);
    setPinDigits(newDigits);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === "Backspace" && !pinDigits[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePastePin = (e) => {
    const paste = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(paste)) {
      setPinDigits(paste.split(""));
    }
  };

  // Create Room Action
  const handleCreateRoom = () => {
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedRoomCode(randomCode);
    setCopied(false);
    setOpponentJoined(false);
    setIsLobbyOpen(true);

    // Simulate opponent joining after 4.5 seconds
    setTimeout(() => {
      setOpponentJoined(true);
    }, 4500);
  };

  const copyCode = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(generatedRoomCode);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartHostBattle = () => {
    setIsLobbyOpen(false);
    router.push(
      `/live/${generatedRoomCode}?is_host=true&categoryId=${encodeURIComponent(
        selectedTopic.slug
      )}&qCount=${questionCount}&timer=${timePerQ}`
    );
  };

  const handleJoinBattleSubmit = () => {
    const code = pinDigits.join("").trim();
    if (code.length === 6) {
      router.push(`/live/${code}`);
    } else {
      toast.error(isHindi ? "कृपया 6-अंकों का कोड दर्ज करें" : "Please enter 6-digit code");
    }
  };

  // Weekly Champions Podium Data
  const leaderBoardUsers = [
    {
      rank: 1,
      name: isHindi ? "अमित कुमार (Amit)" : "Amit Kumar",
      score: "2,940 XP",
      wins: isHindi ? "148 जीत" : "148 wins",
      avatar: "🦁",
      color: "border-amber-400 bg-amber-50 dark:bg-amber-950/40",
    },
    {
      rank: 2,
      name: isHindi ? "प्रिया शर्मा (Priya)" : "Priya Sharma",
      score: "2,810 XP",
      wins: isHindi ? "136 जीत" : "136 wins",
      avatar: "🌸",
      color: "border-slate-300 bg-slate-50 dark:bg-slate-800",
    },
    {
      rank: 3,
      name: isHindi ? "राहुल वर्मा (Rahul)" : "Rahul Verma",
      score: "2,650 XP",
      wins: isHindi ? "124 जीत" : "124 wins",
      avatar: "⚡",
      color: "border-amber-600 bg-amber-50/50 dark:bg-amber-950/20",
    },
    {
      rank: 4,
      name: isHindi ? "विकास यादव" : "Vikas Yadav",
      score: "2,420 XP",
      wins: isHindi ? "109 जीत" : "109 wins",
      avatar: "🎯",
      color: "border-transparent bg-white dark:bg-slate-800/80",
    },
    {
      rank: 5,
      name: isHindi ? "नेहा पटेल" : "Neha Patel",
      score: "2,290 XP",
      wins: isHindi ? "98 जीत" : "98 wins",
      avatar: "✨",
      color: "border-transparent bg-white dark:bg-slate-800/80",
    },
  ];

  // Solo Practice Starter
  const handleStartSoloQuiz = async () => {
    if (selectedSoloCats.length === 0) {
      toast.error(isHindi ? "कम से कम 1 श्रेणी चुनें" : "Please select at least 1 category");
      return;
    }
    setIsStartingSolo(true);
    try {
      const res = await fetch("/api/arena/pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryIds: selectedSoloCats,
          difficulty,
          limit: soloQuestionCount,
          language: isHindi ? "hi" : "en",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.questions || data.questions.length === 0) {
        throw new Error(data.error || "No questions found");
      }
      startMixedQuiz(
        data.questions,
        isHindi ? "GK सोलो अभ्यास" : "GK Solo Practice",
        soloTimerSeconds,
        difficulty.toUpperCase(),
        isHindi ? "hi" : "en",
        "practice"
      );
      router.push("/quiz/arena");
    } catch (err) {
      toast.error(isHindi ? "क्विज़ लोड करने में त्रुटि आई" : err.message || "Failed to start quiz");
      setIsStartingSolo(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center text-slate-800 dark:text-slate-100 antialiased font-sans select-none">
      
      {/* Desktop Responsive Central Container */}
      <div className="w-full max-w-5xl xl:max-w-6xl min-h-screen flex flex-col relative overflow-x-hidden">
        
        {/* ================= 1. COMPACT STICKY HEADER & TOP ARENA BAR ================= */}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between transition-all shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/");
                }
              }}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-700 dark:text-slate-300 transition cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-1.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">
                Quiz<span className="text-indigo-600 dark:text-indigo-400">Web</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Live Online Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>1.2k {isHindi ? "लाइव" : "Live"}</span>
            </div>

            {/* Leaderboard Trophy Shortcut */}
            <button
              onClick={() => setIsLeaderboardOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs font-bold shadow-2xs active:scale-95 transition cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>{isHindi ? "रैंक" : "Rank"}</span>
            </button>
          </div>
        </header>

        {/* Scrollable Container with bottom padding for Fixed Action Bar & BottomNavBar */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-4 pb-52 space-y-6 overflow-y-auto">
          
          {/* ================= 2. TITLE & MODE SWITCHER ================= */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                  <span className="text-2xl">⚔️</span> {isHindi ? "1v1 लाइव जीके बैटल" : "1v1 Live GK Battle"}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {isHindi
                    ? "दोस्तों के साथ रीयल-टाइम लाइव GK मुकाबला खेलें"
                    : "Real-time 1v1 live quiz duels with friends"}
                </p>
              </div>

              <div className="flex items-center self-start sm:self-auto gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                ● 1,280+ {isHindi ? "सक्रिय" : "Active"}
              </div>
            </div>

            {/* Top Level Mode Toggle: Solo Test vs 1v1 Battle */}
            <div className="bg-slate-200/80 dark:bg-slate-800 p-1.5 rounded-2xl grid grid-cols-2 gap-1.5 text-xs font-bold max-w-md">
              <button
                onClick={() => setMode("solo")}
                className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === "solo"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Target className="w-3.5 h-3.5 text-rose-500" />
                <span>{isHindi ? "सोलो अभ्यास" : "Solo Practice"}</span>
              </button>
              <button
                onClick={() => setMode("battle")}
                className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === "battle"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Swords className="w-3.5 h-3.5 text-amber-300" />
                <span>{isHindi ? "1v1 बैटल" : "1v1 Battle"}</span>
              </button>
            </div>
          </div>

          {/* If Solo Mode is Selected */}
          {mode === "solo" ? (
            <div className="max-w-xl mx-auto w-full bg-white dark:bg-slate-850 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 text-center space-y-5 shadow-sm animate-in fade-in duration-200">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Target className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {isHindi ? "सोलो टेस्ट मोड" : "Solo Practice Mode"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  {isHindi
                    ? "बिना किसी प्रतिद्वंदी के अपनी गति से सामान्य ज्ञान का अभ्यास करें और अपनी कमजोरियों को सुधारें।"
                    : "Practice GK at your own pace without opponents and master key subjects."}
                </p>
              </div>

              {/* Quick Settings for Solo */}
              <div className="grid grid-cols-2 gap-2 text-left pt-1">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {isHindi ? "प्रश्न संख्या" : "Questions"}
                  </span>
                  <div className="flex gap-1 mt-1">
                    {[10, 20, 30].map((c) => (
                      <button
                        key={c}
                        onClick={() => setSoloQuestionCount(c)}
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          soloQuestionCount === c
                            ? "bg-indigo-600 text-white"
                            : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {c}Q
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {isHindi ? "टाइमर प्रति प्रश्न" : "Timer"}
                  </span>
                  <div className="flex gap-1 mt-1">
                    {[0, 15, 20].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSoloTimerSeconds(s)}
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          soloTimerSeconds === s
                            ? "bg-indigo-600 text-white"
                            : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {s === 0 ? "Off" : `${s}s`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartSoloQuiz}
                disabled={isStartingSolo}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isStartingSolo ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{isHindi ? "लोड हो रहा है..." : "Loading..."}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>{isHindi ? "सोलो क्विज़ शुरू करें" : "Start Solo Practice"}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* ================= 3. 1v1 BATTLE MAIN CONTAINER ================= */
            <div className="space-y-4">
              
              {/* Dual Action Primary Tabs: नया रूम बनाएं vs कोड से जुड़ें */}
              <div className="bg-white dark:bg-slate-850 p-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex max-w-md">
                <button
                  onClick={() => setSubTab("create")}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    subTab === "create"
                      ? "bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/80 dark:to-violet-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{isHindi ? "नया रूम बनाएं" : "Create Room"}</span>
                </button>
                <button
                  onClick={() => setSubTab("join")}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    subTab === "join"
                      ? "bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/80 dark:to-violet-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{isHindi ? "कोड से जुड़ें" : "Join Code"}</span>
                </button>
              </div>

              {/* ---------------- SUBTAB A: CREATE ROOM FLOW ---------------- */}
              {subTab === "create" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  
                  {/* BATTLE PARAMETERS CONTROLS */}
                  <div className="bg-white dark:bg-slate-850 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100">
                      <span className="flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />{" "}
                        {isHindi ? "मैच सेटिंग्स (Rules)" : "Match Rules"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {isHindi ? "कस्टम नियम" : "Custom settings"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Questions count selector */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          {isHindi ? "प्रश्नों की संख्या" : "Questions"}
                        </label>
                        <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                          {[5, 10, 15].map((count) => (
                            <button
                              key={count}
                              type="button"
                              onClick={() => setQuestionCount(count)}
                              className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                                questionCount === count
                                  ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs border border-indigo-100 dark:border-indigo-800"
                                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                              }`}
                            >
                              {count}Q
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Timer per question selector */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          {isHindi ? "समय प्रति प्रश्न" : "Timer / Question"}
                        </label>
                        <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                          {[10, 15, 20].map((sec) => (
                            <button
                              key={sec}
                              type="button"
                              onClick={() => setTimePerQ(sec)}
                              className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                                timePerQ === sec
                                  ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs border border-indigo-100 dark:border-indigo-800"
                                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                              }`}
                            >
                              {sec}s
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TOPIC SELECTION LIST */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <span>{isHindi ? "क्विज़ विषय चुनें (Choose Topic)" : "Choose Duel Topic"}</span>
                      </label>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {isHindi ? "कुल 7,000+ प्रश्न" : "7,000+ Questions Pool"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
                      {topics.map((topic) => {
                        const isSelected = selectedTopicId === topic.id;
                        return (
                          <div
                            key={topic.id}
                            onClick={() => setSelectedTopicId(topic.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex items-center justify-between select-none ${
                              isSelected
                                ? "bg-gradient-to-r from-indigo-50/90 to-violet-50/50 dark:from-indigo-950/80 dark:to-violet-950/40 border-indigo-500 shadow-xs ring-2 ring-indigo-500/15"
                                : "bg-white dark:bg-slate-850 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 hover:bg-slate-50/50 hover:shadow-xs"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Large Emoji Badge */}
                              <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-2xs border shrink-0 ${
                                  isSelected
                                    ? "bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-700"
                                    : "bg-slate-50 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700"
                                }`}
                              >
                                {topic.emoji}
                              </div>

                              <div className="min-w-0 pr-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3
                                    className={`text-xs sm:text-sm font-bold truncate ${
                                      isSelected
                                        ? "text-indigo-950 dark:text-white font-black"
                                        : "text-slate-800 dark:text-slate-200"
                                    }`}
                                  >
                                    {topic.title}
                                  </h3>
                                  {topic.popular && (
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                                      HOT
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                  {topic.subtitle}
                                </p>
                                <span className="inline-block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full mt-1 border border-indigo-100/60 dark:border-indigo-800">
                                  {topic.questionCount}
                                </span>
                              </div>
                            </div>

                            {/* Radio / Selection Indicator */}
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                                isSelected
                                  ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                                  : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* ---------------- SUBTAB B: JOIN ROOM WITH PIN ---------------- */}
              {subTab === "join" && (
                <div className="max-w-xl mx-auto w-full bg-white dark:bg-slate-850 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in duration-200">
                  <div className="text-center space-y-1.5">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Link2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {isHindi ? "रूम कोड (PIN) दर्ज करें" : "Enter Room Code (PIN)"}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      {isHindi
                        ? "अपने मित्र द्वारा साझा किया गया 6-अंकों का कोड यहाँ डालें"
                        : "Enter the 6-digit room code shared by your friend"}
                    </p>
                  </div>

                  {/* 6 Digit Box Inputs */}
                  <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePastePin}>
                    {pinDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`pin-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handlePinInput(idx, e.target.value)}
                        onKeyDown={(e) => handlePinKeyDown(idx, e)}
                        className={`w-11 sm:w-14 h-13 sm:h-16 text-center text-xl sm:text-2xl font-black rounded-xl sm:rounded-2xl border transition-all focus:outline-none ${
                          digit
                            ? "border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-2xs"
                            : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Quick Numeric Keypad simulation & Paste Helper */}
                  <div className="flex items-center justify-between px-1 text-xs">
                    <button
                      onClick={() => setPinDigits(["", "", "", "", "", ""])}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> {isHindi ? "रिसेट करें" : "Reset"}
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          const clean = text.trim();
                          if (/^\d{6}$/.test(clean)) {
                            setPinDigits(clean.split(""));
                          } else {
                            toast.error(
                              isHindi
                                ? "क्लिपबोर्ड में मान्य 6-अंकों का कोड नहीं मिला।"
                                : "No valid 6-digit code found in clipboard."
                            );
                          }
                        } catch {
                          toast.error(
                            isHindi ? "क्लिपबोर्ड एक्सेस की अनुमति नहीं है।" : "Clipboard access denied."
                          );
                        }
                      }}
                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      {isHindi ? "क्लिपबोर्ड से पेस्ट करें" : "Paste from Clipboard"}
                    </button>
                  </div>

                  <button
                    disabled={pinDigits.join("").length < 6}
                    onClick={handleJoinBattleSubmit}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-black rounded-xl sm:rounded-2xl shadow-md shadow-indigo-600/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{isHindi ? "कमरे में प्रवेश करें (Join Battle)" : "Enter Room (Join Battle)"}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ================= 4. ASYNC / OFFLINE CHALLENGE BANNER ================= */}
              <div
                onClick={() => setIsAsyncChallengeOpen(true)}
                className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-4 sm:p-5 text-white shadow-md border border-indigo-500/20 cursor-pointer active:scale-[0.99] transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-300 shrink-0">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{isHindi ? "दोस्त अभी ऑफलाइन है?" : "Friend offline right now?"}</span>
                      <span className="text-[9px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-extrabold">
                        NEW
                      </span>
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
                      {isHindi
                        ? "अपना स्कोर सेट करें और WhatsApp पर Score Challenge भेजें!"
                        : "Set your score first & challenge them on WhatsApp!"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              </div>

              {/* Real-time Leaderboard Footer Link */}
              <div className="text-center pt-1 pb-4">
                <button
                  onClick={() => setIsLeaderboardOpen(true)}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/70 dark:border-indigo-800 px-5 py-2.5 rounded-full shadow-2xs transition cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>{isHindi ? "लाइव 1v1 लीडरबोर्ड देखें →" : "View Live 1v1 Leaderboard →"}</span>
                </button>
              </div>

            </div>
          )}

        </main>

        {/* ================= 5. FIXED FROSTED GLASS ACTION BAR ================= */}
        {mode === "battle" && subTab === "create" && (
          <div className="fixed bottom-[62px] sm:bottom-[66px] left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-4 shadow-2xl pb-[env(safe-area-inset-bottom,0px)]">
            <div className="w-full max-w-5xl xl:max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Summary Tag */}
              <div className="flex items-center justify-between sm:justify-start gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5 truncate">
                  <span>{isHindi ? "चयनित:" : "Selected:"}</span>
                  <b className="text-slate-800 dark:text-slate-100 font-bold truncate">{selectedTopic.title}</b>
                </span>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-bold text-xs whitespace-nowrap">
                  {questionCount} Qs • {timePerQ}s {isHindi ? "प्रति प्रश्न" : "/ question"}
                </span>
              </div>

              {/* Launch CTA Button */}
              <button
                onClick={handleCreateRoom}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-[0.98] text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Swords className="w-4 h-4 text-amber-300" />
                <span>{isHindi ? "लाइव रूम बनाएं (आमंत्रण कोड पाएं) →" : "Create Live Room (Get Code) →"}</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= MODAL: LIVE ROOM WAITING LOBBY ================= */}
        {isLobbyOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md sm:max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Swords className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {isHindi ? "लाइव बैटल लॉबी" : "Live Battle Lobby"}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {isHindi ? "मैच शुरू होने का इंतज़ार है" : "Waiting for match start"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsLobbyOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Generated Room PIN Display */}
              <div className="bg-gradient-to-b from-indigo-50/80 to-white dark:from-slate-800 dark:to-slate-850 border border-indigo-200/80 dark:border-slate-700 rounded-2xl p-4 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {isHindi ? "आपका रूम कोड (PIN)" : "Your Room Code (PIN)"}
                </span>
                <div className="text-3xl font-black tracking-widest text-slate-900 dark:text-white my-1 font-mono">
                  {generatedRoomCode}
                </div>
                <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">
                  <span>
                    {selectedTopic.emoji} {selectedTopic.title}
                  </span>{" "}
                  • <span>{questionCount} प्रश्न</span>
                </div>
              </div>

              {/* Share & Copy Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={copyCode}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? (isHindi ? "कोड कॉपी हुआ!" : "Copied!") : (isHindi ? "कोड कॉपी" : "Copy Code")}</span>
                </button>

                <button
                  onClick={() => {
                    const shareText = isHindi
                      ? `आओ मेरे साथ QuizWeb पर 1v1 लाइव क्विज़ मुकाबला खेलो! रूम कोड: ${generatedRoomCode}\n👉 ${typeof window !== "undefined" ? window.location.origin : ""}/live/${generatedRoomCode}`
                      : `Challenge me to a 1v1 live quiz on QuizWeb! Room Code: ${generatedRoomCode}\n👉 ${typeof window !== "undefined" ? window.location.origin : ""}/live/${generatedRoomCode}`;
                    if (navigator.share) {
                      navigator.share({ title: "QuizWeb 1v1", text: shareText, url: window.location.href }).catch(() => {});
                    } else {
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, "_blank");
                    }
                  }}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{isHindi ? "व्हाट्सऐप पर भेजें" : "Share on WhatsApp"}</span>
                </button>
              </div>

              {/* Players Status Box */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {isHindi ? "खिलाड़ी स्थिति:" : "Players Status:"}
                </p>
                <div className="space-y-2">
                  {/* Host Player */}
                  <div className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-sm font-bold text-indigo-700 dark:text-indigo-300">
                        {isHindi ? "आप" : "You"}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {isHindi ? "होस्ट (तैयार)" : "Host (Ready)"}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                      {isHindi ? "रेडी" : "Ready"}
                    </span>
                  </div>

                  {/* Opponent Player (Waiting or Connected) */}
                  <div className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm">
                        {opponentJoined ? "👤" : "⏳"}
                      </span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {opponentJoined
                          ? (isHindi ? "रोहित वर्मा (Rohit)" : "Rohit Verma")
                          : (isHindi ? "दोस्त का इंतज़ार..." : "Waiting for friend...")}
                      </span>
                    </div>
                    {opponentJoined ? (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> {isHindi ? "जुड़ गए" : "Joined"}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full animate-pulse">
                        {isHindi ? "प्रतीक्षारत..." : "Waiting..."}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Match Start Button */}
              <button
                disabled={!opponentJoined}
                onClick={handleStartHostBattle}
                className={`w-full py-3 rounded-xl font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition cursor-pointer ${
                  opponentJoined
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 active:scale-[0.98]"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {opponentJoined
                    ? (isHindi ? "मुकाबला शुरू करें (Start Battle)" : "Start Battle Now")
                    : (isHindi ? "प्रतिद्वंदी के जुड़ने का इंतज़ार करें" : "Waiting for player to connect...")}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ================= MODAL: LEADERBOARD ================= */}
        {isLeaderboardOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md sm:max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                    <Trophy className="w-4 h-4 fill-amber-500 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {isHindi ? "साप्ताहिक 1v1 चैंपियंस" : "Weekly 1v1 Champions"}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {isHindi ? "शीर्ष क्विज़ योद्धा" : "Top Quiz Duelists"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsLeaderboardOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Podium View for Top 3 */}
              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                {/* Rank 2 */}
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-2.5 flex flex-col items-center">
                  <span className="text-xl">🥈</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 line-clamp-1">
                    {isHindi ? "प्रिया श." : "Priya S."}
                  </p>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">2,810 XP</span>
                </div>
                {/* Rank 1 */}
                <div className="bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/40 dark:to-slate-800 border-2 border-amber-300 dark:border-amber-600 rounded-2xl p-2.5 flex flex-col items-center -mt-2 shadow-sm">
                  <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white mt-1 line-clamp-1">
                    {isHindi ? "अमित कु." : "Amit K."}
                  </p>
                  <span className="text-[10px] font-black text-amber-700 dark:text-amber-400">2,940 XP</span>
                </div>
                {/* Rank 3 */}
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-2.5 flex flex-col items-center">
                  <span className="text-xl">🥉</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 line-clamp-1">
                    {isHindi ? "राहुल व." : "Rahul V."}
                  </p>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">2,650 XP</span>
                </div>
              </div>

              {/* List */}
              <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
                {leaderBoardUsers.map((user) => (
                  <div
                    key={user.rank}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${user.color}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 font-black text-slate-400 text-center">#{user.rank}</span>
                      <span className="text-base">{user.avatar}</span>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{user.name}</p>
                        <p className="text-[10px] text-slate-400">{user.wins}</p>
                      </div>
                    </div>
                    <span className="font-black text-indigo-600 dark:text-indigo-400">{user.score}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setIsLeaderboardOpen(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                {isHindi ? "बंद करें" : "Close"}
              </button>
            </div>
          </div>
        )}

        {/* ================= MODAL: ASYNC SCORE CHALLENGE ================= */}
        {isAsyncChallengeOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md sm:max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {isHindi ? "Score Challenge भेजें" : "Send Score Challenge"}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {isHindi ? "ऑफलाइन दोस्तों के लिए" : "For offline friends"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAsyncChallengeOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <p>
                  {isHindi
                    ? "1. पहले आप 10 प्रश्नों का टेस्ट देकर अपना स्कोर तय करेंगे।"
                    : "1. Play a 10-question quiz set first to record your benchmark score."}
                </p>
                <p>
                  {isHindi
                    ? "2. टेस्ट खत्म होने पर आपको एक अनोखा चैलेंज लिंक मिलेगा।"
                    : "2. Once finished, you will receive a unique challenge link."}
                </p>
                <p>
                  {isHindi
                    ? "3. आपका दोस्त कभी भी उस लिंक पर क्लिक करके आपके स्कोर को चुनौती दे सकता है!"
                    : "3. Your friend can open the link anytime to battle your score asynchronously!"}
                </p>
              </div>

              <button
                onClick={() => {
                  setIsAsyncChallengeOpen(false);
                  const userName = authSession?.user?.name || (isHindi ? "खिलाड़ी" : "Quizzer");
                  router.push(
                    `/challenge?cat=${selectedTopic.slug}&score=0&total=10&name=${encodeURIComponent(userName)}`
                  );
                }}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-extrabold text-xs rounded-xl shadow-md active:scale-95 transition cursor-pointer"
              >
                {isHindi ? "स्कोर सेट करना शुरू करें (Play First)" : "Record Benchmark Score (Play First)"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
