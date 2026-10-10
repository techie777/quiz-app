"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import styles from "@/styles/MockEngine.module.css";
import {
  Clock,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Bookmark,
  AlertTriangle,
  Grid,
  X,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

// STATUS TYPES (Authentic TCS Pattern)
const STATUS = {
  NOT_VISITED: "NOT_VISITED",
  NOT_ANSWERED: "NOT_ANSWERED",
  ANSWERED: "ANSWERED",
  MARKED: "MARKED",
  MARKED_ANSWERED: "MARKED_ANSWERED",
};

const getStatusStyle = (status, styleObj) => {
  const map = {
    [STATUS.NOT_VISITED]: styleObj.notVisited,
    [STATUS.NOT_ANSWERED]: styleObj.notAnswered,
    [STATUS.ANSWERED]: styleObj.answered,
    [STATUS.MARKED]: styleObj.marked,
    [STATUS.MARKED_ANSWERED]: styleObj.markedAnswered,
  };
  return map[status] || styleObj.notVisited;
};

export default function MockTestEngine() {
  const { paperId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // ── CORE DATA STATE ──
  const [paper, setPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── ENTRANCE GUARD (Strict Mock Protocol) ──
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/api/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`);
    }
  }, [status, router]);

  // ── TEST PROGRESS STATE ──
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { qId: { option, status } }
  const [timeLeft, setTimeLeft] = useState(3600); // Default 60 mins
  const [activeSection, setActiveSection] = useState(null);
  const [language, setLanguage] = useState(searchParams.get("lang") || "English");
  const [isPaused, setIsPaused] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fontSize, setFontSize] = useState("normal"); // "small" | "normal" | "large"
  const warned5MinRef = useRef(false);

  // ── REFS ──
  const timerRef = useRef(null);
  const containerRef = useRef(null);

  const isHindi = language === "Hindi";

  // ── INITIAL HYDRATION ──
  useEffect(() => {
    async function init() {
      if (status === "loading" || status === "unauthenticated") return;
      try {
        const [paperRes, qRes] = await Promise.all([
          fetch(`/api/mock-tests/paper/${paperId}`),
          fetch(`/api/mock-tests/paper/${paperId}/questions`),
        ]);

        const paperData = await paperRes.json();
        const qData = await qRes.json();

        if (paperData.error || qData.error) throw new Error("Initialization failed");

        setPaper(paperData);
        setQuestions(qData);
        setActiveSection(paperData.sections[0]?.id);

        // Initial State Check (Strict separation of Fresh vs Resume)
        const mode = searchParams.get("mode");
        let initialAnswers = {};
        let initialTime = paperData.timeLimit * 60;
        let initialIndex = 0;

        if (mode === "resume") {
          const saved = localStorage.getItem(`mock_state_${paperId}`);
          if (saved) {
            const { sa, st, si } = JSON.parse(saved);
            initialAnswers = sa || {};
            initialTime = st || paperData.timeLimit * 60;
            initialIndex = si || 0;
          }

          if (session?.user) {
            try {
              const res = await fetch(`/api/mock-tests/attempt/resume/${paperId}`);
              if (res.ok) {
                const dbAttempt = await res.json();
                if (dbAttempt && dbAttempt.id) {
                  if (dbAttempt.answersJson) initialAnswers = JSON.parse(dbAttempt.answersJson);
                  if (dbAttempt.timeLeft) initialTime = dbAttempt.timeLeft;
                }
              }
            } catch (e) {
              console.error("DB Resumption sync failed:", e);
            }
          }
        } else {
          localStorage.removeItem(`mock_state_${paperId}`);
        }

        setAnswers(initialAnswers);
        setTimeLeft(initialTime);
        setCurrentIndex(initialIndex);
      } catch (e) {
        toast.error("Critical: Failed to load exam protocol.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [paperId, status, session, searchParams]);

  // ── TIMER LOGIC ──
  useEffect(() => {
    if (loading || isPaused) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }

        // 5-Minute Warning Toast
        if (prev === 300 && !warned5MinRef.current) {
          warned5MinRef.current = true;
          toast("⚠️ Only 5 minutes remaining! Please review your answers.", {
            icon: "⏳",
            duration: 6000,
          });
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, isPaused]);

  // ── AUTO-SYNC LOGIC (LocalStorage every 5s, DB every 30s) ──
  useEffect(() => {
    if (loading) return;

    const localSave = setInterval(() => {
      localStorage.setItem(
        `mock_state_${paperId}`,
        JSON.stringify({
          sa: answers,
          st: timeLeft,
          si: currentIndex,
        })
      );
    }, 5000);

    let dbSave;
    if (session?.user) {
      dbSave = setInterval(async () => {
        try {
          await fetch(`/api/mock-tests/attempt/resume/${paperId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              answersJson: JSON.stringify(answers),
              timeLeft,
            }),
          });
        } catch (e) {
          console.warn("[SYNC] DB sync failed", e);
        }
      }, 30000);
    }

    return () => {
      clearInterval(localSave);
      if (dbSave) clearInterval(dbSave);
    };
  }, [loading, answers, timeLeft, currentIndex, paperId, session]);

  // ── VIEW TRIGGER: Mark NOT_VISITED as NOT_ANSWERED upon viewing ──
  useEffect(() => {
    if (loading || !currentQuestion) return;

    if (getStatus(currentQuestion.id) === STATUS.NOT_VISITED) {
      updateAnswer(currentQuestion.id, undefined, STATUS.NOT_ANSWERED);
    }
  }, [currentIndex, loading]);

  // ── PROCTORING (ANTI-CHEAT) ──
  useEffect(() => {
    const handleBlur = () => {
      if (!loading) toast.error("WARNING: Tab switching detected. This activity is logged.", { duration: 5000 });
    };

    const handleFullScreenChange = () => {
      if (!document.fullscreenElement && !loading) {
        toast("Exam must be taken in Full Screen.", { icon: "⚠️" });
      }
    };

    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullScreenChange);

    const disableCtx = (e) => e.preventDefault();
    document.addEventListener("contextmenu", disableCtx);

    return () => {
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener("contextmenu", disableCtx);
    };
  }, [loading]);

  // ── NAVIGATION HELPERS ──
  const currentQuestion = questions[currentIndex];

  const getStatus = (qId) => answers[qId]?.status || STATUS.NOT_VISITED;

  const updateAnswer = (qId, option, status) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: { option, status },
    }));
  };

  const handleSaveAndNext = () => {
    const selected = answers[currentQuestion.id]?.option;
    if (selected !== undefined) {
      updateAnswer(currentQuestion.id, selected, STATUS.ANSWERED);
    } else {
      updateAnswer(currentQuestion.id, undefined, STATUS.NOT_ANSWERED);
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleMarkForReview = () => {
    const selected = answers[currentQuestion.id]?.option;
    const newStatus = selected !== undefined ? STATUS.MARKED_ANSWERED : STATUS.MARKED;
    updateAnswer(currentQuestion.id, selected, newStatus);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleClearResponse = () => {
    updateAnswer(currentQuestion.id, undefined, STATUS.NOT_ANSWERED);
  };

  const handleSubmitFinal = async () => {
    if (isSubmitting) return;

    if (!session?.user) {
      toast.error("Session expired. Please sign in again.");
      router.push("/api/auth/signin");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading(isHindi ? "उत्तर सहेजे जा रहे हैं..." : "Saving Final Responses...");

    try {
      const payload = {
        paperId,
        answersJson: JSON.stringify(answers),
        timeLeft,
      };

      const res = await fetch("/api/mock-tests/attempt/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success(isHindi ? "परीक्षा समाप्त! परिणाम लोड हो रहा है..." : "Examination Complete!", { id: loadingToast });
      localStorage.removeItem(`mock_state_${paperId}`);

      window.location.href = `/mock-tests/result/${data.id}`;
    } catch (err) {
      console.error("Submission Failure:", err);
      toast.error(`Submission Failed: ${err.message}`, { id: loadingToast });
      setIsSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    toast.success("TIME EXPIRED: Processing submission...");
    handleSubmitFinal();
  };

  const getSectionSummary = () => {
    if (!paper || !questions) return [];

    return paper.sections.map((section) => {
      const sectionQs = questions.filter((q) => q.sectionId === section.id);
      const stats = {
        total: sectionQs.length,
        answered: 0,
        notAnswered: 0,
        marked: 0,
        notVisited: 0,
      };

      sectionQs.forEach((q) => {
        const s = getStatus(q.id);
        if (s === STATUS.ANSWERED || s === STATUS.MARKED_ANSWERED) stats.answered++;
        if (s === STATUS.MARKED || s === STATUS.MARKED_ANSWERED) stats.marked++;
        if (s === STATUS.NOT_ANSWERED) stats.notAnswered++;
        if (s === STATUS.NOT_VISITED) stats.notVisited++;
      });

      return { id: section.id, name: section.name, ...stats };
    });
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center font-black uppercase text-xs tracking-widest text-slate-400">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span>{isHindi ? "परीक्षा इंजन लोड हो रहा है..." : "Loading Tactical Engine..."}</span>
        </div>
      </div>
    );
  }

  const answeredCount = questions.filter(
    (q) => getStatus(q.id) === STATUS.ANSWERED || getStatus(q.id) === STATUS.MARKED_ANSWERED
  ).length;

  return (
    <div className={styles.mockWrapper} ref={containerRef}>
      {/* 🏛️ HEADER */}
      <header className={styles.header}>
        {/* Left: Branding & Paper Title */}
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <span className="text-base md:text-lg font-black text-indigo-600 tracking-tighter shrink-0">
            QuizWeb!
          </span>
          <div className="hidden sm:block h-5 w-px bg-slate-200" />
          <span className="text-[11px] md:text-[13px] font-bold text-slate-700 uppercase truncate">
            {paper.title}
          </span>
        </div>

        {/* Right: Timer, Font Zoom, Fullscreen, Pause & Mobile Palette Trigger */}
        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          {/* Mobile Question Palette Trigger Button */}
          <button
            type="button"
            onClick={() => setIsPaletteOpen(true)}
            className={styles.paletteTriggerBtn}
            title={isHindi ? "प्रश्न पैलेट खोलें" : "Open Question Palette"}
          >
            <Grid size={14} />
            <span>
              {currentIndex + 1}/{questions.length}
            </span>
          </button>

          {/* Font Zoom Controls */}
          <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setFontSize("small")}
              className={`px-1.5 py-0.5 text-[10px] font-black rounded ${
                fontSize === "small" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-500"
              }`}
              title="Small Text"
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setFontSize("normal")}
              className={`px-1.5 py-0.5 text-[10px] font-black rounded ${
                fontSize === "normal" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-500"
              }`}
              title="Normal Text"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize("large")}
              className={`px-1.5 py-0.5 text-[10px] font-black rounded ${
                fontSize === "large" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-500"
              }`}
              title="Large Text"
            >
              A+
            </button>
          </div>

          {/* Countdown Timer */}
          <div
            className={`px-2 md:px-3 py-1 rounded-lg border flex items-center gap-1.5 ${
              timeLeft < 300
                ? "bg-red-50 border-red-300 text-red-600 animate-pulse"
                : "bg-slate-50 border-slate-200 text-slate-800"
            }`}
          >
            <Clock size={14} className={timeLeft < 300 ? "text-red-500" : "text-slate-500"} />
            <span className="text-xs md:text-sm font-black font-mono tracking-tight">
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
            className="hidden md:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
            title="Toggle Fullscreen"
          >
            <Maximize2 size={16} />
          </button>

          {/* Pause Button */}
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 transition-all shadow-2xs"
          >
            {isPaused ? <Play size={12} /> : <Pause size={12} />}
            <span className="hidden sm:inline">{isPaused ? (isHindi ? "जारी रखें" : "RESUME") : (isHindi ? "रोकें" : "PAUSE")}</span>
          </button>
        </div>
      </header>

      {/* 🕹️ MAIN LAYOUT */}
      <div className={styles.mainLayout}>
        {/* LEFT: QUESTIONS & ACTIONS */}
        <div className={styles.leftPane}>
          {/* Section Tabs */}
          <div className={styles.sectionTabs}>
            <span className="text-[10px] font-black text-slate-400 uppercase mr-2">
              {isHindi ? "खंड / Sections:" : "Sections:"}
            </span>
            {paper.sections.map((s) => {
              const secQs = questions.filter((q) => q.sectionId === s.id);
              const secAnswered = secQs.filter(
                (q) => getStatus(q.id) === STATUS.ANSWERED || getStatus(q.id) === STATUS.MARKED_ANSWERED
              ).length;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    const firstQOfSection = questions.findIndex((q) => q.sectionId === s.id);
                    if (firstQOfSection !== -1) setCurrentIndex(firstQOfSection);
                    setActiveSection(s.id);
                  }}
                  className={`${styles.sectionTab} ${activeSection === s.id ? styles.sectionTabActive : ""}`}
                >
                  <span>{s.name}</span>
                  <span className={styles.sectionProgressBadge}>
                    {secAnswered}/{secQs.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Question Header (Number, Marks & Language Switcher) */}
          <div className={styles.questionHeader}>
            <span className="text-xs sm:text-sm font-black text-slate-900 uppercase">
              {isHindi ? `प्रश्न सं. ${currentIndex + 1}` : `Question No. ${currentIndex + 1}`}
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded">
                  +{paper.positiveMarking}
                </span>
                <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black rounded">
                  -{paper.negativeMarking}
                </span>
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <select
                className="bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5 text-[11px] font-bold text-slate-700 focus:ring-0 outline-none cursor-pointer"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="English">English</option>
                <option value="Hindi">हिन्दी (Hindi)</option>
              </select>
            </div>
          </div>

          {/* Question Body */}
          <div
            className={`${styles.questionBody} ${
              fontSize === "small"
                ? styles.fontSizeSmall
                : fontSize === "large"
                ? styles.fontSizeLarge
                : styles.fontSizeNormal
            }`}
          >
            <p className="font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">
              {language === "Hindi" && currentQuestion?.textHi
                ? currentQuestion.textHi
                : currentQuestion?.text}
            </p>

            {currentQuestion?.image && (
              <img
                src={currentQuestion.image}
                className="max-w-full h-auto rounded-xl border border-slate-200 my-4 shadow-sm"
                alt="Question Graphic"
              />
            )}

            {/* Options List */}
            <div className={styles.optionsList}>
              {(language === "Hindi" && currentQuestion?.optionsHi
                ? currentQuestion.optionsHi
                : currentQuestion?.options || []
              ).map((opt, i) => (
                <div
                  key={i}
                  className={`${styles.optionItem} ${
                    answers[currentQuestion?.id]?.option === i ? styles.optionItemActive : ""
                  }`}
                  onClick={() =>
                    updateAnswer(
                      currentQuestion?.id,
                      i,
                      getStatus(currentQuestion?.id) === STATUS.NOT_VISITED
                        ? STATUS.NOT_ANSWERED
                        : getStatus(currentQuestion?.id)
                    )
                  }
                >
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                      answers[currentQuestion?.id]?.option === i
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "border-slate-300 text-slate-500"
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className="text-sm sm:text-base font-medium text-slate-800">{opt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PINNED FIXED FOOTER ACTION BAR */}
          <div className={styles.footer}>
            <div className="flex gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleMarkForReview}
                className={`${styles.actionBtn} ${styles.btnSecondary}`}
              >
                <span>{isHindi ? "समीक्षा व अगला" : "Mark for Review & Next"}</span>
              </button>
              <button
                type="button"
                onClick={handleClearResponse}
                className={`${styles.actionBtn} ${styles.btnSecondary}`}
              >
                <span>{isHindi ? "साफ़ करें" : "Clear Response"}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={handleSaveAndNext}
              className={`${styles.actionBtn} ${styles.btnPrimary}`}
            >
              <span>{isHindi ? "सहेजें और अगला →" : "Save & Next →"}</span>
            </button>
          </div>
        </div>

        {/* MOBILE PALETTE BACKDROP */}
        {isPaletteOpen && (
          <div
            className={styles.paletteBackdrop}
            onClick={() => setIsPaletteOpen(false)}
          />
        )}

        {/* RIGHT: QUESTION PALETTE DRAWER */}
        <div className={`${styles.rightPane} ${isPaletteOpen ? styles.rightPaneOpen : ""}`}>
          <div className={styles.paletteScrollArea}>
            {/* Palette Header with Candidate Info & Close for Mobile */}
            <div className={styles.paletteHeader}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-lg shrink-0">
                  👤
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-800 truncate uppercase">
                    {session?.user?.name || "CANDIDATE"}
                  </p>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                    {paper.timeLimit} Min Limit
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPaletteOpen(false)}
                className="lg:hidden ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* TCS Authentic Color-Coded Legend */}
            <div className={styles.statsSummary}>
              <div className="grid grid-cols-2 gap-y-2">
                <div className={styles.statRow}>
                  <div className={`${styles.statBubble} ${styles.answered}`}>
                    {questions.filter((q) => getStatus(q.id) === STATUS.ANSWERED).length}
                  </div>
                  <span className="text-slate-600 truncate">{isHindi ? "उत्तर दिया" : "Answered"}</span>
                </div>
                <div className={styles.statRow}>
                  <div className={`${styles.statBubble} ${styles.notAnswered}`}>
                    {questions.filter((q) => getStatus(q.id) === STATUS.NOT_ANSWERED).length}
                  </div>
                  <span className="text-slate-600 truncate">{isHindi ? "उत्तर नहीं दिया" : "Not Answered"}</span>
                </div>
                <div className={styles.statRow}>
                  <div className={`${styles.statBubble} ${styles.notVisited}`}>
                    {questions.filter((q) => getStatus(q.id) === STATUS.NOT_VISITED).length}
                  </div>
                  <span className="text-slate-600 truncate">{isHindi ? "देखा नहीं" : "Not Visited"}</span>
                </div>
                <div className={styles.statRow}>
                  <div className={`${styles.statBubble} ${styles.marked}`}>
                    {questions.filter((q) => getStatus(q.id) === STATUS.MARKED).length}
                  </div>
                  <span className="text-slate-600 truncate">{isHindi ? "मार्क किया" : "Marked"}</span>
                </div>
                <div className={styles.statRow} style={{ gridColumn: "span 2" }}>
                  <div className={`${styles.statBubble} ${styles.markedAnswered}`}>
                    {questions.filter((q) => getStatus(q.id) === STATUS.MARKED_ANSWERED).length}
                  </div>
                  <span className="text-slate-600 truncate">
                    {isHindi ? "उत्तर दिया व समीक्षा हेतु मार्क" : "Answered & Marked for Review"}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-4 py-2 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-between">
              <span>{isHindi ? "प्रश्न पैलेट" : "Question Palette"}</span>
              <span className="text-slate-400 font-mono">
                {answeredCount}/{questions.length}
              </span>
            </div>

            {/* Question Numbers Grid */}
            <div className={styles.paletteGrid}>
              {questions.map((q, i) => {
                const s = getStatus(q.id);
                return (
                  <div
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(i);
                      setIsPaletteOpen(false); // Auto-close on mobile
                    }}
                    className={`${styles.paletteItem} ${getStatusStyle(s, styles)} ${
                      currentIndex === i ? styles.currentQuestion : ""
                    }`}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Test Trigger Button */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setShowSummary(true)}
              className={`${styles.actionBtn} ${styles.btnSubmit} w-full py-3 h-auto rounded-xl text-xs font-black shadow-md`}
            >
              {isHindi ? "टेस्ट सबमिट करें (SUBMIT TEST)" : "SUBMIT TEST"}
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY & SUBMISSION MODAL (CLEAN IN-APP FLOW, NO BROWSER ALERTS) */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
            onClick={() => setShowSummary(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={styles.summaryModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <span>📊</span>
                  <span>{isHindi ? "परीक्षा सारांश (Test Summary)" : "Test Performance Summary"}</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setShowSummary(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-x-auto flex-1">
                <table className={styles.summaryTable}>
                  <thead>
                    <tr>
                      <th>{isHindi ? "खंड का नाम" : "Section Name"}</th>
                      <th>{isHindi ? "कुल प्रश्न" : "Total Qs"}</th>
                      <th>{isHindi ? "उत्तर दिया" : "Answered"}</th>
                      <th>{isHindi ? "उत्तर नहीं दिया" : "Not Answered"}</th>
                      <th>{isHindi ? "समीक्षा हेतु मार्क" : "Marked"}</th>
                      <th>{isHindi ? "देखा नहीं" : "Not Visited"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSectionSummary().map((row) => (
                      <tr key={row.id}>
                        <td className="text-left font-bold">{row.name}</td>
                        <td>{row.total}</td>
                        <td className="text-emerald-600 font-black">{row.answered}</td>
                        <td className="text-rose-600 font-bold">{row.notAnswered}</td>
                        <td className="text-purple-600 font-bold">{row.marked}</td>
                        <td className="text-slate-500 font-bold">{row.notVisited}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Final Submission Confirmation Callout */}
                <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black text-amber-900 uppercase">
                      {isHindi ? "अंतिम सबमिशन पुष्टि" : "Final Submission Confirmation"}
                    </h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      {isHindi
                        ? "एक बार सबमिट करने के बाद आप अपने उत्तर बदल नहीं सकेंगे। आपका स्कोरकार्ड तुरंत तैयार कर दिया जाएगा।"
                        : "Once submitted, you cannot change your answers. Your detailed scorecard and question solutions will be generated immediately."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSummary(false)}
                  className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors"
                >
                  {isHindi ? "← परीक्षा पर वापस जाएं" : "← Return to Exam"}
                </button>
                <button
                  type="button"
                  onClick={handleSubmitFinal}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{isHindi ? "सबमिट हो रहा है..." : "Submitting..."}</span>
                    </>
                  ) : (
                    <>
                      <span>{isHindi ? "हाँ, अंतिम सबमिट करें" : "Confirm & View Scorecard"}</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAUSE OVERLAY */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
          >
            <span className="text-5xl mb-4">⏸️</span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-widest mb-2">
              {isHindi ? "परीक्षा अस्थायी रूप से रोकी गई" : "Exam Suspended (Paused)"}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mb-6 max-w-md">
              {isHindi
                ? "आपकी प्रगति सुरक्षित रूप से सहेजी गई है। टाइमर को पुनः चालू करने के लिए नीचे क्लिक करें।"
                : "Your progress is safely cached. Click resume below to restore the exam timer."}
            </p>
            <button
              type="button"
              onClick={() => setIsPaused(false)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center gap-2"
            >
              <Play size={14} />
              <span>{isHindi ? "परीक्षा जारी रखें" : "Resume Examination"}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
