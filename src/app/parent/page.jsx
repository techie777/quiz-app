"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useTier, TIERS } from "@/context/TierContext";
import styles from "@/styles/ParentZone.module.css";
import {
  ShieldCheck,
  Lock,
  Unlock,
  Clock,
  BookOpen,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
  RotateCcw,
  Share2,
  Printer,
  Award,
  AlertCircle,
  Star,
  Flame,
  Trophy,
  Sliders,
  Settings,
  CheckCircle2,
  Volume2,
  KeyRound,
  Delete,
} from "lucide-react";

const DEFAULT_PIN = "1234";

const DEFAULT_SETTINGS = {
  screenTimeLimit: "30", // 15, 30, 45, 60, unlimited
  quizLimit: "10", // 5, 10, 15, 20, unlimited
  untimedMode: true, // No ticking timer stress
  soundEffects: true,
  safeMode: true,
  childGrade: "Class 3–5 (उम्र 8–10 वर्ष)",
  allowedSubjects: {
    animals: true,
    math: true,
    science: true,
    stories: true,
    gk: true,
  },
};

export default function ParentZonePage() {
  const router = useRouter();
  const { isHindi } = useLanguage();
  const { tier, setTier } = useTier();

  // ──────────────── State: Gate & Security ────────────────
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [gateMode, setGateMode] = useState("pin"); // "pin" | "math"
  const [mathProblem, setMathProblem] = useState({ q: "8 × 7", ans: 56 });
  const [mathAnswer, setMathAnswer] = useState("");
  const [mathError, setMathError] = useState(false);

  // New PIN change state
  const [newPin, setNewPin] = useState("");
  const [pinSuccessMsg, setPinSuccessMsg] = useState("");

  // ──────────────── State: Active Tab ────────────────
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "controls" | "subjects"

  // ──────────────── State: Parent Settings ────────────────
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [savedFeedback, setSavedFeedback] = useState(false);

  // ──────────────── State: Child Analytics Data ────────────────
  const [childStats, setChildStats] = useState({
    todayQuizzes: 4,
    accuracyPct: 88,
    screenTimeMins: 18,
    streakDays: 5,
    starsEarned: 120,
    weeklyDaysActive: [true, true, true, false, true, true, true],
  });

  // Load session unlock & settings on mount
  useEffect(() => {
    try {
      const sessionUnlocked = sessionStorage.getItem("quizweb_parent_unlocked");
      if (sessionUnlocked === "true") {
        setIsUnlocked(true);
      }

      const storedSettings = localStorage.getItem("quizweb_parent_settings");
      if (storedSettings) {
        setSettings((prev) => ({ ...prev, ...JSON.parse(storedSettings) }));
      }

      // Read real stats from quizweb localStorage keys
      const rawAttempts = localStorage.getItem("quizweb_daily_attempts");
      const rawStreak = localStorage.getItem("quizweb_user_streak_v2");
      const rawXP = localStorage.getItem("quizweb_user_xp");

      let count = 4;
      let accuracy = 88;
      let streak = 5;

      if (rawAttempts) {
        try {
          const attempts = JSON.parse(rawAttempts);
          if (Array.isArray(attempts) && attempts.length > 0) {
            count = Math.max(attempts.length, 1);
            let totalScore = 0;
            let totalQ = 0;
            attempts.forEach((a) => {
              if (a.score !== undefined && a.total) {
                totalScore += a.score;
                totalQ += a.total;
              }
            });
            if (totalQ > 0) {
              accuracy = Math.round((totalScore / totalQ) * 100);
            }
          }
        } catch {}
      }

      if (rawStreak) {
        try {
          const parsed = JSON.parse(rawStreak);
          streak = Number(parsed.count) || 5;
        } catch {}
      }

      let stars = 120;
      if (rawXP) {
        const xp = parseInt(rawXP, 10);
        if (!isNaN(xp) && xp > 0) {
          stars = Math.round(xp / 10);
        }
      }

      setChildStats((prev) => ({
        ...prev,
        todayQuizzes: count,
        accuracyPct: accuracy,
        streakDays: streak,
        starsEarned: stars,
        screenTimeMins: Math.min(count * 5, 60),
      }));

      // Generate random math challenge
      const n1 = Math.floor(Math.random() * 5) + 6; // 6 - 10
      const n2 = Math.floor(Math.random() * 6) + 4; // 4 - 9
      setMathProblem({ q: `${n1} × ${n2}`, ans: n1 * n2 });
    } catch {}
  }, []);

  // Save Settings to LocalStorage
  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem("quizweb_parent_settings", JSON.stringify(next));
      } catch {}
      return next;
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  }, []);

  // Toggle Subject
  const toggleSubject = useCallback((subjKey) => {
    setSettings((prev) => {
      const nextAllowed = {
        ...prev.allowedSubjects,
        [subjKey]: !prev.allowedSubjects[subjKey],
      };
      const next = { ...prev, allowedSubjects: nextAllowed };
      try {
        localStorage.setItem("quizweb_parent_settings", JSON.stringify(next));
      } catch {}
      return next;
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  }, []);

  // ──────────────── PIN Verification Handlers ────────────────
  const handleKeypadPress = (digit) => {
    if (pinInput.length >= 4) return;
    const nextPin = pinInput + digit;
    setPinInput(nextPin);
    setPinError(false);

    if (nextPin.length === 4) {
      verifyPin(nextPin);
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  const verifyPin = (pinToTest) => {
    let savedPin = DEFAULT_PIN;
    try {
      const stored = localStorage.getItem("quizweb_parent_pin");
      if (stored) savedPin = stored;
    } catch {}

    if (pinToTest === savedPin) {
      setIsUnlocked(true);
      sessionStorage.setItem("quizweb_parent_unlocked", "true");
      setPinInput("");
    } else {
      setPinError(true);
      setTimeout(() => {
        setPinInput("");
        setPinError(false);
      }, 700);
    }
  };

  const verifyMathChallenge = (e) => {
    e.preventDefault();
    if (parseInt(mathAnswer, 10) === mathProblem.ans) {
      setIsUnlocked(true);
      sessionStorage.setItem("quizweb_parent_unlocked", "true");
      setMathAnswer("");
      setMathError(false);
    } else {
      setMathError(true);
      setTimeout(() => setMathError(false), 800);
    }
  };

  const lockParentZone = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem("quizweb_parent_unlocked");
    setPinInput("");
  };

  const saveNewPin = () => {
    if (newPin.length === 4 && /^\d+$/.test(newPin)) {
      try {
        localStorage.setItem("quizweb_parent_pin", newPin);
        setPinSuccessMsg(isHindi ? "पिन सफलतापूर्वक बदला गया! ✓" : "PIN updated successfully! ✓");
        setNewPin("");
        setTimeout(() => setPinSuccessMsg(""), 3000);
      } catch {}
    }
  };

  // ──────────────── WhatsApp Share ────────────────
  const shareWeeklyReport = () => {
    const text = isHindi
      ? `🌟 *क्विज़वेब बाल प्रगति रिपोर्ट*\n\n🎯 आज के क्विज़: ${childStats.todayQuizzes}\n📈 सटीकता दर: ${childStats.accuracyPct}%\n🔥 स्ट्रीक: ${childStats.streakDays} दिन\n⭐ अर्जित सितारे: ${childStats.starsEarned}\n\nमेरे बच्चे ने आज बहुत लगन से पढ़ाई की! 👏\nदेखें: https://quizweb.app`
      : `🌟 *QuizWeb Child Learning Report*\n\n🎯 Quizzes Today: ${childStats.todayQuizzes}\n📈 Accuracy: ${childStats.accuracyPct}%\n🔥 Daily Streak: ${childStats.streakDays} Days\n⭐ Stars Earned: ${childStats.starsEarned}\n\nProud of my child's curious learning journey today! 👏\nVisit: https://quizweb.app`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Return to Kids Mode
  const handleReturnToKids = () => {
    setTier(TIERS.KIDS);
    router.push("/");
  };

  // ──────────────── RENDER: SCREEN 0 - PARENT VERIFICATION GATE ────────────────
  if (!isUnlocked) {
    return (
      <main className={styles.parentPage}>
        <div className={styles.gateWrapper}>
          <div className={styles.gateCard}>
            <div className={styles.gateIconContainer}>
              <ShieldCheck size={36} />
            </div>

            <div className={styles.gateBadge}>
              <Lock size={12} />
              <span>{isHindi ? "अभिभावक सत्यापन" : "Parent Verification"}</span>
            </div>

            <h1 className={styles.gateTitle}>
              {isHindi ? "पैरेंट ज़ोन सुरक्षा" : "Parent Zone Access"}
            </h1>

            <p className={styles.gateDesc}>
              {gateMode === "pin"
                ? isHindi
                  ? "बच्चों के अनपेक्षित बदलाव से सुरक्षित रखने के लिए 4-अंकीय पिन दर्ज करें।"
                  : "Please enter your 4-digit parent PIN to manage controls."
                : isHindi
                ? "पिन याद नहीं है? त्वरित गणित प्रश्न हल करके प्रवेश करें।"
                : "Forgot PIN? Solve this quick adult math challenge to enter."}
            </p>

            {gateMode === "pin" ? (
              <>
                {/* 4 Dot Indicator */}
                <div className={styles.pinDisplayRow}>
                  {[0, 1, 2, 3].map((idx) => {
                    const isFilled = pinInput.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`${styles.pinDot} ${isFilled ? styles.pinDotFilled : ""} ${
                          pinError ? styles.pinDotError : ""
                        }`}
                      />
                    );
                  })}
                </div>

                {pinError && (
                  <p className="text-xs font-bold text-rose-500 mb-3 animate-pulse">
                    {isHindi ? "गलत पिन! कृपया पुनः प्रयास करें।" : "Incorrect PIN! Please try again."}
                  </p>
                )}

                {/* Keypad */}
                <div className={styles.keypadGrid}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                    <button
                      key={digit}
                      className={styles.keypadBtn}
                      onClick={() => handleKeypadPress(String(digit))}
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    className={`${styles.keypadBtn} ${styles.keypadActionBtn}`}
                    onClick={() => setPinInput("")}
                  >
                    Clear
                  </button>
                  <button className={styles.keypadBtn} onClick={() => handleKeypadPress("0")}>
                    0
                  </button>
                  <button
                    className={`${styles.keypadBtn} ${styles.keypadActionBtn}`}
                    onClick={handleBackspace}
                    aria-label="Backspace"
                  >
                    ⌫
                  </button>
                </div>

                <div className="mt-4 flex flex-col items-center gap-2">
                  <button className={styles.gateToggleModeBtn} onClick={() => setGateMode("math")}>
                    {isHindi ? "गणित पहेली से अनलॉक करें (वैकल्पिक)" : "Unlock via Math Puzzle instead"}
                  </button>
                  <span className="text-[11px] text-slate-400">
                    {isHindi ? "डिफ़ॉल्ट पिन: 1234" : "Default PIN: 1234"}
                  </span>
                </div>
              </>
            ) : (
              /* Math Challenge Mode */
              <form onSubmit={verifyMathChallenge} className={styles.mathChallengeBox}>
                <div className="text-xs font-bold text-slate-500 mb-2">
                  {isHindi ? "वयस्क सत्यापन प्रश्न:" : "Parent Math Gate:"}
                </div>
                <div className={styles.mathQuestion}>{mathProblem.q} = ?</div>
                <div className="flex items-center justify-center gap-3">
                  <input
                    type="number"
                    value={mathAnswer}
                    onChange={(e) => setMathAnswer(e.target.value)}
                    placeholder="उत्तर"
                    className={styles.mathInput}
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-5 h-12 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md"
                  >
                    {isHindi ? "पुष्टि करें" : "Verify"}
                  </button>
                </div>

                {mathError && (
                  <p className="text-xs font-bold text-rose-500 mt-2">
                    {isHindi ? "गलत उत्तर! पुनः प्रयास करें।" : "Incorrect answer! Try again."}
                  </p>
                )}

                <div className="mt-4">
                  <button
                    type="button"
                    className={styles.gateToggleModeBtn}
                    onClick={() => setGateMode("pin")}
                  >
                    ← {isHindi ? "पिन द्वारा दर्ज करें" : "Return to PIN entry"}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-center">
              <Link
                href="/"
                className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1"
              >
                <ArrowLeft size={13} />
                <span>{isHindi ? "होम पेज पर वापस जाएं" : "Return to Home"}</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ──────────────── RENDER: UNLOCKED PARENT DASHBOARD ────────────────
  return (
    <main className={styles.parentPage}>
      {/* 1. HERO HEADER */}
      <div className={styles.heroCard}>
        <div className="flex items-center justify-between">
          <Link href="/" className={styles.heroBackLink}>
            <ArrowLeft size={14} />
            <span>{isHindi ? "होम पर वापस" : "Back to Home"}</span>
          </Link>
          {savedFeedback && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 animate-pulse">
              ✓ {isHindi ? "सेटिंग्स सेव हो गईं" : "Settings Saved"}
            </span>
          )}
        </div>

        <div className={styles.heroTopRow}>
          <div className={styles.heroBrandGroup}>
            <div className={styles.heroIconBadge}>
              <ShieldCheck size={28} />
            </div>
            <div className={styles.heroTitleGroup}>
              <div className="flex items-center gap-2">
                <h1>{isHindi ? "अभिभावक मॉनिटरिंग ज़ोन" : "Parent Monitoring Zone"}</h1>
                <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {isHindi ? "सक्रिय" : "Active"}
                </span>
              </div>
              <p>
                {isHindi
                  ? "बच्चों के स्क्रीन समय, दैनिक क्विज़ सीमा और प्रगति की सुरक्षित निगरानी।"
                  : "Monitor learning progress, set screen limits, and curate child-safe topics."}
              </p>
            </div>
          </div>

          <div className={styles.heroActionGroup}>
            <button
              onClick={lockParentZone}
              className={styles.lockBtn}
              title={isHindi ? "पैरेंट ज़ोन लॉक करें" : "Lock Parent Zone"}
            >
              <Lock size={14} />
              <span>{isHindi ? "लॉक करें" : "Lock Zone"}</span>
            </button>
          </div>
        </div>

        {/* 2. NAVIGATION TABS */}
        <div className={styles.tabNav}>
          <button
            className={`${styles.tabBtn} ${activeTab === "dashboard" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <Trophy size={16} />
            <span>{isHindi ? "प्रगति व रिपोर्ट" : "Progress & Stats"}</span>
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "controls" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("controls")}
          >
            <Sliders size={16} />
            <span>{isHindi ? "सीमाएं व सेटिंग्स" : "Limits & Controls"}</span>
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "subjects" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("subjects")}
          >
            <BookOpen size={16} />
            <span>{isHindi ? "विषय चयन" : "Curated Subjects"}</span>
          </button>
        </div>
      </div>

      {/* ──────────────── TAB 1: DASHBOARD & REPORT CARD ──────────────── */}
      {activeTab === "dashboard" && (
        <div className="flex flex-col gap-5">
          {/* 4-KPI Grid */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statCardTop}>
                <div className={styles.statIcon} style={{ background: "#EEF2FF", color: "#4F46E5" }}>
                  <Trophy size={18} />
                </div>
                <span className="text-[11px] font-bold text-slate-400">
                  {isHindi ? "दैनिक लक्ष्य: " : "Target: "}
                  {settings.quizLimit}
                </span>
              </div>
              <div className={styles.statValue}>
                {childStats.todayQuizzes}{" "}
                <span className="text-xs text-slate-500 font-semibold">
                  / {settings.quizLimit === "unlimited" ? "∞" : settings.quizLimit}
                </span>
              </div>
              <div className={styles.statLabel}>
                {isHindi ? "आज हल किए गए क्विज़" : "Quizzes Solved Today"}
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statCardTop}>
                <div className={styles.statIcon} style={{ background: "#ECFDF5", color: "#059669" }}>
                  <CheckCircle2 size={18} />
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {childStats.accuracyPct >= 80 ? "उत्कृष्ट" : "अच्छा"}
                </span>
              </div>
              <div className={styles.statValue}>{childStats.accuracyPct}%</div>
              <div className={styles.statLabel}>
                {isHindi ? "सटीकता दर (Accuracy)" : "Overall Accuracy"}
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statCardTop}>
                <div className={styles.statIcon} style={{ background: "#FEF3C7", color: "#D97706" }}>
                  <Clock size={18} />
                </div>
                <span className="text-[11px] font-bold text-slate-400">
                  {isHindi ? "अधिकतम: " : "Limit: "}
                  {settings.screenTimeLimit}m
                </span>
              </div>
              <div className={styles.statValue}>
                {childStats.screenTimeMins}{" "}
                <span className="text-xs text-slate-500 font-semibold">
                  {isHindi ? "मिनट" : "mins"}
                </span>
              </div>
              <div className={styles.statLabel}>
                {isHindi ? "सक्रिय अध्ययन समय" : "Active Screen Time"}
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statCardTop}>
                <div className={styles.statIcon} style={{ background: "#FFF1F2", color: "#E11D48" }}>
                  <Flame size={18} />
                </div>
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                  🔥 {childStats.streakDays} {isHindi ? "दिन" : "Days"}
                </span>
              </div>
              <div className={styles.statValue}>
                {childStats.starsEarned}{" "}
                <span className="text-xs text-amber-500 font-semibold">⭐</span>
              </div>
              <div className={styles.statLabel}>
                {isHindi ? "कुल अर्जित सितारे" : "Stars / Points Earned"}
              </div>
            </div>
          </div>

          {/* 7-Day Weekly Activity Strip */}
          <div className={styles.activityCard}>
            <div className={styles.activityHeader}>
              <span className={styles.activityTitle}>
                📅 {isHindi ? "इस सप्ताह की अध्ययन निरंतरता" : "Weekly Learning Activity"}
              </span>
              <span className="text-xs font-bold text-indigo-600">
                {childStats.streakDays} {isHindi ? "दिन की सक्रिय स्ट्रीक" : "Days Active"}
              </span>
            </div>

            <div className={styles.weekDaysRow}>
              {["सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि", "रवि"].map((dayName, idx) => {
                const isActive = childStats.weeklyDaysActive[idx];
                const isToday = idx === 4; // Friday/current indicator
                return (
                  <div
                    key={idx}
                    className={`${styles.dayPill} ${isActive ? styles.dayPillActive : ""} ${
                      isToday ? styles.dayPillToday : ""
                    }`}
                  >
                    <span className={styles.dayLabel}>{dayName}</span>
                    <div
                      className={`${styles.dayDot} ${isActive ? styles.dayDotComplete : ""}`}
                    >
                      {isActive ? "✓" : "•"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Report Card Celebratory Banner */}
          <div className={styles.reportCardBanner}>
            <div className={styles.reportCardTop}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🌟</span>
                <div>
                  <h3 className={styles.reportTitle}>
                    {isHindi ? "साप्ताहिक बाल प्रगति रिपोर्ट कार्ड" : "Weekly Child Progress Report"}
                  </h3>
                  <p className={styles.reportSubtitle}>
                    {isHindi
                      ? `आपके बच्चे ने इस सप्ताह ${childStats.accuracyPct}% सटीकता के साथ ${childStats.todayQuizzes} क्विज़ पूरे किए!`
                      : `Your child maintained ${childStats.accuracyPct}% accuracy and earned ${childStats.starsEarned} stars this week!`}
                  </p>
                </div>
              </div>
              <div className={styles.reportBadge}>
                <Award size={15} />
                <span>{isHindi ? "बाल वैज्ञानिक बैज" : "Little Explorer Badge"}</span>
              </div>
            </div>

            <div className={styles.reportActions}>
              <button className={styles.shareBtn} onClick={shareWeeklyReport}>
                <Share2 size={16} />
                <span>{isHindi ? "WhatsApp पर शेयर करें" : "Share on WhatsApp"}</span>
              </button>
              <button className={styles.printBtn} onClick={() => window.print()}>
                <Printer size={16} />
                <span>{isHindi ? "रिपोर्ट प्रिंट / सेव करें" : "Print / Save PDF"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 2: CONTROLS & LIMITS ──────────────── */}
      {activeTab === "controls" && (
        <div className={styles.controlsList}>
          {/* Daily Screen Time Limit */}
          <div className={styles.controlCard}>
            <div className={styles.controlHeader}>
              <div className={styles.controlInfo}>
                <div className={styles.controlIconBox}>
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className={styles.controlTitle}>
                    {isHindi ? "दैनिक स्क्रीन समय सीमा" : "Daily Screen Time Limit"}
                  </h3>
                  <p className={styles.controlDesc}>
                    {isHindi
                      ? "समय समाप्त होने पर बच्चे को प्रोत्साहित करने वाला ब्रेक रिमाइंडर दिखाया जाएगा।"
                      : "When time runs out, a friendly break prompt reminds the child to rest their eyes."}
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.optionPillGroup}>
              {[
                { val: "15", label: "15 मिनट" },
                { val: "30", label: "30 मिनट" },
                { val: "45", label: "45 मिनट" },
                { val: "60", label: "60 मिनट" },
                { val: "unlimited", label: isHindi ? "असीमित" : "No Limit" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  className={`${styles.optionPill} ${
                    settings.screenTimeLimit === opt.val ? styles.optionPillActive : ""
                  }`}
                  onClick={() => updateSetting("screenTimeLimit", opt.val)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Quiz Limit */}
          <div className={styles.controlCard}>
            <div className={styles.controlHeader}>
              <div className={styles.controlInfo}>
                <div className={styles.controlIconBox}>
                  <Trophy size={20} />
                </div>
                <div>
                  <h3 className={styles.controlTitle}>
                    {isHindi ? "दैनिक क्विज़ कोटा" : "Daily Quiz Limit"}
                  </h3>
                  <p className={styles.controlDesc}>
                    {isHindi
                      ? "एक दिन में बच्चे कितने क्विज़ खेल सकते हैं, इसकी संख्या निर्धारित करें।"
                      : "Cap the maximum number of quiz sessions per day to prevent exhaustion."}
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.optionPillGroup}>
              {[
                { val: "5", label: "5 क्विज़" },
                { val: "10", label: "10 क्विज़" },
                { val: "15", label: "15 क्विज़" },
                { val: "20", label: "20 क्विज़" },
                { val: "unlimited", label: isHindi ? "असीमित" : "No Limit" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  className={`${styles.optionPill} ${
                    settings.quizLimit === opt.val ? styles.optionPillActive : ""
                  }`}
                  onClick={() => updateSetting("quizLimit", opt.val)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* No-Stress Untimed Mode Toggle */}
          <div className={styles.controlCard}>
            <div className={styles.controlHeader}>
              <div className={styles.controlInfo}>
                <div className={styles.controlIconBox}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className={styles.controlTitle}>
                    {isHindi ? "तनाव-मुक्त जेन टाइमर मोड" : "Untimed / Stress-Free Mode"}
                  </h3>
                  <p className={styles.controlDesc}>
                    {isHindi
                      ? "टाइमर की उल्टी गिनती हटाकर बच्चों को बिना किसी दबाव के सोचने का समय दें।"
                      : "Removes ticking countdown clocks to encourage thoughtful, relaxed learning."}
                  </p>
                </div>
              </div>

              <label className={styles.switchToggle}>
                <input
                  type="checkbox"
                  checked={settings.untimedMode}
                  onChange={(e) => updateSetting("untimedMode", e.target.checked)}
                />
                <span className={styles.slider} />
              </label>
            </div>
          </div>

          {/* Sound Effects & Encouraging Jingles */}
          <div className={styles.controlCard}>
            <div className={styles.controlHeader}>
              <div className={styles.controlInfo}>
                <div className={styles.controlIconBox}>
                  <Volume2 size={20} />
                </div>
                <div>
                  <h3 className={styles.controlTitle}>
                    {isHindi ? "उत्साहवर्धक ध्वनियां व जिंगल" : "Encouraging Sound Effects"}
                  </h3>
                  <p className={styles.controlDesc}>
                    {isHindi
                      ? "सही उत्तर और नए स्टार्स मिलने पर खुशियों भरे साउंड इफ़ेक्ट्स चालू रखें।"
                      : "Plays cheerful sound effects and animations upon answering correctly."}
                  </p>
                </div>
              </div>

              <label className={styles.switchToggle}>
                <input
                  type="checkbox"
                  checked={settings.soundEffects}
                  onChange={(e) => updateSetting("soundEffects", e.target.checked)}
                />
                <span className={styles.slider} />
              </label>
            </div>
          </div>

          {/* Strict Safe Kid Environment */}
          <div className={styles.controlCard}>
            <div className={styles.controlHeader}>
              <div className={styles.controlInfo}>
                <div className={styles.controlIconBox}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className={styles.controlTitle}>
                    {isHindi ? "सख्त सुरक्षित वातावरण (Strict Safe Mode)" : "Strict Safe Mode"}
                  </h3>
                  <p className={styles.controlDesc}>
                    {isHindi
                      ? "किसी भी बाहरी लिंक या वयस्क सामग्री को पूरी तरह ब्लॉक रखें।"
                      : "Completely blocks external links and adult exam topics for young minds."}
                  </p>
                </div>
              </div>

              <label className={styles.switchToggle}>
                <input
                  type="checkbox"
                  checked={settings.safeMode}
                  onChange={(e) => updateSetting("safeMode", e.target.checked)}
                />
                <span className={styles.slider} />
              </label>
            </div>
          </div>

          {/* Change PIN Card */}
          <div className={styles.controlCard}>
            <div className={styles.controlHeader}>
              <div className={styles.controlInfo}>
                <div className={styles.controlIconBox}>
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className={styles.controlTitle}>
                    {isHindi ? "अभिभावक पिन बदलें" : "Change Parent PIN"}
                  </h3>
                  <p className={styles.controlDesc}>
                    {isHindi
                      ? "नया 4-अंकीय कोड सेट करें ताकि केवल आप सेटिंग्स बदल सकें।"
                      : "Set a custom 4-digit code to protect parental controls."}
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.pinChangeRow}>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                placeholder="4 अंक"
                className={styles.pinInputSmall}
              />
              <button
                className={styles.pinSaveBtn}
                onClick={saveNewPin}
                disabled={newPin.length !== 4}
              >
                {isHindi ? "पिन सहेजें" : "Save PIN"}
              </button>
              {pinSuccessMsg && (
                <span className="text-xs font-bold text-emerald-600 ml-2 animate-fadeIn">
                  {pinSuccessMsg}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 3: CURATED SUBJECTS ──────────────── */}
      {activeTab === "subjects" && (
        <div className="flex flex-col gap-5">
          {/* Grade/Age Selector */}
          <div className={styles.controlCard}>
            <div className={styles.controlHeader}>
              <div className={styles.controlInfo}>
                <div className={styles.controlIconBox}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className={styles.controlTitle}>
                    {isHindi ? "बच्चे की कक्षा / आयु वर्ग" : "Child Age Group & Grade"}
                  </h3>
                  <p className={styles.controlDesc}>
                    {isHindi
                      ? "क्विज़ की कठिनाई और शब्दावली बच्चे की उम्र के अनुसार समायोजित की जाएगी।"
                      : "Difficulty, vocabulary, and topics adapt based on your child's age group."}
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.optionPillGroup}>
              {[
                { id: "Class 1–2 (उम्र 5–7 वर्ष)", en: "Class 1–2 (5-7 yrs)" },
                { id: "Class 3–5 (उम्र 8–10 वर्ष)", en: "Class 3–5 (8-10 yrs)" },
                { id: "Class 6–8 (उम्र 11–13 वर्ष)", en: "Class 6–8 (11-13 yrs)" },
              ].map((g) => (
                <button
                  key={g.id}
                  className={`${styles.optionPill} ${
                    settings.childGrade === g.id ? styles.optionPillActive : ""
                  }`}
                  onClick={() => updateSetting("childGrade", g.id)}
                >
                  {isHindi ? g.id : g.en}
                </button>
              ))}
            </div>
          </div>

          {/* Subjects Toggle Grid */}
          <div className={styles.subjectGrid}>
            {[
              {
                id: "animals",
                emoji: "🦁",
                name: isHindi ? "पशु-पक्षी व प्रकृति" : "Animals & Wildlife",
                sub: isHindi ? "जीव-जंतुओं के रोचक तथ्य और आदतें" : "Habitats, sounds and life cycles",
              },
              {
                id: "math",
                emoji: "🧮",
                name: isHindi ? "गणित व दिमागी पहेलियां" : "Math & Brain Puzzles",
                sub: isHindi ? "पैटर्न पहचान, गिनती और तार्किक पहेलियां" : "Counting, shapes and logic riddles",
              },
              {
                id: "science",
                emoji: "🚀",
                name: isHindi ? "अंतरिक्ष व विज्ञान के चमत्कार" : "Space & Science Wonders",
                sub: isHindi ? "सौरमंडल, पौधे और सरल विज्ञान के नियम" : "Planets, gravity and natural laws",
              },
              {
                id: "stories",
                emoji: "📖",
                name: isHindi ? "प्रेरक कहानियां व नीति" : "Moral Stories & Wisdom",
                sub: isHindi ? "पंचतंत्र, जातक कथाएं और मूल्य" : "Panchatantra, life values and heroes",
              },
              {
                id: "gk",
                emoji: "🌍",
                name: isHindi ? "रोचक भारत व दुनिया (GK)" : "Curious India & World",
                sub: isHindi ? "नदियां, राज्य, स्मारक और राष्ट्रीय प्रतीक" : "Monuments, flags, rivers & wonders",
              },
            ].map((subj) => {
              const isAllowed = settings.allowedSubjects[subj.id] !== false;
              return (
                <div
                  key={subj.id}
                  className={`${styles.subjectCard} ${isAllowed ? styles.subjectCardActive : ""}`}
                >
                  <div className={styles.subjectInfo}>
                    <span className={styles.subjectEmoji}>{subj.emoji}</span>
                    <div>
                      <div className={styles.subjectName}>{subj.name}</div>
                      <div className={styles.subjectSub}>{subj.sub}</div>
                    </div>
                  </div>

                  <label className={styles.switchToggle}>
                    <input
                      type="checkbox"
                      checked={isAllowed}
                      onChange={() => toggleSubject(subj.id)}
                    />
                    <span className={styles.slider} />
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ──────────────── FOOTER QUICK ACTION BUTTONS ──────────────── */}
      <div className={styles.footerActions}>
        <button className={styles.primaryReturnBtn} onClick={handleReturnToKids}>
          <span>{isHindi ? "🎈 बच्चों के प्ले मोड में जाएं" : "🎈 Return to Kids Play Mode"}</span>
          <ArrowRight size={16} />
        </button>

        <button
          className={styles.secondaryTierBtn}
          onClick={() => {
            setTier(TIERS.STUDENTS);
            router.push("/");
          }}
        >
          <span>{isHindi ? "विद्यार्थी टियर चुनें" : "Switch to Students Tier"}</span>
        </button>

        <button
          className={styles.secondaryTierBtn}
          onClick={() => {
            setTier(TIERS.ADULTS);
            router.push("/");
          }}
        >
          <span>{isHindi ? "एक्सप्लोरर टियर चुनें" : "Switch to Explorer Tier"}</span>
        </button>
      </div>
    </main>
  );
}
