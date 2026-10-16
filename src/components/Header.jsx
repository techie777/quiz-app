"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Flame,
  Volume2,
  VolumeX,
  Home,
  Target,
  Swords,
  GraduationCap,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Compass,
  ArrowRight,
  Newspaper,
  Trophy,
} from "lucide-react";
import { useUI } from "@/context/UIContext";
import { useTier } from "@/context/TierContext";
import { useLanguage } from "@/context/LanguageContext";
import styles from "@/styles/Header.module.css";

// Web Audio API Synthesizer for tactile feedback
const playTone = (type = "pop", soundEnabled = true) => {
  if (!soundEnabled || typeof window === "undefined") return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === "pop") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (type === "success") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.08);
      osc.frequency.setValueAtTime(659.25, now + 0.16);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.32);
    }
  } catch (e) {}
};

export default function Header() {
  const { toggleMasterSidebar, toggleMobileMenu, isMasterSidebarOpen, isMobileMenuOpen } = useUI();
  const pathname = usePathname();
  const router = useRouter();
  const { hasSavedTier, clearTier } = useTier();
  const { isHindi, toggleLanguage } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [streakCount, setStreakCount] = useState(5);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Master Dropdown state & debounce ref
  const [openDropdown, setOpenDropdown] = useState(null);
  const timeoutRef = useRef(null);

  const handleMouseEnter = (name) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenDropdown(name);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 180);
  };

  const toggleDropdown = (name) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  useEffect(() => {
    setOpenDropdown(null);
  }, [pathname]);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem("daily_quiz_streak");
      if (saved) setStreakCount(parseInt(saved, 10));
      const soundPref = localStorage.getItem("quiz_sound_enabled");
      if (soundPref !== null) setSoundEnabled(soundPref === "true");
    } catch {}
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 8) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogoClick = (e) => {
    e.preventDefault();
    clearTier();
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/");
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem("quiz_sound_enabled", String(next));
    } catch {}
    if (next) playTone("pop", true);
  };

  const handleCreateLiveRoom = () => {
    playTone("success", soundEnabled);
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    router.push(`/arena?room=${pin}&host=true&mode=battle`);
  };

  const isQuizOrExamRoute =
    pathname?.startsWith("/quiz/") ||
    pathname?.includes("/mock-tests/paper/") ||
    pathname?.startsWith("/live/") ||
    pathname?.startsWith("/t/");
  const isFlashcardRoute =
    pathname?.startsWith("/fun-facts") || pathname?.startsWith("/true-false");
  const isArenaRoute = pathname?.startsWith("/arena");
  const isSchoolStudyRoute = pathname?.startsWith("/school-study");

  if (
    pathname?.startsWith("/admin") ||
    isQuizOrExamRoute ||
    isFlashcardRoute ||
    isArenaRoute ||
    isSchoolStudyRoute
  ) {
    return null;
  }

  const isQuizzesActive = pathname === "/quizzes" || pathname?.startsWith("/category");
  const isHomeActive = pathname === "/";
  const isExamsActive = pathname?.startsWith("/govt-exams") || pathname?.startsWith("/mock-tests");
  const isFlexBooksActive = pathname === "/gk-book" || pathname?.startsWith("/gk-book");
  const isBattleActive = pathname?.startsWith("/arena");

  return (
    <>
      <header
        className={`sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 transition-all ${
          isScrolled ? "shadow-xs" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 lg:gap-6">
          
          {/* ================= 1. BRAND LOGO & BADGE ================= */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/"
              onClick={handleLogoClick}
              className="flex items-center gap-2.5 no-underline group cursor-pointer shrink-0"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30 group-hover:scale-105 transition-transform shrink-0">
                <Sparkles className="w-4 h-4 text-indigo-100" />
              </div>
              <div className="flex items-center shrink-0">
                <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                  Quiz<span className="text-indigo-600 dark:text-indigo-400">Web</span>
                </span>
                <span className="hidden sm:inline-flex items-center ml-2 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider uppercase rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 whitespace-nowrap shrink-0">
                  GK Arcade
                </span>
              </div>
            </Link>
          </div>

          {/* ================= 2. DESKTOP MASTER NAVIGATION (UNCLUTTERED & VISIBLE) ================= */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-sm font-semibold shrink-0">
            {/* 1. Home Direct Link */}
            <Link
              href="/"
              onClick={() => playTone("pop", soundEnabled)}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 no-underline whitespace-nowrap shrink-0 ${
                isHomeActive
                  ? "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-100 dark:border-indigo-800/80 shadow-2xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80"
              }`}
            >
              <Home className="w-4 h-4 shrink-0" />
              <span>{isHindi ? "होम" : "Home"}</span>
            </Link>

            {/* 2. Quizzes Master Dropdown (100% OPAQUE & HIGH VISIBILITY) */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("quizzes")}
              onMouseLeave={handleMouseLeave}
            >
              <button
                onClick={() => {
                  playTone("pop", soundEnabled);
                  toggleDropdown("quizzes");
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  isQuizzesActive || openDropdown === "quizzes"
                    ? "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-100 dark:border-indigo-800/80 shadow-2xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80"
                }`}
              >
                <Target className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                <span>{isHindi ? "क्विज़ हब" : "Quizzes"}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    openDropdown === "quizzes" ? "rotate-180 text-indigo-600" : ""
                  }`}
                />
              </button>

              {/* Quizzes Dropdown Panel */}
              {openDropdown === "quizzes" && (
                <div className="absolute top-full left-0 pt-2 z-50">
                  <div
                    className="w-[380px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3.5 space-y-2 ring-1 ring-black/10 dark:ring-white/10"
                  >
                    <div className="px-2 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {isHindi ? "सामान्य ज्ञान व क्विज़ विषय" : "GK & Quizzes Hub"}
                      </span>
                      <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-full">
                        200+ Topics
                      </span>
                    </div>

                    <div className="space-y-1">
                      <Link
                        href="/quizzes"
                        onClick={() => {
                          setOpenDropdown(null);
                          playTone("pop", soundEnabled);
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group no-underline"
                      >
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Target className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition truncate">
                            {isHindi ? "सभी क्विज़ मुख्य पृष्ठ (All Quizzes)" : "All Quizzes Directory"}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {isHindi ? "विषय-वार लाइव टेस्ट, अभ्यास व विजुअल मोड" : "Explore all subjects, levels & play modes"}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                      </Link>

                      <Link
                        href="/category/bharat-ka-samanya-gyan"
                        onClick={() => {
                          setOpenDropdown(null);
                          playTone("pop", soundEnabled);
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group no-underline"
                      >
                        <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition truncate">
                            {isHindi ? "भारत का सामान्य ज्ञान (National GK)" : "India General Knowledge"}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {isHindi ? "इतिहास, भूगोल, संविधान व अर्थव्यवस्था" : "History, Geography, Polity & Culture"}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                      </Link>

                      <Link
                        href="/category/world-gk"
                        onClick={() => {
                          setOpenDropdown(null);
                          playTone("pop", soundEnabled);
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group no-underline"
                      >
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
                          <Compass className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition truncate">
                            {isHindi ? "विश्व सामान्य ज्ञान (World GK)" : "World GK & Geography"}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {isHindi ? "सौरमंडल, महाद्वीप, देश व राजधानियां" : "Solar system, continents & capitals"}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                      </Link>

                      <Link
                        href="/category/general-science"
                        onClick={() => {
                          setOpenDropdown(null);
                          playTone("pop", soundEnabled);
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group no-underline"
                      >
                        <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center shrink-0">
                          <Target className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition truncate">
                            {isHindi ? "सामान्य विज्ञान (Science GK)" : "General Science GK"}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {isHindi ? "भौतिक, रसायन व जीव विज्ञान तथ्य" : "Physics, Chemistry & Biology facts"}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                      </Link>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <Link
                        href="/quizzes"
                        onClick={() => {
                          setOpenDropdown(null);
                          playTone("pop", soundEnabled);
                        }}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition no-underline border border-indigo-200/60 dark:border-indigo-800/60"
                      >
                        <span>{isHindi ? "🎯 सभी 200+ क्विज़ ब्राउज़ करें →" : "🎯 Browse All 200+ Quizzes →"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. FlexBooks Master Dropdown (100% OPAQUE & HIGH VISIBILITY) */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("flexbooks")}
              onMouseLeave={handleMouseLeave}
            >
              <button
                onClick={() => {
                  playTone("pop", soundEnabled);
                  toggleDropdown("flexbooks");
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  isFlexBooksActive || openDropdown === "flexbooks"
                    ? "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-100 dark:border-indigo-800/80 shadow-2xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80"
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                <span>{isHindi ? "डिजिटल पुस्तकें" : "FlexBooks"}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    openDropdown === "flexbooks" ? "rotate-180 text-indigo-600" : ""
                  }`}
                />
              </button>

              {/* FlexBooks Dropdown Panel */}
              {openDropdown === "flexbooks" && (
                <div className="absolute top-full left-0 pt-2 z-50">
                  <div
                    className="w-[380px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3.5 space-y-2 ring-1 ring-black/10 dark:ring-white/10"
                  >
                    <div className="px-2 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {isHindi ? "डिजिटल लाइब्रेरी व संरचित नोट्स" : "Digital FlexBooks Library"}
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                        Read Mode
                      </span>
                    </div>

                    <div className="space-y-1">
                      <Link
                        href="/gk-book"
                        onClick={() => {
                          setOpenDropdown(null);
                          playTone("pop", soundEnabled);
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group no-underline"
                      >
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition truncate">
                            {isHindi ? "मेरी डिजिटल पुस्तकें (My Bookshelf)" : "My Digital Bookshelf"}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {isHindi ? "सभी उपलब्ध 5 पुस्तकें, प्रगति व अध्याय सूची" : "Access all structured book collections"}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                      </Link>

                      <Link
                        href="/gk-book?book=india-gk"
                        onClick={() => {
                          setOpenDropdown(null);
                          playTone("pop", soundEnabled);
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group no-underline"
                      >
                        <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition truncate">
                            {isHindi ? "भारत का सामान्य ज्ञान (डिजिटल बुक)" : "India GK Complete Notes"}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {isHindi ? "सिंधु घाटी, मौर्य, गुप्त से आधुनिक भारत" : "Chapter notes with key facts & dates"}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                      </Link>

                      <Link
                        href="/gk-book?book=world-gk"
                        onClick={() => {
                          setOpenDropdown(null);
                          playTone("pop", soundEnabled);
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group no-underline"
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                          <Compass className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition truncate">
                            {isHindi ? "विश्व भूगोल व ब्रह्मांड (डिजिटल बुक)" : "World GK & Universe Atlas"}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {isHindi ? "सौरमंडल, महासागर, पर्वत व जलवायु" : "Planets, oceans, maps & global trivia"}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                      </Link>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <Link
                        href="/gk-book"
                        onClick={() => {
                          setOpenDropdown(null);
                          playTone("pop", soundEnabled);
                        }}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition no-underline border border-indigo-200/60 dark:border-indigo-800/60"
                      >
                        <span>{isHindi ? "📚 डिजिटल पुस्तकालय खोलें →" : "📚 Open Digital Bookshelf →"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Exams Master Dropdown (100% OPAQUE & HIGH VISIBILITY) */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("exams")}
              onMouseLeave={handleMouseLeave}
            >
              <button
                onClick={() => {
                  playTone("pop", soundEnabled);
                  toggleDropdown("exams");
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  isExamsActive || openDropdown === "exams"
                    ? "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-100 dark:border-indigo-800/80 shadow-2xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80"
                }`}
              >
                <GraduationCap className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                <span>{isHindi ? "परीक्षा हब" : "Exams"}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    openDropdown === "exams" ? "rotate-180 text-indigo-600" : ""
                  }`}
                />
              </button>

              {/* Exams Dropdown Panel */}
              {openDropdown === "exams" && (
                <div className="absolute top-full left-0 pt-2 z-50">
                  <div
                    className="w-[380px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3.5 space-y-2 ring-1 ring-black/10 dark:ring-white/10"
                  >
                    <div className="px-2 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {isHindi ? "प्रतियोगी परीक्षा तैयारी" : "Govt Competitive Exams"}
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                        Mocks & Alerts
                      </span>
                    </div>

                    <div className="space-y-1">
                      <Link
                        href="/govt-exams"
                        onClick={() => {
                          setOpenDropdown(null);
                          playTone("pop", soundEnabled);
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group no-underline"
                      >
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition truncate">
                            {isHindi ? "सरकारी परीक्षा हब (Exams Portal)" : "All Govt Exams Hub"}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {isHindi ? "SSC, Railway, Banking, Police व राज्य परीक्षाएं" : "Syllabus, papers & targeted practice"}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                      </Link>

                      <Link
                        href="/mock-tests"
                        onClick={() => {
                          setOpenDropdown(null);
                          playTone("pop", soundEnabled);
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group no-underline"
                      >
                        <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950 text-violet-600 border border-violet-200 dark:border-violet-800 flex items-center justify-center shrink-0">
                          <Target className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition truncate">
                            {isHindi ? "संपूर्ण मॉक टेस्ट सीरीज" : "Full-Length Mock Tests"}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {isHindi ? "टाइम-बाउंड वास्तविक परीक्षा सिमुलेशन व स्कोर" : "Timed tests with instant score analysis"}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                      </Link>

                      <Link
                        href="/daily-current-affairs"
                        onClick={() => {
                          setOpenDropdown(null);
                          playTone("pop", soundEnabled);
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group no-underline"
                      >
                        <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950 text-orange-600 border border-orange-200 dark:border-orange-800 flex items-center justify-center shrink-0">
                          <Newspaper className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition truncate">
                            {isHindi ? "दैनिक करेंट अफेयर्स (Current Affairs)" : "Daily Current Affairs"}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {isHindi ? "दैनिक व मासिक समसामयिकी प्रश्नोत्तरी" : "Daily news capsule & monthly quiz"}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                      </Link>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <Link
                        href="/govt-exams"
                        onClick={() => {
                          setOpenDropdown(null);
                          playTone("pop", soundEnabled);
                        }}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition no-underline border border-indigo-200/60 dark:border-indigo-800/60"
                      >
                        <span>{isHindi ? "🎓 सभी परीक्षाएं देखें →" : "🎓 Explore All Exams →"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. 1v1 Battle Direct Link (No Extra Clutter Dropdown) */}
            <Link
              href="/arena?mode=battle"
              onClick={() => playTone("pop", soundEnabled)}
              className="px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 no-underline whitespace-nowrap shrink-0 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80"
            >
              <Swords className="w-4 h-4 shrink-0 text-amber-500" />
              <span>{isHindi ? "1v1 मुकाबला" : "1v1 Battle"}</span>
              <span className="px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white rounded-full animate-pulse">
                LIVE
              </span>
            </Link>
          </nav>

          {/* ================= 3. ACTIONS: AUDIO, STREAK, CREATE ROOM & MASTER SIDEBAR ================= */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Audio Synthesizer Toggle */}
            <button
              onClick={toggleSound}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 border ${
                soundEnabled
                  ? "bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 shadow-2xs"
                  : "bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
              }`}
              title={soundEnabled ? "Mute Sounds" : "Enable Audio"}
              aria-label="Toggle Sound"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 shrink-0" /> : <VolumeX className="w-4 h-4 shrink-0" />}
            </button>

            {/* Daily Streak Indicator */}
            <div
              title="Daily Active Streak"
              className="h-9 flex items-center gap-1.5 bg-amber-50/90 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 px-2.5 sm:px-3 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-200 shadow-2xs cursor-pointer active:scale-95 transition shrink-0 whitespace-nowrap"
              onClick={() =>
                alert(
                  isHindi
                    ? `🔥 शानदार! आपकी लगातार अध्ययन स्ट्रीक ${streakCount} दिनों की है।`
                    : `🔥 Awesome! Your active study streak is ${streakCount} days.`
                )
              }
            >
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse shrink-0" />
              <span className="font-mono font-bold whitespace-nowrap">{streakCount}d</span>
              <span className="hidden sm:inline font-semibold text-amber-800/90 dark:text-amber-300/90 text-[11px] whitespace-nowrap">Streak</span>
            </div>

            {/* Quick 1v1 CTA (Desktop Only) */}
            <button
              onClick={handleCreateLiveRoom}
              className="hidden lg:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 active:scale-95 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Swords className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>Create Room</span>
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer shrink-0 whitespace-nowrap flex items-center justify-center"
              title="Toggle Language"
            >
              {isHindi ? "EN" : "हिन्दी"}
            </button>

            {/* Master Sidebar Drawer Trigger (Universal for Desktop & Mobile) */}
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition cursor-pointer shrink-0"
              onClick={() => {
                playTone("pop", soundEnabled);
                toggleMasterSidebar();
              }}
              aria-label="Toggle navigation drawer"
              title={isHindi ? "मास्टर साइडबार खोलें" : "Open Master Navigation Sidebar"}
            >
              <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </button>
          </div>

        </div>
      </header>
    </>
  );
}
