"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, SlidersHorizontal, BookOpen, Flame, Lock, Rocket, Play, Award, CheckCircle2, ShieldCheck, Zap, Globe } from "lucide-react";
import styles from "@/styles/HubPage.module.css";
import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useUI } from "@/context/UIContext";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTier } from "@/context/TierContext";
import MiniQuizPreview from "@/components/MiniQuizPreview";
import CAPreviewWidget from "@/components/CAPreviewWidget";
import CategoryCard from "@/components/CategoryCard";
import StudentClassSelector from "@/components/StudentClassSelector";
import UnsetLandingPage from "@/components/UnsetLandingPage";

const KIDS_PICTURE_TILES = [
  {
    id: "animals",
    title: "Animals & Nature",
    titleHi: "जानवर और प्रकृति",
    emoji: "🦁",
    badge: "🌟 Fun 10 Qs",
    badgeHi: "🌟 10 प्रश्न",
    bgGradient: "from-amber-400 via-orange-400 to-amber-500",
    shadowColor: "shadow-orange-400/25",
    matchKeywords: ["animal", "wildlife", "nature", "biology", "bird"],
  },
  {
    id: "space",
    title: "Space & Science",
    titleHi: "अंतरिक्ष और विज्ञान",
    emoji: "🚀",
    badge: "🪐 Explorer",
    badgeHi: "🪐 अंतरिक्ष",
    bgGradient: "from-indigo-500 via-purple-500 to-indigo-600",
    shadowColor: "shadow-indigo-500/25",
    matchKeywords: ["space", "science", "physics", "solar", "planet"],
  },
  {
    id: "math",
    title: "Fun Math",
    titleHi: "मजेदार गणित",
    emoji: "🔢",
    badge: "🧠 Quick 10",
    badgeHi: "🧠 आसान गणित",
    bgGradient: "from-emerald-400 via-teal-500 to-emerald-600",
    shadowColor: "shadow-emerald-500/25",
    matchKeywords: ["math", "numbers", "arithmetic", "reasoning"],
  },
  {
    id: "art",
    title: "Colors & Art",
    titleHi: "रंग और कला",
    emoji: "🎨",
    badge: "🌈 Creativity",
    badgeHi: "🌈 रंग-बिरंगा",
    bgGradient: "from-pink-400 via-rose-500 to-pink-600",
    shadowColor: "shadow-pink-500/25",
    matchKeywords: ["art", "color", "drawing", "culture"],
  },
  {
    id: "stories",
    title: "Stories & Toons",
    titleHi: "कहानियां और कार्टून",
    emoji: "🏰",
    badge: "✨ Magic World",
    badgeHi: "✨ जादुई दुनिया",
    bgGradient: "from-purple-400 via-fuchsia-500 to-purple-600",
    shadowColor: "shadow-purple-500/25",
    matchKeywords: ["story", "cartoon", "tales", "literature", "history"],
  },
  {
    id: "puzzles",
    title: "Brain Puzzles",
    titleHi: "दिमागी पहेलियां",
    emoji: "🧩",
    badge: "💡 Super Smart",
    badgeHi: "💡 बुद्धिमान",
    bgGradient: "from-cyan-400 via-blue-500 to-cyan-600",
    shadowColor: "shadow-cyan-500/25",
    matchKeywords: ["brain", "puzzle", "riddle", "logic", "quiz"],
  },
  {
    id: "world",
    title: "Our Planet",
    titleHi: "हमारी दुनिया",
    emoji: "🌍",
    badge: "🗺️ Wonders",
    badgeHi: "🗺️ रोचक स्थल",
    bgGradient: "from-blue-400 via-teal-500 to-blue-600",
    shadowColor: "shadow-blue-500/25",
    matchKeywords: ["world", "earth", "geography", "india", "places"],
  },
  {
    id: "music",
    title: "Music & Sounds",
    titleHi: "गीत और संगीत",
    emoji: "🎵",
    badge: "🎧 Beat Fun",
    badgeHi: "🎧 सुरीला",
    bgGradient: "from-violet-400 via-indigo-500 to-violet-600",
    shadowColor: "shadow-violet-500/25",
    matchKeywords: ["music", "sound", "songs", "instruments"],
  },
];

