"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  X,
  Search,
  Home,
  Target,
  BookOpen,
  GraduationCap,
  Swords,
  Trophy,
  Sparkles,
  Newspaper,
  Heart,
  User,
  LogOut,
  Flame,
  Volume2,
  VolumeX,
  Compass,
  ArrowRight,
  School,
  Smile,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useUI } from "@/context/UIContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "next-themes";

export default function MasterSidebar() {
  const { isMasterSidebarOpen, closeMasterSidebar } = useUI();
  const { isHindi, toggleLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const [searchQuery, setSearchQuery] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [streakCount, setStreakCount] = useState(5);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("daily_quiz_streak");
      if (saved) setStreakCount(parseInt(saved, 10));
      const soundPref = localStorage.getItem("quiz_sound_enabled");
      if (soundPref !== null) setSoundEnabled(soundPref === "true");
    } catch {}
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem("quiz_sound_enabled", String(next));
    } catch {}
  };

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isMasterSidebarOpen) {
        closeMasterSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMasterSidebarOpen, closeMasterSidebar]);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (isMasterSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMasterSidebarOpen]);

  const masterSections = useMemo(
    () => [
      {
        id: "quizzes",
        title: isHindi ? "सामान्य ज्ञान व क्विज़ हब" : "General Knowledge & Quizzes",
        badge: "HOT",
        badgeColor: "bg-amber-500",
        items: [
          {
            href: "/quizzes",
            label: isHindi ? "सभी क्विज़ (All Quizzes)" : "All Quizzes Hub",
            desc: isHindi ? "200+ विषय, अध्याय-वार अभ्यास" : "200+ topics, chapter quizzes",
            icon: Target,
            iconColor: "text-indigo-500",
          },
          {
            href: "/category/bharat-ka-samanya-gyan",
            label: isHindi ? "भारत सामान्य ज्ञान" : "India General Knowledge",
            desc: isHindi ? "इतिहास, भूगोल, संविधान व अर्थव्यवस्था" : "History, Geography, Polity",
            icon: Sparkles,
            iconColor: "text-amber-500",
          },
          {
            href: "/category/world-gk",
            label: isHindi ? "विश्व सामान्य ज्ञान" : "World GK & Geography",
            desc: isHindi ? "सौरमंडल, महाद्वीप, देश व राजधानियां" : "Solar system, continents, capitals",
            icon: Compass,
            iconColor: "text-emerald-500",
          },
          {
            href: "/category/general-science",
            label: isHindi ? "सामान्य विज्ञान (Science GK)" : "General Science GK",
            desc: isHindi ? "भौतिक, रसायन व जीव विज्ञान" : "Physics, Chemistry, Biology",
            icon: Target,
            iconColor: "text-cyan-500",
          },
        ],
      },
      {
        id: "books",
        title: isHindi ? "मेरी डिजिटल पुस्तकें (FlexBooks)" : "Digital FlexBooks",
        badge: "READ",
        badgeColor: "bg-indigo-600",
        items: [
          {
            href: "/gk-book",
            label: isHindi ? "डिजिटल पुस्तकालय (My Bookshelf)" : "Digital Bookshelf",
            desc: isHindi ? "अध्याय-वार संरचित नोट्स व त्वरित रिवीजन" : "Chapter-wise notes & quick review",
            icon: BookOpen,
            iconColor: "text-indigo-500",
          },
          {
            href: "/gk-book?book=india-gk",
            label: isHindi ? "भारत का सामान्य ज्ञान (डिजिटल बुक)" : "India GK Digital Book",
            desc: isHindi ? "सिंधु सभ्यता से आधुनिक भारत तक" : "Indus Valley to Modern India",
            icon: BookOpen,
            iconColor: "text-rose-500",
          },
          {
            href: "/gk-book?book=world-gk",
            label: isHindi ? "विश्व भूगोल व ब्रह्मांड (डिजिटल बुक)" : "World GK Digital Book",
            desc: isHindi ? "तथ्य, मानचित्र व विस्तृत सारांश" : "Facts, maps & visual notes",
            icon: BookOpen,
            iconColor: "text-blue-500",
          },
        ],
      },
      {
        id: "exams",
        title: isHindi ? "प्रतियोगी परीक्षा तैयारी" : "Competitive Govt Exams",
        badge: "EXAMS",
        badgeColor: "bg-emerald-600",
        items: [
          {
            href: "/govt-exams",
            label: isHindi ? "सरकारी परीक्षा हब (Exams Portal)" : "Govt Exams Portal",
            desc: isHindi ? "SSC, Railway, Banking, Police" : "All central & state competitive exams",
            icon: GraduationCap,
            iconColor: "text-emerald-500",
          },
          {
            href: "/mock-tests",
            label: isHindi ? "संपूर्ण मॉक टेस्ट सीरीज" : "Full-Length Mock Tests",
            desc: isHindi ? "टाइम-बाउंड वास्तविक परीक्षा सिमुलेशन" : "Real-exam timed test series",
            icon: Target,
            iconColor: "text-violet-500",
          },
          {
            href: "/daily-current-affairs",
            label: isHindi ? "दैनिक करेंट अफेयर्स" : "Daily Current Affairs",
            desc: isHindi ? "राष्ट्रीय व अंतर्राष्ट्रीय समसामयिकी" : "Daily news & monthly review",
            icon: Newspaper,
            iconColor: "text-orange-500",
          },
        ],
      },
      {
        id: "arena",
        title: isHindi ? "लाइव मुकाबला व गेमिंग" : "1v1 Battle Arena & Play",
        badge: "LIVE",
        badgeColor: "bg-red-500",
        items: [
          {
            href: "/arena?mode=battle",
            label: isHindi ? "1v1 लाइव क्विज़ मुकाबला" : "1v1 Live Quiz Battle",
            desc: isHindi ? "रीयल-टाइम दोस्तों या ऑनलाइन खिलाड़ियों से" : "Real-time live battle vs opponents",
            icon: Swords,
            iconColor: "text-amber-500",
          },
          {
            href: "/leaderboard",
            label: isHindi ? "ऑल-इंडिया लीडरबोर्ड" : "National Leaderboard",
            desc: isHindi ? "शीर्ष रैंकर्स, अंक व दैनिक स्ट्रीक" : "Top players, points & streak rankings",
            icon: Trophy,
            iconColor: "text-yellow-500",
          },
          {
            href: "/fun-facts",
            label: isHindi ? "रोचक तथ्य व फ़्लैशकार्ड्स" : "Fun Facts Flashcards",
            desc: isHindi ? "स्वाइप करके रोचक सामान्य ज्ञान जानें" : "Swipeable bite-sized trivia cards",
            icon: Sparkles,
            iconColor: "text-pink-500",
          },
        ],
      },
      {
        id: "special",
        title: isHindi ? "विशेष अध्ययन ज़ोन" : "Specialized Learning",
        items: [
          {
            href: "/school-study",
            label: isHindi ? "स्कूल स्टडी (कक्षा 6 से 12)" : "School Study (Class 6-12)",
            desc: isHindi ? "NCERT आधारित विषय-वार प्रश्नोत्तरी" : "NCERT-aligned curriculum & tests",
            icon: School,
            iconColor: "text-teal-500",
          },
          {
            href: "/kids-zone",
            label: isHindi ? "किड्स ज़ोन (Kids Zone)" : "Kids Learning Zone",
            desc: isHindi ? "रंग-बिरंगे विजुअल गेम्स व बेसिक ज्ञान" : "Fun games, animals & visual quiz",
            icon: Smile,
            iconColor: "text-purple-500",
          },
        ],
      },
    ],
    [isHindi]
  );

  // Filter sections based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return masterSections;
    const query = searchQuery.toLowerCase().trim();
    return masterSections
      .map((section) => {
        const matchesSection = section.title.toLowerCase().includes(query);
        const filteredItems = section.items.filter(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            item.desc.toLowerCase().includes(query) ||
            item.href.toLowerCase().includes(query)
        );
        if (matchesSection) return section;
        if (filteredItems.length > 0) return { ...section, items: filteredItems };
        return null;
      })
      .filter(Boolean);
  }, [searchQuery, masterSections]);

  return (
    <AnimatePresence>
      {isMasterSidebarOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeMasterSidebar}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Master Sidebar Drawer */}
          <div className="fixed inset-y-0 left-0 max-w-full flex">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="w-screen max-w-md bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full"
            >
              {/* 1. Header Bar */}
              <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                <Link
                  href="/"
                  onClick={closeMasterSidebar}
                  className="flex items-center gap-2.5 no-underline group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30 group-hover:scale-105 transition-transform shrink-0">
                    <Sparkles className="w-4 h-4 text-indigo-100" />
                  </div>
                  <div className="flex items-center">
                    <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                      Quiz<span className="text-indigo-600 dark:text-indigo-400">Web</span>
                    </span>
                    <span className="ml-2 px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 whitespace-nowrap">
                      Master Nav
                    </span>
                  </div>
                </Link>

                <button
                  onClick={closeMasterSidebar}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 2. Instant Search Input */}
              <div className="px-5 pt-3.5 pb-2.5 shrink-0">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isHindi ? "विषय, पुस्तक, या परीक्षा खोजें..." : "Search topics, books, or exams..."}
                    className="w-full pl-9 pr-8 py-2 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 3. Quick Stats & Utility Strip */}
              <div className="px-5 py-2.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/70 bg-slate-50/30 dark:bg-slate-950/20 text-xs shrink-0">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 px-2.5 py-1 rounded-lg">
                  <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
                  <span>{streakCount}d Streak</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Language switch */}
                  <button
                    onClick={toggleLanguage}
                    className="px-2 py-1 rounded-md text-[11px] font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  >
                    {isHindi ? "EN" : "हिन्दी"}
                  </button>

                  {/* Theme Switch */}
                  <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="w-7 h-7 rounded-md flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer text-xs"
                    title="Toggle Theme"
                  >
                    {theme === "dark" ? "🌙" : "☀️"}
                  </button>

                  {/* Sound Toggle */}
                  <button
                    onClick={toggleSound}
                    className="w-7 h-7 rounded-md flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                    title="Toggle Audio"
                  >
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-500" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                </div>
              </div>

              {/* 4. Scrollable Sections List */}
              <div className="flex-1 overflow-y-auto px-5 py-3 space-y-5 custom-scrollbar">
                {filteredSections.map((section) => (
                  <div key={section.id} className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {section.title}
                      </span>
                      {section.badge && (
                        <span
                          className={`text-[9px] font-black text-white px-1.5 py-0.2 rounded-sm tracking-wider ${section.badgeColor}`}
                        >
                          {section.badge}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-1">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={closeMasterSidebar}
                            className={`flex items-start gap-3 p-2.5 rounded-xl transition group no-underline ${
                              isActive
                                ? "bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                isActive
                                  ? "bg-indigo-600 text-white shadow-xs"
                                  : "bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 transition"
                              }`}
                            >
                              <Icon className={`w-4 h-4 ${isActive ? "text-white" : item.iconColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-xs sm:text-sm font-bold truncate ${
                                    isActive
                                      ? "text-indigo-950 dark:text-indigo-200"
                                      : "text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition"
                                  }`}
                                >
                                  {item.label}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition" />
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {item.desc}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {filteredSections.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    {isHindi ? "कोई परिणाम नहीं मिला।" : "No matching items found."}
                  </div>
                )}
              </div>

              {/* 5. Footer: User Account / Favorites */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 shrink-0 flex items-center justify-between">
                <Link
                  href="/my-favourites"
                  onClick={closeMasterSidebar}
                  className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 transition no-underline"
                >
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>{isHindi ? "पसंदीदा प्रश्न" : "Saved Quizzes"}</span>
                </Link>

                {status === "authenticated" && session?.user ? (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/profile"
                      onClick={closeMasterSidebar}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 no-underline"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[90px]">{session.user.name?.split(" ")[0]}</span>
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="text-xs text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                      title="Sign Out"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <span>{isHindi ? "साइन इन" : "Sign In"}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
