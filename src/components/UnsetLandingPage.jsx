"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  Flame, 
  Swords, 
  Rocket, 
  Compass, 
  GraduationCap, 
  Zap, 
  Baby, 
  Share2, 
  Heart, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  BookOpen, 
  Clock, 
  Copy, 
  Check, 
  Sparkle,
  X,
  ArrowRight,
  Newspaper
} from "lucide-react";
import { useTier, TIERS } from "@/context/TierContext";
import { useLanguage } from "@/context/LanguageContext";
import { useData } from "@/context/DataContext";
import MainHubsShowcase from "@/components/home/MainHubsShowcase";
import MasterFeaturesSection from "@/components/home/MasterFeaturesSection";

export default function UnsetLandingPage() {
  const router = useRouter();
  const { setTier } = useTier();
  const { isHindi, toggleLanguage } = useLanguage();
  const { quizzes } = useData();

  // Dynamic live stats fetched from database / public stats API
  const [liveStats, setLiveStats] = useState(null);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/public-stats", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data && typeof data.totalQuestions === "number") {
          setLiveStats(data);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch live public stats:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute live data stats with graceful fallback
  const { totalQuestions, totalCategories } = useMemo(() => {
    if (liveStats && typeof liveStats.totalQuestions === "number") {
      return {
        totalQuestions: liveStats.totalQuestions,
        totalCategories: liveStats.totalCategories || 38,
      };
    }

    const activeCats = Array.isArray(quizzes)
      ? quizzes.filter((c) => !c.hidden)
      : [];
    const mainCats = activeCats.filter((c) => !c.parentId);
    const catCount = mainCats.length > 0 ? mainCats.length : 38;
    const qCount = mainCats.reduce(
      (acc, c) => acc + (c.questionCount ?? c.questions?.length ?? 0),
      0
    );

    return {
      totalCategories: catCount > 0 ? catCount : 38,
      totalQuestions: qCount > 0 ? qCount : 3885,
    };
  }, [liveStats, quizzes]);

  // Interactive Modals State
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [joinRoomOpen, setJoinRoomOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [categoryModal, setCategoryModal] = useState(null);

  // Room generation state
  const [roomCode, setRoomCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");

  // Daily Question interactive state
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const correctAnswer = 2; // Option 3: "नील आर्मस्ट्रांग (Neil Armstrong)"

  // Daily streak state (stored in localStorage)
  const [streakCount, setStreakCount] = useState(5);

  useEffect(() => {
    try {
      const savedStreak = localStorage.getItem("daily_quiz_streak");
      if (savedStreak) {
        setStreakCount(parseInt(savedStreak, 10));
      }
      const savedDate = localStorage.getItem("daily_landing_q_date");
      const todayStr = new Date().toISOString().slice(0, 10);
      if (savedDate === todayStr) {
        setAnswered(true);
        const savedAns = localStorage.getItem("daily_landing_q_ans");
        if (savedAns !== null) {
          setSelectedAnswer(parseInt(savedAns, 10));
        }
      }
    } catch {}
  }, []);

  const generateRoom = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    setCopied(false);
    setCreateRoomOpen(true);
  };

  const copyCode = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(roomCode);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareRoomWhatsApp = () => {
    const text = isHindi
      ? `आओ मेरे साथ QuizWeb पर 1v1 लाइव क्विज़ मुकाबला खेलो! रूम कोड: ${roomCode}\n👉 ${typeof window !== "undefined" ? window.location.origin : ""}/live/${roomCode}`
      : `Challenge me to a 1v1 live quiz battle on QuizWeb! Room Code: ${roomCode}\n👉 ${typeof window !== "undefined" ? window.location.origin : ""}/live/${roomCode}`;
    
    if (navigator?.share) {
      navigator.share({
        title: isHindi ? "QuizWeb 1v1 मुकाबला" : "QuizWeb 1v1 Quiz Battle",
        text,
        url: typeof window !== "undefined" ? `${window.location.origin}/live/${roomCode}` : "",
      }).catch(() => {});
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const handleStartHostGame = () => {
    setCreateRoomOpen(false);
    router.push(`/live/${roomCode}?is_host=true`);
  };

  const handleJoinGame = () => {
    const cleanCode = joinCodeInput.trim();
    if (!cleanCode) return;
    setJoinRoomOpen(false);
    router.push(`/live/${cleanCode}`);
  };

  const handleAnswerClick = (index) => {
    if (answered) return;
    setSelectedAnswer(index);
    setAnswered(true);
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      localStorage.setItem("daily_landing_q_date", todayStr);
      localStorage.setItem("daily_landing_q_ans", index.toString());
      if (index === correctAnswer) {
        setStreakCount((prev) => {
          const updated = prev + 1;
          localStorage.setItem("daily_quiz_streak", updated.toString());
          return updated;
        });
      }
    } catch {}
  };

  // 4 primary categories matching user specification
  const categories = [
    {
      id: "kids",
      tierId: TIERS.KIDS,
      title: isHindi ? "बच्चे" : "Kids",
      subtitle: isHindi ? "आयु 5–12 वर्ष" : "Age 5–12 yrs",
      badge: "AGE 5–12",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800",
      iconBg: "bg-amber-500/10 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
      icon: Baby,
      accentBorder: "hover:border-amber-300",
      topics: isHindi
        ? ["गिनती और बुनियादी गणित", "पशु-पक्षी व प्रकृति", "कहानियां और नैतिक शिक्षा", "मज़ेदार पहेलियाँ"]
        : ["Counting & Basic Math", "Animals & Nature", "Stories & Moral Science", "Fun Riddles & Puzzles"],
      defaultRoute: "/kids",
    },
    {
      id: "students",
      tierId: TIERS.STUDENTS,
      title: isHindi ? "विद्यार्थी" : "Students",
      subtitle: isHindi ? "कक्षा 6–12" : "Class 6–12",
      badge: "CLASS 6–12",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
      icon: GraduationCap,
      accentBorder: "hover:border-emerald-300",
      topics: isHindi
        ? ["विज्ञान (Science)", "सामाजिक विज्ञान (Social)", "NCERT सिलेबस क्विज़", "बोर्ड परीक्षा तैयारी"]
        : ["Science (Physics, Chem, Bio)", "Social Science & History", "NCERT Syllabus Quizzes", "Board Exam Preparation"],
      defaultRoute: "/school-study",
      directRoute: "/school-study",
    },
    {
      id: "gk",
      tierId: TIERS.ADULTS,
      title: isHindi ? "सामान्य ज्ञान" : "General Knowledge",
      subtitle: isHindi ? "40+ विषय और क्विज़" : "40+ Topics & Quizzes",
      badge: "POPULAR",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800",
      iconBg: "bg-blue-500/10 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
      icon: Compass,
      accentBorder: "hover:border-blue-300",
      topics: isHindi
        ? ["भारत का इतिहास व भूगोल", "समसामयिकी (Current Affairs)", "राजनीति और संविधान", "विश्व का भूगोल व पुरस्कार"]
        : ["Indian History & Geography", "Current Affairs & News", "Polity & Constitution", "World Geography & Awards"],
      defaultRoute: "/quizzes",
      directRoute: "/quizzes",
    },
    {
      id: "gk_engine",
      tierId: TIERS.ARENA,
      title: isHindi ? "GK टेस्ट इंजन" : "GK Mock Engine",
      subtitle: isHindi ? "कस्टम टेस्ट अभ्यास" : "Custom Timed Mocks",
      badge: "NEW",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800",
      iconBg: "bg-purple-500/10 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
      icon: Zap,
      accentBorder: "hover:border-purple-300",
      topics: isHindi
        ? ["SSC / UPSC / रेलवे पैटर्न", "नेगेटिव मार्किंग मोड", "टाइमर आधारित टेस्ट", "विस्तृत प्रदर्शन रिपोर्ट"]
        : ["SSC / UPSC / Railway Pattern", "Negative Marking Mode", "Timer-Based Mock Tests", "Detailed Performance Reports"],
      defaultRoute: "/arena",
    },
    {
      id: "govt_exams",
      tierId: TIERS.ARENA,
      title: isHindi ? "सरकारी परीक्षाएं" : "Govt Exams",
      subtitle: isHindi ? "40+ परीक्षाएं व PYQs" : "40+ Exams & PYQs",
      badge: "40+ EXAMS",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800",
      iconBg: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400",
      icon: GraduationCap,
      accentBorder: "hover:border-indigo-300",
      directRoute: "/govt-exams",
    },
    {
      id: "current_affairs",
      tierId: TIERS.ADULTS,
      title: isHindi ? "दैनिक करेंट अफेयर्स" : "Current Affairs",
      subtitle: isHindi ? "आज के 10 समाचार व टेस्ट" : "Daily Top 10 & Quiz",
      badge: "DAILY",
      badgeColor: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-800",
      iconBg: "bg-sky-500/10 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400",
      icon: Newspaper,
      accentBorder: "hover:border-sky-300",
      directRoute: "/daily-current-affairs",
    },
    {
      id: "fun_facts",
      tierId: TIERS.ADULTS,
      title: isHindi ? "रोचक तथ्य" : "Fun Facts",
      subtitle: isHindi ? "1,000+ अद्भुत ज्ञान" : "1,000+ Mind Facts",
      badge: "TRIVIA",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800",
      iconBg: "bg-amber-500/10 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
      icon: Sparkles,
      accentBorder: "hover:border-amber-300",
      directRoute: "/fun-facts",
    },
    {
      id: "true_false",
      tierId: TIERS.ADULTS,
      title: isHindi ? "सही या गलत" : "True & False",
      subtitle: isHindi ? "60s रैपिड फायर गेम" : "60s Rapid Blitz",
      badge: "RAPID",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
      icon: Zap,
      accentBorder: "hover:border-emerald-300",
      directRoute: "/true-false",
    },
  ];

  const handleLaunchTopic = (cat, topic) => {
    setCategoryModal(null);
    setTier(cat.tierId);
    if (cat.id === "gk_engine") {
      router.push("/arena");
    } else if (cat.id === "kids") {
      router.push("/kids");
    } else if (cat.id === "students") {
      router.push("/school-study");
    } else if (cat.id === "gk") {
      router.push("/quizzes");
    } else {
      router.push(cat.defaultRoute || "/quizzes");
    }
  };

  const handleStartRandomTest = (cat) => {
    setCategoryModal(null);
    setTier(cat.tierId);
    if (cat.id === "gk_engine") {
      router.push("/arena");
    } else if (cat.id === "kids") {
      router.push("/kids");
    } else if (cat.id === "students") {
      router.push("/school-study");
    } else if (cat.id === "gk") {
      router.push("/quizzes");
    } else {
      router.push(cat.defaultRoute || "/quizzes");
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-white font-sans antialiased flex flex-col items-center selection:bg-indigo-500 selection:text-white px-3 sm:px-4 py-3 sm:py-6">
      
      {/* Central Content Column: max-w-[440px] on mobile to match exact target mockup, expanding gracefully on larger screens */}
      <div className="w-full max-w-[430px] md:max-w-4xl lg:max-w-5xl space-y-5 sm:space-y-6 pb-20">
        
        {/* ================= 1. REFINED HERO SECTION ================= */}
        <section className="text-center space-y-3 pt-1 sm:pt-3">
          {/* National Trust Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-[11px] font-semibold tracking-wide shadow-xs">
            <span className="text-sm">🇮🇳</span>
            <span>
              {isHindi
                ? "भारत का अपना मुफ़्त ज्ञान व क्विज़ मंच"
                : "India’s Free Knowledge & Quiz Platform"}
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-[25px] sm:text-[30px] md:text-[36px] font-black tracking-tight text-slate-900 dark:text-white leading-[1.25] px-1">
            {isHindi ? (
              <>
                सपनों को दें ज्ञान की उड़ान, <br />
                <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 bg-clip-text text-transparent">
                  हर दिन कुछ नया सीखें
                </span>
              </>
            ) : (
              <>
                Empower Your Dreams, <br />
                <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 bg-clip-text text-transparent">
                  Learn Something New Daily
                </span>
              </>
            )}
          </h1>

          {/* Clean Subtext */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-[360px] sm:max-w-md mx-auto">
            {isHindi
              ? "गाँव हो या शहर, स्कूल हो या सरकारी परीक्षा — रोज़ सिर्फ 10 मिनट अभ्यास आपको सफलता के करीब ले जाएगा।"
              : "From schools to competitive exams—just 10 minutes of daily quiz practice builds lasting confidence."}
          </p>

          {/* Consolidated Single Stats Strip */}
          <div className="inline-flex items-center justify-center gap-3 px-3.5 py-1.5 rounded-full bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />{" "}
              {totalQuestions > 0 ? `${totalQuestions.toLocaleString()}+` : "3,885+"}{" "}
              {isHindi ? "प्रश्न" : "Questions"}
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="flex items-center gap-1">
              <Sparkle className="w-3.5 h-3.5 text-amber-500" />{" "}
              {totalCategories}+ {isHindi ? "विषय" : "Categories"}
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100/80 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
              {isHindi ? "100% मुफ़्त" : "100% Free"}
            </span>
          </div>
        </section>

        {/* ================= 2. FEATURED 1v1 LIVE BATTLE CARD ================= */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 sm:p-5 text-white shadow-xl shadow-slate-950/20 border border-indigo-500/20 w-full">
          {/* Subtle background ambient glows */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-violet-600/20 rounded-full blur-2xl pointer-events-none" />

          {/* Card Header Row */}
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center border border-indigo-400/30 shadow-inner">
                <Swords className="w-5 h-5 text-yellow-300 animate-bounce" style={{ animationDuration: "3s" }} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                    LIVE DUEL
                  </span>
                </div>
                <h3 className="text-base font-bold tracking-tight text-white">
                  {isHindi ? "1v1 लाइव मुकाबला" : "1v1 Live Quiz Battle"}
                </h3>
              </div>
            </div>
            <span className="text-[10px] font-medium text-slate-300 bg-white/10 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-xs">
              ⚡ 1.2k {isHindi ? "ऑनलाइन" : "Online"}
            </span>
          </div>

          {/* Card Description */}
          <p className="text-xs text-slate-300 mb-4 leading-relaxed relative z-10">
            {isHindi
              ? "दोस्तों को रूम कोड भेजें, रीयल-टाइम में क्विज़ भिड़ंत करें और जानें कौन है असली GK चैंपियन!"
              : "Invite your friends via room code, battle in real-time GK quizzes, and claim the championship!"}
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 relative z-10">
            <button
              onClick={generateRoom}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 active:scale-95 transition-all"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>{isHindi ? "लाइव रूम बनाएं" : "Create Room"}</span>
            </button>

            <button
              onClick={() => setJoinRoomOpen(true)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold backdrop-blur-md active:scale-95 transition-all"
            >
              <Rocket className="w-3.5 h-3.5 text-amber-300" />
              <span>{isHindi ? "कोड से जुड़ें" : "Join Code"}</span>
            </button>
          </div>
        </section>

        {/* ================= 3. AGE, CATEGORY & MASTER FEATURES EXPLORATION GRID ================= */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <span>{isHindi ? "श्रेणियाँ व प्रमुख फीचर्स" : "Categories & Master Hubs"}</span>
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                ({isHindi ? "Choose Learning Hub" : "श्रेणियाँ चुनें"})
              </span>
            </h2>
            <Link
              href="/quizzes"
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer hover:underline"
            >
              {isHindi ? "सभी देखें →" : "View All →"}
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((cat) => {
              const IconComponent = cat.icon;
              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    if (cat.directRoute) {
                      router.push(cat.directRoute);
                    } else {
                      setCategoryModal(cat);
                    }
                  }}
                  className={`bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group active:scale-[0.98] ${cat.accentBorder}`}
                >
                  {/* Top Row: Icon and Badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${cat.iconBg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className={`text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded-full border ${cat.badgeColor}`}>
                      {cat.badge}
                    </span>
                  </div>

                  {/* Content Details */}
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {cat.subtitle}
                    </p>
                  </div>

                  {/* Card Footer micro-action */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-medium text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    <span>{isHindi ? "अभ्यास शुरू करें" : "Start Quiz"}</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= 4. INTERACTIVE "QUESTION OF THE DAY" WIDGET ================= */}
        <section className="bg-gradient-to-b from-indigo-50/70 to-white dark:from-slate-900 dark:to-slate-900/60 rounded-2xl p-4 border border-indigo-100 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-950/70 px-2.5 py-0.5 rounded-full">
              <Clock className="w-3 h-3" /> {isHindi ? "आज का सवाल (Daily Quiz)" : "Question of the Day"}
            </span>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
              +10 XP
            </span>
          </div>

          <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
            {isHindi
              ? "चंद्रमा पर कदम रखने वाले प्रथम व्यक्ति कौन थे?"
              : "Who was the first person to walk on the lunar surface of the Moon?"}
          </p>

          {/* Answer Options */}
          <div className="grid grid-cols-1 gap-2 pt-1">
            {[
              { id: 0, text: isHindi ? "यूरी गागरिन (Yuri Gagarin)" : "Yuri Gagarin" },
              { id: 1, text: isHindi ? "राकेश शर्मा (Rakesh Sharma)" : "Rakesh Sharma" },
              { id: 2, text: isHindi ? "नील आर्मस्ट्रांग (Neil Armstrong)" : "Neil Armstrong" },
              { id: 3, text: isHindi ? "बज़ एल्ड्रिन (Buzz Aldrin)" : "Buzz Aldrin" },
            ].map((opt) => {
              const isSelected = selectedAnswer === opt.id;
              const isCorrect = opt.id === correctAnswer;

              let btnStyle = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-300";
              if (answered) {
                if (isCorrect) {
                  btnStyle = "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200 font-bold";
                } else if (isSelected && !isCorrect) {
                  btnStyle = "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200";
                } else {
                  btnStyle = "bg-white dark:bg-slate-850 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-60";
                }
              }

              return (
                <button
                  key={opt.id}
                  disabled={answered}
                  onClick={() => handleAnswerClick(opt.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${btnStyle}`}
                >
                  <span>{opt.text}</span>
                  {answered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
                  {answered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Feedback & Explanation */}
          {answered && (
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 animate-in fade-in duration-200">
              {selectedAnswer === correctAnswer ? (
                <p className="text-emerald-700 dark:text-emerald-300 font-bold">
                  {isHindi
                    ? "🎉 सही उत्तर! नील आर्मस्ट्रांग ने 20 जुलाई 1969 को अपोलो 11 मिशन के तहत चाँद पर पहला कदम रखा था। (+10 XP प्राप्त)"
                    : "🎉 Correct! Neil Armstrong stepped onto the lunar surface on July 20, 1969 during Apollo 11. (+10 XP awarded)"}
                </p>
              ) : (
                <p className="text-rose-600 dark:text-rose-400 font-medium">
                  {isHindi
                    ? "गलत उत्तर! सही विकल्प नील आर्मस्ट्रांग है। यूरी गागरिन अंतरिक्ष जाने वाले पहले मानव थे।"
                    : "Incorrect! The correct answer is Neil Armstrong. Yuri Gagarin was the first human in space."}
                </p>
              )}
            </div>
          )}
        </section>

        {/* ================= 5. COMMUNITY & SUPPORT BANNER ================= */}
        <section className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-white">
                {isHindi ? "दिल से भारतीय, सबके लिए मुफ़्त" : "Proudly Indian, 100% Free"}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {isHindi
                  ? "शिक्षा को देश के हर कोने तक पहुँचाने में मदद करें"
                  : "Help bring quality free education to every student in India"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSupportOpen(true)}
            className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold shadow-xs active:scale-95 transition whitespace-nowrap ml-2"
          >
            {isHindi ? "सहयोग करें" : "Support Us"}
          </button>
        </section>

        {/* ================= 6. DAILY MOTIVATIONAL QUOTE STRIP ================= */}
        <div className="text-center py-1 px-3">
          <p className="text-[11px] italic text-slate-500 dark:text-slate-400">
            {isHindi
              ? '✨ "यहाँ हर सवाल सिर्फ एक प्रश्न नहीं, आपके सपनों को सच करने की एक मज़बूत सीढ़ी है!"'
              : '✨ "Every question here is not just a query, but a solid stepping stone to fulfilling your dreams!"'}
          </p>
        </div>

        {/* ================= 7. ECOSYSTEM SHOWCASE (Main Hubs & Digital Books) ================= */}
        <div className="w-full pt-4 space-y-6">
          <MainHubsShowcase isHindi={isHindi} />

          {/* India GK Digital Book Banner */}
          <section className="w-full mt-2 mb-4">
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white border-2 border-indigo-500/40 shadow-xl shadow-indigo-950/40">
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-amber-300 text-[11px] font-black uppercase tracking-wider mb-2">
                    <span>📖 {isHindi ? "डिजिटल बुक प्लेटफ़ॉर्म" : "Digital Book Hub"}</span>
                    <span>·</span>
                    <span className="text-emerald-400 font-extrabold">{isHindi ? "नया फ़ीचर" : "NEW"}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mb-1.5">
                    {isHindi ? "India GK: आपकी हर जरूरत के लिए डिजिटल बुक" : "India GK: Digital Book Platform"}
                  </h3>
                  <p className="text-xs text-indigo-200/90 leading-relaxed mb-3 max-w-lg">
                    {isHindi
                      ? "अध्याय दर अध्याय संरचित अध्ययन, संक्षिप्त व विस्तृत पठन, और पृष्ठ के अंत में अभ्यास क्विज़।"
                      : "Structured chapter-by-chapter reading with interactive quiz cards on every page."}
                  </p>
                  <Link
                    href="/gk-book/sindhu-ghati"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 active:scale-95 transition-all"
                  >
                    <span>{isHindi ? "किताब पढ़ना शुरू करें" : "Read Digital Book"}</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="w-28 sm:w-36 shrink-0 rounded-xl overflow-hidden shadow-xl border border-indigo-400/30">
                  <img
                    src="/images/gk-book/india-gk-cover.jpg"
                    alt="India GK Book"
                    className="w-full h-auto object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

      </div>

      {/* ================= MODAL 1: 1v1 CREATE ROOM ================= */}
      {createRoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Swords className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white">
                  {isHindi ? "लाइव बैटल रूम तैयार है" : "Live Battle Room Ready"}
                </h3>
              </div>
              <button
                onClick={() => setCreateRoomOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center py-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-wider">
                {isHindi ? "आपका रूम कोड" : "Your Room Code"}
              </span>
              <p className="text-3xl font-black text-indigo-700 dark:text-indigo-400 tracking-widest my-1">
                {roomCode}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isHindi ? "यह कोड अपने दोस्त को भेजें" : "Share this code with your friend"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={copyCode}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? (isHindi ? "कॉपी हो गया" : "Copied!") : (isHindi ? "कोड कॉपी करें" : "Copy Code")}</span>
              </button>
              <button
                onClick={shareRoomWhatsApp}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
              >
                <Share2 className="w-4 h-4" />
                <span>{isHindi ? "व्हाट्सऐप शेयर" : "Share Code"}</span>
              </button>
            </div>

            <button
              onClick={handleStartHostGame}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              {isHindi ? "मैच शुरू करें (Start Game)" : "Start Match Now"}
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: 1v1 JOIN ROOM ================= */}
      {joinRoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Rocket className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white">
                  {isHindi ? "कोड से रूम जॉइन करें" : "Join Duel with Code"}
                </h3>
              </div>
              <button
                onClick={() => setJoinRoomOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {isHindi ? "6 अंकों का रूम कोड दर्ज करें" : "Enter 6-digit room code"}
              </label>
              <input
                type="text"
                placeholder={isHindi ? "उदा. 482910" : "e.g. 482910"}
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.slice(0, 6))}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center text-xl font-bold tracking-widest text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              disabled={joinCodeInput.trim().length < 4}
              onClick={handleJoinGame}
              className="w-full py-3 rounded-xl bg-indigo-600 disabled:opacity-50 hover:bg-indigo-700 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
            >
              {isHindi ? "रूम से जुड़ें (Join Duel)" : "Join Duel"}
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: CATEGORY TOPICS QUICK LAUNCH ================= */}
      {categoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${categoryModal.badgeColor}`}>
                  {categoryModal.badge}
                </span>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mt-1">
                  {categoryModal.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{categoryModal.subtitle}</p>
              </div>
              <button
                onClick={() => setCategoryModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isHindi ? "प्रमुख विषय चुनें:" : "Choose a Topic:"}
              </p>
              {categoryModal.topics.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLaunchTopic(categoryModal, t)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-700 text-left text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center justify-between transition group"
                >
                  <span>{t}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition" />
                </button>
              ))}
            </div>

            <button
              onClick={() => handleStartRandomTest(categoryModal)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold active:scale-95 transition-all"
            >
              {isHindi ? "रैंडम टेस्ट शुरू करें" : "Start Random Practice Test"}
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: SUPPORT / DONATION ================= */}
      {supportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl text-center border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/70 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Heart className="w-6 h-6 fill-rose-500 text-rose-500" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {isHindi ? "QuizWeb का समर्थन करें" : "Support QuizWeb"}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {isHindi
                ? "QuizWeb भारत के हर छात्र के लिए हमेशा 100% नि:शुल्क रहेगा। यदि आपको हमारी यह पहल पसंद आई, तो इसे अपने सहपाठियों व परिवार के साथ ज़रूर शेयर करें!"
                : "QuizWeb will always remain 100% free for students across India. If you appreciate our initiative, please share it with your friends and family!"}
            </p>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 font-medium">
              {isHindi
                ? "🤝 हर महीने 50,000+ छात्र बिना किसी विज्ञापन व फीस के सीख रहे हैं।"
                : "🤝 Over 50,000+ students learn each month with zero ads and zero fees."}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSupportOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {isHindi ? "बंद करें" : "Close"}
              </button>
              <button
                onClick={() => {
                  setSupportOpen(false);
                  const shareText = isHindi
                    ? "भारत का अपना निःशुल्क ज्ञान व क्विज़ मंच - QuizWeb पर अभ्यास करें: https://quizweb.in"
                    : "Practice on India's free knowledge and quiz platform QuizWeb: https://quizweb.in";
                  if (navigator?.share) {
                    navigator.share({ title: "QuizWeb", text: shareText, url: "https://quizweb.in" }).catch(() => {});
                  } else {
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, "_blank");
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold"
              >
                {isHindi ? "शेयर करें" : "Share"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