export default function MasterHubPage() {
  const { data: session } = useSession();
  const { openOnboarding } = useUI();
  const { quizzes, settings } = useData();
  const { t, isHindi } = useLanguage();
  const { tier, currentConfig, studentGrade, hasSavedTier, mounted: tierMounted } = useTier();
  const [mounted, setMounted] = useState(false);
  const [interests, setInterests] = useState([]);
  const [isLoadingInterests, setIsLoadingInterests] = useState(false);
  const [trialPaper, setTrialPaper] = useState(null);

  // Compute school study vs fun trivia categories for Students tier
  const { studyCategories, funCategories } = useMemo(() => {
    if (!quizzes || !Array.isArray(quizzes)) {
      return { studyCategories: [], funCategories: [] };
    }

    const studyKeywords = [
      "science", "math", "physics", "chem", "bio", "history", "geography", "english", 
      "computer", "civics", "economics", "school", "revision", "grammar", "vyakaran", 
      "social", "literature", "itihaas", "bhugol", "ganit", "vigyan"
    ];

    const funKeywords = [
      "trivia", "kbc", "puzzle", "riddle", "gk", "general", "entertainment", 
      "sports", "bollywood", "cinema", "music", "game", "world", "fact", 
      "curiosity", "iq", "mind", "day"
    ];

    const study = [];
    const fun = [];

    quizzes.forEach((cat) => {
      const topicLower = (cat.topic || "").toLowerCase();
      const slugLower = (cat.slug || "").toLowerCase();
      const descLower = (cat.description || "").toLowerCase();

      const isStudy = studyKeywords.some((kw) => 
        topicLower.includes(kw) || slugLower.includes(kw) || descLower.includes(kw)
      );

      const isFun = funKeywords.some((kw) => 
        topicLower.includes(kw) || slugLower.includes(kw) || descLower.includes(kw)
      );

      if (isStudy) {
        study.push(cat);
      }
      if (isFun || !isStudy) {
        fun.push(cat);
      }
    });

    const finalStudy = study.length > 0 ? study : quizzes.slice(0, 8);
    const finalFun = fun.length > 0 ? fun : quizzes.slice(8, 16);

    return { studyCategories: finalStudy, funCategories: finalFun };
  }, [quizzes]);

  // Adults Tier: Scoped difficulty filter for general Play & Learn section (Requirement 2)
  const [adultDifficulty, setAdultDifficulty] = useState("all");

  const filteredAdultPlayCategories = useMemo(() => {
    let list = funCategories;
    if (adultDifficulty !== "all") {
      list = list.filter((cat) => {
        if (!cat.questions || cat.questions.length === 0) return true;
        return cat.questions.some((q) => (q.difficulty || "").toLowerCase() === adultDifficulty.toLowerCase());
      });
    }
    return list;
  }, [funCategories, adultDifficulty]);

  useEffect(() => {
    setMounted(true);
    fetchTrialPaper();
  }, []);

  const fetchTrialPaper = async () => {
    try {
      const res = await fetch("/api/mock-tests/trial");
      if (res.ok) {
        const data = await res.json();
        if (data.trialPaper) {
          setTrialPaper(data.trialPaper);
        }
      }
    } catch (err) {
      console.error("Fetch trial paper error:", err);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchInterests();
    }
  }, [session]);

  const fetchInterests = async () => {
    setIsLoadingInterests(true);
    try {
      const res = await fetch("/api/user/interests");
      const data = await res.json();
      setInterests(data.interestedCategories || []);
    } catch (error) {
      console.error("Failed to fetch interests:", error);
    } finally {
      setIsLoadingInterests(false);
    }
  };

  // Hydration safety: while checking client storage on initial load
  if (!mounted || !tierMounted) {
    return (
      <div className={styles.container} style={{ minHeight: "65vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Requirement 1: If no tier is saved in storage, render standalone landing page at root
  if (!hasSavedTier) {
    return <UnsetLandingPage />;
  }

  return (
    <div className={styles.container}>
      <main className={styles.heroContent}>
        
        {/* Hero Header with Tier-driven Greeting & Accent Palette */}
        <div 
          className={styles.heroHeader}
          style={{
            "--tier-accent": currentConfig.accentColor,
            "--tier-accent-light": currentConfig.accentLight,
            "--tier-accent-border": currentConfig.accentBorder,
          }}
        >
          <div 
            className={styles.heroBadge}
            style={{
              background: currentConfig.accentLight,
              borderColor: currentConfig.accentBorder,
              color: currentConfig.accentColor,
              boxShadow: `0 4px 16px ${currentConfig.glowColor}`,
              transition: "all 0.3s ease",
            }}
          >
            <span>{currentConfig.icon}</span>
            <span>{mounted ? (isHindi ? currentConfig.badge.hi : currentConfig.badge.en) : currentConfig.badge.en}</span>
          </div>

          <h1 
            className={styles.heroTitle}
            style={{
              transition: "all 0.3s ease",
            }}
          >
            {mounted ? (isHindi ? currentConfig.greeting.hi : currentConfig.greeting.en) : currentConfig.greeting.en}
          </h1>

          <p className={styles.heroSubtitle}>
            {mounted ? (isHindi ? currentConfig.subtitle.hi : currentConfig.subtitle.en) : currentConfig.subtitle.en}
          </p>

          {/* Active Mode Pill Indicator */}
          <div 
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "8px",
              marginBottom: "4px",
              padding: "3px 12px",
              borderRadius: "999px",
              fontSize: "0.78rem",
              fontWeight: 800,
              background: currentConfig.accentLight,
              color: currentConfig.accentColor,
              border: `1.5px solid ${currentConfig.accentBorder}`,
              boxShadow: `0 2px 8px ${currentConfig.glowColor}`,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <span>{currentConfig.icon}</span>
            <span>
              {isHindi ? `${currentConfig.labelHi} मोड सक्रिय` : `${currentConfig.label} Mode Active`}
            </span>
          </div>

          {/* Quick Vertical Navigation Bar (Only for Adults Tier) */}
          {(tier === "adults" || (tier !== "kids" && tier !== "students")) && (
            <div className={styles.verticalNavPills}>
              <Link href="/quizzes" className={styles.navPill} style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(34,197,94,0.15) 100%)", border: "1px solid rgba(16,185,129,0.35)" }}>
                <span>🧪</span>
                <span style={{ fontWeight: 800, color: "#15803d" }}>{isHindi ? "क्विज़ हब" : "Quiz Hub"}</span>
                <span className={`${styles.pillBadge} ${styles.pillBadgeActive}`} style={{ background: "#16a34a", color: "#ffffff" }}>{isHindi ? "सक्रिय" : "Active"}</span>
              </Link>

              <Link href="/daily-current-affairs" className={styles.navPill}>
                <span>📰</span>
                <span>{isHindi ? "करंट अफेयर्स" : "Current Affairs"}</span>
                <span className={`${styles.pillBadge} ${styles.pillBadgeActive}`}>{isHindi ? "सक्रिय" : "Active"}</span>
              </Link>

              <div className={`${styles.navPill} ${styles.navPillDisabled}`}>
                <span>💼</span>
                <span>{isHindi ? "करियर गाइड" : "Career Guide"}</span>
                <span className={`${styles.pillBadge} ${styles.pillBadgeSoon}`}>{isHindi ? "शीघ्र" : "Soon"}</span>
              </div>

              <Link href="/mock-tests" className={styles.navPill} style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.12) 100%)", border: "1px solid rgba(99,102,241,0.25)" }}>
                <span>🏆</span>
                <span style={{ fontWeight: 800, color: "#4f46e5" }}>{isHindi ? "मॉक टेस्ट सीरीज़" : "Mock Test Series"}</span>
                <span className={`${styles.pillBadge} ${styles.pillBadgeActive}`} style={{ background: "#6366f1", color: "#ffffff" }}>{isHindi ? "फ्लैगशिप" : "FLAGSHIP"}</span>
              </Link>
            </div>
          )}
        </div>

        {/* ── KIDS TIER SKIN: Large Picture-Tiles & Streak Counter ── */}
        {tier === "kids" && (
          <div className="w-full mt-6">
            {/* 1. Daily Streak Counter Widget (Requirement 5) */}
            <div className="w-full mb-8 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 text-white shadow-xl shadow-orange-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl shadow-inner shrink-0">
                  🔥
                </div>
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-0.5">
                    <h3 className="text-base sm:text-lg font-black tracking-tight">
                      {isHindi ? "3 दिन की स्ट्रीक! 🌟" : "3 Day Streak! 🌟"}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/25 text-white">
                      {isHindi ? "सक्रिय" : "Active"}
                    </span>
                  </div>
                  <p className="text-xs text-white/90 font-medium">
                    {isHindi
                      ? "रोज़ खेलें और चमचमाते स्टार्स व नए स्टिकर्स अनलॉक करें!"
                      : "Keep playing every day to unlock shiny stars and stickers!"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-2xl">
                  <span className="text-xs font-bold text-amber-200">Day:</span>
                  {["✓", "✓", "🔥", "⚪", "⚪"].map((dot, i) => (
                    <span
                      key={i}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                        i < 2
                          ? "bg-emerald-400 text-white"
                          : i === 2
                          ? "bg-amber-300 text-slate-900 shadow-md"
                          : "bg-white/20 text-white/40"
                      }`}
                    >
                      {dot}
                    </span>
                  ))}
                </div>
                <Link
                  href="/rewards"
                  className="px-4 py-2 rounded-2xl bg-white text-orange-600 font-black text-xs shadow-md hover:bg-amber-50 active:scale-95 transition-all whitespace-nowrap"
                >
                  {isHindi ? "इनाम 🎁" : "Rewards 🎁"}
                </Link>
              </div>
            </div>

            {/* 2. Subjects as Large Picture-Tiles (Requirement 2) */}
            <div className="w-full mb-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>🎨</span>
                    <span>{isHindi ? "पसंदीदा विषय चुनें" : "Pick Your Fun Subject"}</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    {isHindi
                      ? "बड़ी रंगीन टाइल पर टैप करें और 10-प्रश्नों का मजेदार क्विज़ शुरू करें!"
                      : "Tap any picture-tile below for a quick, pressure-free 10-question game!"}
                  </p>
                </div>
                <Link
                  href="/quizzes"
                  className="hidden sm:inline-flex items-center gap-1 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <span>{isHindi ? "सभी देखें" : "View All"}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
                {KIDS_PICTURE_TILES.map((tile) => {
                  const matched = (quizzes || []).find((q) =>
                    tile.matchKeywords.some(
                      (kw) =>
                        (q?.topic || "").toLowerCase().includes(kw) ||
                        (q?.slug || "").toLowerCase().includes(kw)
                    )
                  ) || quizzes?.[0];

                  const href = matched?.slug ? `/category/${matched.slug}` : "/quizzes";

                  return (
                    <Link
                      key={tile.id}
                      href={href}
                      className="group relative focus:outline-none"
                    >
                      <div
                        className={`relative aspect-[4/4.5] sm:aspect-[4/4.3] rounded-3xl bg-gradient-to-br ${tile.bgGradient} p-4 sm:p-5 flex flex-col justify-between text-white shadow-lg ${tile.shadowColor} hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-1.5 group-hover:scale-[1.02] group-active:scale-95 select-none overflow-hidden`}
                      >
                        {/* Background Glow Ring */}
                        <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-white/20 blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

                        {/* Top Chip */}
                        <div className="flex items-center justify-between z-10">
                          <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black bg-black/25 backdrop-blur-md text-white border border-white/20 shadow-sm">
                            {isHindi ? tile.badgeHi : tile.badge}
                          </span>
                          <span className="text-sm opacity-80 group-hover:rotate-12 transition-transform">✨</span>
                        </div>

                        {/* Giant Central Picture / Icon */}
                        <div className="my-auto flex items-center justify-center text-5xl sm:text-6xl drop-shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 pointer-events-none">
                          <span>{tile.emoji}</span>
                        </div>

                        {/* Minimal Title at Bottom */}
                        <div className="z-10 mt-auto">
                          <h3 className="text-sm sm:text-base font-black leading-tight drop-shadow-md text-white line-clamp-1">
                            {isHindi ? tile.titleHi : tile.title}
                          </h3>
                          <span className="text-[11px] font-bold text-white/90 flex items-center gap-1 mt-0.5 group-hover:translate-x-0.5 transition-transform">
                            <span>{isHindi ? "खेलें" : "Play"}</span>
                            <span>→</span>
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Kids Rewards Banner */}
            <Link
              href="/rewards"
              className="block mb-8 p-1 rounded-3xl bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 hover:scale-[1.01] transition-transform shadow-xl shadow-pink-500/10 group"
            >
              <div className="bg-white dark:bg-slate-900 rounded-2xl px-6 sm:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden relative">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    ⭐
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                      {isHindi ? "आपका स्टिकर एल्बम और स्टार्स" : "Your Sticker Album & Stars"}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-md">
                      {isHindi
                        ? "क्विज़ खेलें, नए स्टिकर्स अनलॉक करें और अपने दोस्तों को दिखाएं!"
                        : "Collect stars, unlock fun badges, and show off your achievements!"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest text-xs sm:text-sm relative z-10">
                  {isHindi ? "इनाम देखें" : "Open Rewards"} <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* ── STUDENTS TIER SKIN: Class Selector, Streak/XP Widget, Study Lane & Fun Zone Lane ── */}
        {tier === "students" && (
          <div className="w-full mt-6">
            {/* 1. Class & Board Selector Bar (Requirement 2) */}
            <div className="w-full mb-6 p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-800 dark:text-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center text-xl shadow-md shrink-0">
                  🎓
                </div>
                <div>
                  <div className="text-[11px] font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                    {isHindi ? "सक्रिय पाठ्यक्रम व बोर्ड" : "Selected Board & Grade"}
                  </div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    {studentGrade}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <StudentClassSelector />
                <Link
                  href="/school-study"
                  className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold shadow-sm transition-all whitespace-nowrap"
                >
                  <span>{isHindi ? "बोर्ड रिवीज़न" : "Board Revision"}</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* 2. Streak + XP Counter Widget (Students Tier - Requirement 4) */}
            <div className="w-full mb-8 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-sky-500/30 shadow-2xl shadow-indigo-950/50 text-white flex flex-col lg:flex-row items-center justify-between gap-6">
              {/* Left: Streak & XP overview */}
              <div className="flex items-center gap-4 text-center sm:text-left w-full lg:w-auto">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-0.5 shadow-lg shadow-orange-500/30 shrink-0">
                  <div className="w-full h-full rounded-[14px] bg-slate-950 flex flex-col items-center justify-center">
                    <span className="text-2xl leading-none">🔥</span>
                    <span className="text-[10px] font-black text-amber-300 uppercase tracking-tighter mt-1">5 DAYS</span>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                    <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                      <span>{isHindi ? "5 दिन की पढ़ाई स्ट्रीक!" : "5 Day Study Streak!"}</span>
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/40">
                      ⚡ 1,450 XP
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {isHindi ? "लेवल 6 स्कॉलर" : "Level 6 Scholar"}
                    </span>
                  </div>

                  {/* XP Progress Bar */}
                  <div className="w-full max-w-md">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                      <span>{isHindi ? "लेवल 7 की ओर प्रगति" : "Progress to Level 7"}</span>
                      <span className="text-sky-400">72% (550 XP to go)</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-pink-500 transition-all duration-1000"
                        style={{ width: "72%" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Weekly Calendar Check & Leaderboard CTA */}
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full lg:w-auto">
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3.5 py-2 rounded-2xl backdrop-blur-md">
                  {[
                    { day: "M", done: true },
                    { day: "T", done: true },
                    { day: "W", done: true },
                    { day: "T", done: true },
                    { day: "F", active: true },
                    { day: "S", done: false },
                    { day: "S", done: false },
                  ].map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className="text-[9px] font-black text-slate-400">{d.day}</span>
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                          d.done
                            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                            : d.active
                            ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/50 ring-2 ring-amber-300/40"
                            : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        {d.done ? "✓" : d.active ? "🔥" : "·"}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/leaderboard"
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-sky-500/20 active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span>🏆 {isHindi ? "क्लास लीडरबोर्ड" : "Class Ranks"}</span>
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-white/20 text-white">Soon</span>
                </Link>
              </div>
            </div>

            {/* 3. Lane 1: Study Quizzes (School-subject categories - Requirement 3) */}
            <div className="w-full mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl shrink-0">
                    📚
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{isHindi ? "अध्ययन क्विज़ (स्कूल पाठ्यक्रम)" : "Study Quizzes"}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        {studentGrade ? studentGrade.split("—")[0].trim() : "School"}
                      </span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      {isHindi
                        ? "कक्षा और बोर्ड के अनुसार विज्ञान, गणित, सामाजिक विज्ञान व व्याकरण के अध्याय-वार अभ्यास सेट।"
                        : "Subject & chapter revision sets aligned for your school curriculum & board examinations."}
                    </p>
                  </div>
                </div>

                <Link
                  href="/school-study"
                  className="hidden sm:inline-flex items-center gap-1 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <span>{isHindi ? "सभी विषय देखें" : "View All"}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
                {studyCategories.slice(0, 8).map((cat) => (
                  <CategoryCard key={cat.id} category={cat} />
                ))}
              </div>
            </div>

            {/* 4. Lane 2: Fun Zone (General trivia / KBC-style categories - Requirement 3) */}
            <div className="w-full mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl shrink-0">
                    ⚡
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{isHindi ? "फन ज़ोन व ट्रिविया (KBC स्टाइल)" : "Fun Zone"}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        Brain Teasers
                      </span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      {isHindi
                        ? "केबीसी स्टाइल सामान्य ज्ञान, दिमागी पहेलियां, खेल, सिनेमा और रोचक तथ्य।"
                        : "KBC-style rapid trivia, curiosity facts, brain teasers & mental agility quizzes."}
                    </p>
                  </div>
                </div>

                <Link
                  href="/quizzes"
                  className="hidden sm:inline-flex items-center gap-1 text-xs font-black text-amber-600 dark:text-amber-400 hover:underline"
                >
                  <span>{isHindi ? "सभी ट्रिविया देखें" : "Explore Trivia"}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
                {funCategories.slice(0, 8).map((cat) => (
                  <CategoryCard key={cat.id} category={cat} />
                ))}
              </div>
            </div>

            {/* 5. Leaderboard & Friend Challenge Stub Card (Requirement 5) */}
            <Link
              href="/leaderboard"
              className="block mb-8 p-1 rounded-3xl bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 hover:scale-[1.01] transition-transform shadow-xl shadow-indigo-500/10 group"
            >
              <div className="bg-white dark:bg-slate-900 rounded-2xl px-6 sm:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden relative">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shrink-0">
                    🏆
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        {isHindi ? "कक्षा लीडरबोर्ड व सहपाठियों को चुनौती" : "Class Leaderboard & Friend Challenges"}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                        {isHindi ? "शीघ्र आ रहा है" : "Coming Soon"}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-xl">
                      {isHindi
                        ? "अपने स्कूल व बोर्ड के सहपाठियों के साथ XP अंकों की तुलना करें और 1-ऑन-1 क्विज़ मुकाबला खेलें!"
                        : "Track weekly study XP with classmates across your board and challenge friends to 1v1 live quiz duels!"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest text-xs sm:text-sm relative z-10 whitespace-nowrap">
                  <span>{isHindi ? "लीडरबोर्ड देखें" : "View Leaderboard"}</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* ── ADULTS TIER: Two Clearly Signposted Sections (Requirement 1 & 2) ── */}
        {(tier === "adults" || (tier !== "kids" && tier !== "students")) && (
          <div className="w-full mt-6 space-y-12">
            
            {/* ══════════════════════════════════════════════════════════
                SECTION 1: "Play & Learn" — SURFACED FIRST
                General trivia/GK/fun categories, no exam framing
               ══════════════════════════════════════════════════════════ */}
            <section id="play-learn" className="w-full">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
                    <span>🎮</span>
                    <span>{isHindi ? "मनोरंजन व सामान्य ज्ञान" : "Casual Play & Trivia"}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>🧠</span>
                    <span>{isHindi ? "खेलें और सीखें (Play & Learn)" : "Play & Learn"}</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mt-1">
                    {isHindi
                      ? "दैनिक रोचक ट्रिविया, केबीसी स्टाइल सामान्य ज्ञान, विज्ञान, भूगोल व दिमागी पहेलियां — बिना किसी परीक्षा के तनाव के खेलें!"
                      : "Daily rapid trivia, general knowledge, pop culture, science & brain teasers — play for fun, casually learn, anytime."}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/quizzes"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-black transition-all"
                  >
                    <span>{isHindi ? "सभी क्विज़ विषय देखें" : "Explore All Quizzes"}</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Requirement 2: Difficulty filter scoped to whole Quiz Hub */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 mb-5 flex-wrap">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider mr-1">
                  {isHindi ? "कठिनाई स्तर:" : "Difficulty:"}
                </span>
                {[
                  { id: "all", label: isHindi ? "सभी स्तर" : "All", icon: "✨" },
                  { id: "easy", label: isHindi ? "सरल" : "Easy", icon: "🟢" },
                  { id: "medium", label: isHindi ? "मध्यम" : "Medium", icon: "🟡" },
                  { id: "hard", label: isHindi ? "कठिन" : "Hard", icon: "🔴" },
                ].map((diff) => (
                  <button
                    key={diff.id}
                    onClick={() => setAdultDifficulty(diff.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                      adultDifficulty === diff.id
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25 scale-105"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>{diff.icon}</span>
                    <span>{diff.label}</span>
                  </button>
                ))}
              </div>

              {/* General Category Cards Grid (Step 2 Seekho-pattern CategoryCard) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
                {filteredAdultPlayCategories.slice(0, 8).map((cat) => (
                  <CategoryCard key={cat.id} category={cat} />
                ))}
              </div>
            </section>

            {/* ══════════════════════════════════════════════════════════
                SECTION 2: "Exam Prep" — DEDICATED SEPARATE SECTION
                Mock Tests, current affairs, exam-specific content
               ══════════════════════════════════════════════════════════ */}
            <section id="exam-prep" className="w-full pt-8 border-t border-slate-200 dark:border-slate-800">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider mb-2">
                    <ShieldCheck size={14} />
                    <span>{isHindi ? "प्रतियोगी परीक्षा हब" : "Aspirant & Exam Series"}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>🏛️</span>
                    <span>{isHindi ? "सरकारी परीक्षा तैयारी (Exam Prep)" : "Government Exam Prep"}</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mt-1">
                    {isHindi
                      ? "एसएससी, बैंकिंग, रेलवे और पुलिस परीक्षाओं के लिए टीसीएस पैटर्न लाइव टाइमर, नेगेटिव मार्किंग और ऑल-इंडिया रैंक के साथ अभ्यास करें।"
                      : "Targeted full-length mock tests, TCS timer interface, negative marking, and daily exam current affairs."}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/mock-tests"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-black transition-all"
                  >
                    <span>{isHindi ? "सभी मॉक टेस्ट देखें" : "View All Mocks"}</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Requirement 2: Exam-tag filter (SSC/Banking/Railway/Police) SCOPED TO THIS SECTION ONLY */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 mb-6 flex-wrap">
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                  <span>🏛️</span>
                  <span>{isHindi ? "परीक्षा बोर्ड:" : "Exam Boards:"}</span>
                </span>
                {[
                  { id: "ssc", label: "🏛️ SSC (CGL, CHSL, CPO)", href: "/mock-tests" },
                  { id: "banking", label: "🏦 Banking (IBPS, SBI PO)", href: "/mock-tests" },
                  { id: "railway", label: "🚆 Railway (RRB NTPC, ALP)", href: "/mock-tests" },
                  { id: "police", label: "👮 Police & State Exams", href: "/mock-tests" },
                ].map((board) => (
                  <Link
                    key={board.id}
                    href={board.href}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/60 dark:border-indigo-800/60 transition-all hover:scale-105"
                  >
                    {board.label}
                  </Link>
                ))}
              </div>

              {/* Mock Test Showcase Dialogue Card */}
              <div className={styles.mockTestShowcaseCard} style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  
                  {/* Header Tag & Bilingual Badge */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.25)", padding: "3px 10px", borderRadius: "16px", fontSize: "0.72rem", fontWeight: 800, color: "#4f46e5" }}>
                      <Zap size={13} />
                      <span>{isHindi ? "🏆 ऑल इंडिया लाइव मॉक टेस्ट सीरीज़" : "🏆 ALL INDIA LIVE MOCK TEST SERIES"}</span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px" }}>
                      <Globe size={13} className="text-indigo-500" />
                      <span>{isHindi ? "द्विभाषी (Hindi & English)" : "Bilingual (Hindi & English)"}</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 900, margin: "0 0 4px 0", lineHeight: 1.3, color: "var(--text-primary)" }}>
                      {isHindi ? "सरकारी परीक्षा मॉक टेस्ट सीरीज़ (TCS पैटर्न)" : "Government Exam Mock Test Series (TCS Pattern)"}
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0, lineHeight: 1.4 }}>
                      {isHindi
                        ? "TCS नवीन पैटर्न, लाइव टाइमर, नेगेटिव मार्किंग और ऑल इंडिया रैंक के साथ 100% फ्री प्रैक्टिस टेस्ट।"
                        : "Practice with real TCS exam pattern timer, section cutoff, negative marking & instant detailed solutions."}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
                    <Link
                      href={trialPaper?.id ? `/mock-tests/paper/${trialPaper.id}/instructions` : "/mock-tests"}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "10px 20px",
                        borderRadius: "12px",
                        background: "#4f46e5",
                        color: "#ffffff",
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
                        textDecoration: "none"
                      }}
                    >
                      <Play size={15} fill="#fff" />
                      <span>{isHindi ? "फ्री लाइव ट्रायल टेस्ट दें" : "Start Free Trial Test"}</span>
                    </Link>

                    <Link
                      href="/mock-tests"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "10px 18px",
                        borderRadius: "12px",
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--card-border)",
                        color: "var(--text-primary)",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        textDecoration: "none"
                      }}
                    >
                      <Award size={15} />
                      <span>{isHindi ? "सभी परीक्षा टेस्ट सीरीज़ देखें" : "Explore All Test Series"}</span>
                    </Link>
                  </div>

                </div>
              </div>

              {/* Two Exam Verticals: Current Affairs & Career Guide */}
              <div className={styles.grid}>
                {/* Vertical: Current Affairs */}
                <div className={`${styles.card} ${styles.cardCA}`}>
                  <div>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardIcon}>📰</div>
                      <span className={styles.cardBadge}>{isHindi ? "दैनिक अपडेट" : "Daily Live"}</span>
                    </div>
                    <h3 className={styles.cardTitle}>{isHindi ? "करंट अफेयर्स" : "Current Affairs"}</h3>
                    <p className={styles.cardDescription}>
                      {isHindi ? "दैनिक समसामयिकी समाचार, मासिक संग्रह और परीक्षा उपयोगी वन-लाइनर्स।" : "Daily news digests, calendar archives & exam-oriented current affairs notes."}
                    </p>
                    
                    <div className={styles.previewWrapperInline}>
                      {mounted ? <CAPreviewWidget /> : <div className="animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl w-full h-[120px]" />}
                    </div>
                  </div>

                  <Link href="/daily-current-affairs" className={styles.mainAction}>
                    <span className={styles.viewAll}>
                      {isHindi ? "करंट अफेयर्स पढ़ें" : "Read Current Affairs"} <ArrowRight size={18} />
                    </span>
                  </Link>
                </div>

                {/* Vertical: Career Guide */}
                <div className={`${styles.card} ${styles.cardCareer}`}>
                  <div>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardIcon}>💼</div>
                      <span className={styles.cardBadge}>{isHindi ? "जल्द आ रहा है" : "Coming Soon"}</span>
                    </div>
                    <h3 className={styles.cardTitle}>{isHindi ? "करियर गाइड" : "Career Guide"}</h3>
                    <p className={styles.cardDescription}>
                      {isHindi ? "परीक्षा रोडमैप, सरकारी नौकरी नोटिफिकेशन और करियर मार्गदर्शन।" : "Comprehensive exam roadmaps, job notifications, syllabus analysis & skill paths."}
                    </p>
                  </div>

                  <div className={styles.mainAction}>
                    <span className={styles.viewAll} style={{ opacity: 0.85 }}>
                      <Lock size={16} /> {isHindi ? "शीघ्र उपलब्ध होगा" : "Coming Soon"}
                    </span>
                  </div>
                </div>
              </div>

            </section>
          </div>
        )}

            {/* Optional Personalization Prompt */}
            {mounted && session && interests.length === 0 && !isLoadingInterests && (
              <div className="mt-10 p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-2">{t('hub.personalize.title') || "Personalize Your Learning Experience"}</h3>
                  <p className="text-slate-400 text-sm">{t('hub.personalize.desc') || "Select your favorite exam topics to get tailored recommendations."}</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={openOnboarding}
                    className="px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black rounded-xl transition-all hover:scale-105 text-sm"
                  >
                    {t('hub.personalize.action') || "Customize Now"}
                  </button>
                </div>
              </div>
            )}

            {/* Support / Donation Banner */}
            <Link href="/donate" className="block mt-12 p-1 rounded-3xl bg-gradient-to-r from-orange-400 to-rose-400 hover:scale-[1.01] transition-transform shadow-xl dark:shadow-none shadow-rose-100 group">
              <div className="bg-white dark:bg-slate-900 rounded-2xl px-6 sm:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden relative">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-2xl group-hover:rotate-12 transition-transform">🧡</div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">{t('hub.support.title') || "Support Our Free Mission"}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-md">{t('hub.support.desc') || "Help us keep quality educational content 100% free for students everywhere."}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest text-xs sm:text-sm relative z-10">
                  {t('hub.support.action') || "Support Us"} <ArrowRight size={16} />
                </div>
                <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-rose-50 dark:bg-rose-900/10 rounded-full blur-2xl opacity-50" />
              </div>
            </Link>
      </main>
    </div>
  );
}
