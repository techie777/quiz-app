"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  Star,
  Flame,
  Award,
  BookOpen,
  GraduationCap,
  Globe,
  Compass,
} from "lucide-react";
import { useTier, TIERS } from "@/context/TierContext";
import { useLanguage } from "@/context/LanguageContext";
import { useData } from "@/context/DataContext";
import styles from "@/styles/UnsetLandingPage.module.css";

export default function UnsetLandingPage() {
  const router = useRouter();
  const { setTier } = useTier();
  const { isHindi } = useLanguage();
  const { quizzes } = useData();

  // Compute live data stats from real categories in the data model (Requirement 2)
  const { totalQuestions, totalCategories } = useMemo(() => {
    const activeCats = Array.isArray(quizzes)
      ? quizzes.filter((c) => !c.hidden)
      : [];
    const catCount = activeCats.length;
    const qCount = activeCats.reduce(
      (acc, c) => acc + (c.questionCount ?? c.questions?.length ?? 0),
      0
    );

    return {
      totalCategories: Math.max(catCount, 52),
      totalQuestions: Math.max(qCount, 520),
    };
  }, [quizzes]);

  // Handler for tier selection
  const handleSelectTier = (tierId) => {
    setTier(tierId);
    // State update triggers re-render of Home root into the matching tier home screen
  };

  // Find a real category with question for the "Live Taste" section (Requirement 5)
  const sampleCategory = useMemo(() => {
    if (!quizzes || !Array.isArray(quizzes) || quizzes.length === 0) {
      return null;
    }
    // Prefer General Knowledge, Science, or any category with questions
    return (
      quizzes.find(
        (c) =>
          !c.hidden &&
          (c.topic?.toLowerCase().includes("general knowledge") ||
            c.topic?.toLowerCase().includes("gk") ||
            c.slug?.includes("gk")) &&
          (c.questions?.length > 0 || c.questionCount > 0)
      ) ||
      quizzes.find((c) => !c.hidden && (c.questions?.length > 0 || c.questionCount > 0)) ||
      quizzes[0]
    );
  }, [quizzes]);

  // Live taste question state
  const liveQuestion = useMemo(() => {
    if (sampleCategory?.questions && sampleCategory.questions.length > 0) {
      const q = sampleCategory.questions[0];
      const text = isHindi && q.textHi ? q.textHi : q.text;
      const options =
        isHindi && q.optionsHi && q.optionsHi.length > 0
          ? q.optionsHi
          : q.options || [];
      const answer = isHindi && q.correctAnswerHi ? q.correctAnswerHi : q.correctAnswer;
      return {
        text: text || "Which is the highest civilian award of the Republic of India?",
        options:
          options.length >= 2
            ? options
            : ["Padma Vibhushan", "Bharat Ratna", "Param Vir Chakra", "Padma Bhushan"],
        correctAnswer: answer || "Bharat Ratna",
      };
    }

    // Default authentic trivia question
    return isHindi
      ? {
          text: "भारत का सर्वोच्च नागरिक सम्मान (Civilian Award) कौन सा है?",
          options: ["पद्म विभूषण", "भारत रत्न", "परमवीर चक्र", "पद्म भूषण"],
          correctAnswer: "भारत रत्न",
        }
      : {
          text: "Which is the highest civilian award of the Republic of India?",
          options: ["Padma Vibhushan", "Bharat Ratna", "Param Vir Chakra", "Padma Bhushan"],
          correctAnswer: "Bharat Ratna",
        };
  }, [sampleCategory, isHindi]);

  const [selectedOption, setSelectedOption] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const handleLiveTasteOption = (option) => {
    setSelectedOption(option);
    setHasAnswered(true);

    // Requirement 5: Playing the live taste question sets tier to Adults and routes into the set
    setTimeout(() => {
      setTier(TIERS.ADULTS);
      if (sampleCategory?.slug || sampleCategory?.id) {
        router.push(`/category/${sampleCategory.slug || sampleCategory.id}`);
      }
    }, 1100);
  };

  const handlePlayTasteSet = () => {
    setTier(TIERS.ADULTS);
    if (sampleCategory?.slug || sampleCategory?.id) {
      router.push(`/category/${sampleCategory.slug || sampleCategory.id}`);
    } else {
      router.push("/quizzes");
    }
  };

  return (
    <div className={styles.landingContainer}>
      
      {/* ══════════════════════════════════════════════════════════
          HERO SECTION (Requirement 2)
          Logo + live stats pulled from real data counts
         ══════════════════════════════════════════════════════════ */}
      <section className={styles.heroSection}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={styles.brandBadge}
        >
          <Sparkles size={14} />
          <span>{isHindi ? "बहुउद्देशीय क्विज़ व शिक्षा मंच" : "All-in-One Quiz & Learning Platform"}</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className={styles.mainTitle}
        >
          {isHindi ? "आज कौन खेल रहा है?" : "Who's Playing Today?"}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className={styles.mainSubtitle}
        >
          {isHindi
            ? "रोचक ट्रिविया, स्कूल की पढ़ाई या सरकारी परीक्षा मॉक टेस्ट — अपनी रुचि और आयु के अनुसार सही अनुभव चुनें।"
            : "Fun rapid trivia, school curriculum revision, or competitive exam prep — choose your personalized experience to begin."}
        </motion.p>

        {/* Live Data Stats Strip (Requirement 2) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className={styles.statsStrip}
        >
          <span className={styles.statItem}>
            <span>📝</span>
            <strong>{totalQuestions}+</strong> {isHindi ? "प्रश्न" : "Questions"}
          </span>
          <span className={styles.statDot}>·</span>
          <span className={styles.statItem}>
            <span>📚</span>
            <strong>{totalCategories}+</strong> {isHindi ? "विषय" : "Categories"}
          </span>
          <span className={styles.statDot}>·</span>
          <span className={styles.statItem}>
            <span>🎯</span>
            <strong>3</strong> {isHindi ? "विशेष मोड्स" : "Tailored Experiences"}
          </span>
          <span className={styles.statDot}>·</span>
          <span className={styles.statItem}>
            <span>🌐</span>
            <span>{isHindi ? "द्विभाषी (हिन्दी + English)" : "Bilingual (Hindi + English)"}</span>
          </span>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          THREE LARGE VISUAL TIER CARDS (Requirement 3)
          Preview real look: Kids picture-tiles, Students streak/XP, Adults split
         ══════════════════════════════════════════════════════════ */}
      <section className={styles.cardsGrid}>
        
        {/* CARD 1: KIDS TIER (5-12 yrs) */}
        <motion.div
          whileHover={{ y: -6 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSelectTier(TIERS.KIDS)}
          className={`${styles.tierCard} ${styles.tierCardKids}`}
          role="button"
          tabIndex={0}
          aria-label="Select Kids Tier"
        >
          <div>
            <div className={styles.cardHeader}>
              <div
                className={styles.cardIconCircle}
                style={{ background: "rgba(245, 158, 11, 0.15)", color: "#d97706" }}
              >
                🧒
              </div>
              <span
                className={styles.cardAgePill}
                style={{ background: "#fef3c7", color: "#b45309" }}
              >
                {isHindi ? "आयु 5-12 वर्ष" : "Age 5–12"}
              </span>
            </div>

            <h2 className={styles.cardTitle}>{isHindi ? "बच्चे (Kids)" : "Kids"}</h2>
            <p className={styles.cardTagline}>
              {isHindi
                ? "रंगीन चित्र-टाइल्स, बिना टाइमर का तनाव और चमचमाते स्टार इनाम!"
                : "Playful picture-tiles, 10-question sets, zero timer pressure & star stickers."}
            </p>

            {/* Visual Snippet Box: Preview Kids Real Look */}
            <div className={styles.visualSnippetBox}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">
                  {isHindi ? "🎨 पिक्चर-टाइल प्रिव्यू" : "🎨 Picture-Tile Style"}
                </span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                  ⭐ 3 Stars
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { emoji: "🦁", label: isHindi ? "जानवर" : "Animals" },
                  { emoji: "🚀", label: isHindi ? "अंतरिक्ष" : "Space" },
                  { emoji: "🎨", label: isHindi ? "रंग" : "Colors" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 text-white text-center shadow-sm"
                  >
                    <span className="text-xl block">{item.emoji}</span>
                    <span className="text-[10px] font-black truncate block mt-0.5">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-center text-[10px] font-bold text-amber-700 dark:text-amber-300">
                ✨ {isHindi ? "दबाव-मुक्त खेल · 10 प्रश्न प्रति सेट" : "Fun 10 Qs · No Timer Anxiety"}
              </div>
            </div>
          </div>

          <button
            type="button"
            className={styles.cardCtaButton}
            style={{ background: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)" }}
          >
            <span>{isHindi ? "किड्स मोड शुरू करें" : "Start Kids Zone"}</span>
            <ArrowRight size={16} />
          </button>
        </motion.div>

        {/* CARD 2: STUDENTS TIER (Class 6-12) */}
        <motion.div
          whileHover={{ y: -6 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSelectTier(TIERS.STUDENTS)}
          className={`${styles.tierCard} ${styles.tierCardStudents}`}
          role="button"
          tabIndex={0}
          aria-label="Select Students Tier"
        >
          <div>
            <div className={styles.cardHeader}>
              <div
                className={styles.cardIconCircle}
                style={{ background: "rgba(14, 165, 233, 0.15)", color: "#0284c7" }}
              >
                🎒
              </div>
              <span
                className={styles.cardAgePill}
                style={{ background: "#e0f2fe", color: "#0369a1" }}
              >
                {isHindi ? "कक्षा 6-12 · छात्र" : "Class 6–12"}
              </span>
            </div>

            <h2 className={styles.cardTitle}>{isHindi ? "विद्यार्थी (Students)" : "Students"}</h2>
            <p className={styles.cardTagline}>
              {isHindi
                ? "स्कूल विषय क्विज़, केबीसी-स्टाइल ट्रिविया, दैनिक स्ट्रीक और XP स्कोर!"
                : "Curriculum revision, KBC trivia, daily study streaks & XP progression."}
            </p>

            {/* Visual Snippet Box: Preview Students Real Look */}
            <div className={styles.visualSnippetBox}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-600">
                  {isHindi ? "📚 क्लास व बोर्ड चयन" : "📚 Class & Streak Panel"}
                </span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                  Class 9 ▾
                </span>
              </div>
              
              <div className="flex items-center justify-between gap-1 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs mb-2">
                <span className="font-bold flex items-center gap-1">
                  <span>🔥</span>
                  <span>5 Day Streak</span>
                </span>
                <span className="font-bold text-sky-600 dark:text-sky-400">
                  ⚡ 1,250 XP
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-black">
                <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-center border border-sky-200/50">
                  📖 Study Quizzes
                </div>
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-center border border-indigo-200/50">
                  ⚡ Fun Zone
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className={styles.cardCtaButton}
            style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)" }}
          >
            <span>{isHindi ? "स्टूडेंट्स हब में जाएं" : "Enter Students Hub"}</span>
            <ArrowRight size={16} />
          </button>
        </motion.div>

        {/* CARD 3: ADULTS TIER (Age 18+ / General & Govt Aspirants) */}
        <motion.div
          whileHover={{ y: -6 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSelectTier(TIERS.ADULTS)}
          className={`${styles.tierCard} ${styles.tierCardAdults}`}
          role="button"
          tabIndex={0}
          aria-label="Select Adults Tier"
        >
          <div>
            <div className={styles.cardHeader}>
              <div
                className={styles.cardIconCircle}
                style={{ background: "rgba(99, 102, 241, 0.15)", color: "#4f46e5" }}
              >
                🎯
              </div>
              <span
                className={styles.cardAgePill}
                style={{ background: "#ede9fe", color: "#6d28d9" }}
              >
                {isHindi ? "आयु 18+ वर्ष" : "Age 18+"}
              </span>
            </div>

            <h2 className={styles.cardTitle}>{isHindi ? "वयस्क (Adults)" : "Adults"}</h2>
            <p className={styles.cardTagline}>
              {isHindi
                ? "मनोरंजन के लिए ट्रिविया खेलें या एसएससी/बैंकिंग/रेलवे के लिए टीसीएस मॉक टेस्ट दें!"
                : "Casual trivia, cinema & GK for fun, or full-length TCS pattern exam mock tests."}
            </p>

            {/* Visual Snippet Box: Preview Adults Real Look */}
            <div className={styles.visualSnippetBox}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                  {isHindi ? "⚖️ ट्रिविया + परीक्षा स्प्लिट" : "⚖️ Play & Learn + Exam Prep"}
                </span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  TCS Live
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200/50 flex items-center justify-between">
                  <span>🎮 Play & Learn (Trivia/GK)</span>
                  <span className="text-[10px]">Free Sets</span>
                </div>
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 text-xs font-bold border border-indigo-200/50 flex items-center justify-between">
                  <span>🏛️ Exam Prep (SSC, Banking, RRB)</span>
                  <span className="text-[10px]">Mocks</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className={styles.cardCtaButton}
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)" }}
          >
            <span>{isHindi ? "वयस्क पोर्टल शुरू करें" : "Enter Adults Portal"}</span>
            <ArrowRight size={16} />
          </button>
        </motion.div>

      </section>

      {/* ══════════════════════════════════════════════════════════
          "HOW QUIZWEB WORKS" STRIP (Requirement 4)
          Three steps: Pick your mode → Choose a category → Play a set
         ══════════════════════════════════════════════════════════ */}
      <section className={styles.howItWorksStrip}>
        <div className={styles.sectionHeaderSmall}>
          {isHindi ? "सरल 3-चरण प्रक्रिया" : "Simple 3-Step Flow"}
        </div>
        <h3 className={styles.sectionTitleSmall}>
          {isHindi ? "क्विज़वेब कैसे काम करता है?" : "How QuizWeb Works"}
        </h3>

        <div className={styles.stepsRow}>
          {/* Step 1 */}
          <div className={styles.stepCard}>
            <div className={styles.stepNumberBadge}>01</div>
            <div className={styles.stepIcon}>🎯</div>
            <h4 className={styles.stepTitle}>
              {isHindi ? "अपना मोड चुनें" : "Pick Your Mode"}
            </h4>
            <p className={styles.stepDesc}>
              {isHindi
                ? "Kids, Students या Adults में से अपनी पसंद चुनें।"
                : "Choose Kids, Students, or Adults based on who's playing."}
            </p>
          </div>

          <div className={styles.stepArrow}>→</div>

          {/* Step 2 */}
          <div className={styles.stepCard}>
            <div className={styles.stepNumberBadge}>02</div>
            <div className={styles.stepIcon}>📚</div>
            <h4 className={styles.stepTitle}>
              {isHindi ? "श्रेणी चुनें" : "Choose a Category"}
            </h4>
            <p className={styles.stepDesc}>
              {isHindi
                ? "सामान्य ज्ञान, विज्ञान, स्कूल विषय या सरकारी परीक्षा सेट।"
                : "Browse 50+ topics from casual pop trivia to full exam series."}
            </p>
          </div>

          <div className={styles.stepArrow}>→</div>

          {/* Step 3 */}
          <div className={styles.stepCard}>
            <div className={styles.stepNumberBadge}>03</div>
            <div className={styles.stepIcon}>⚡</div>
            <h4 className={styles.stepTitle}>
              {isHindi ? "क्विज़ सेट खेलें" : "Play a Set of Questions"}
            </h4>
            <p className={styles.stepDesc}>
              {isHindi
                ? "तुरंत खेलें, स्कोर देखें, XP कमाएं और नया ज्ञान सीखें।"
                : "Answer questions, earn stars & XP, and sharpen your mind."}
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          "LIVE TASTE" SECTION BELOW THE FOLD (Requirement 5)
          Single real trending question, playable without picking a tier first.
          Tapping sets tier to Adults and routes into that set.
         ══════════════════════════════════════════════════════════ */}
      <section className={styles.liveTasteSection}>
        <div className={styles.tasteCard}>
          <div className={styles.tasteCardHeader}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{sampleCategory?.emoji || "🧠"}</span>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600 block">
                  ⚡ {isHindi ? "तुरंत खेलकर देखें (Live Taste)" : "Try a Question Right Now"}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  {sampleCategory?.topic || "General Knowledge"} · Set 1
                </span>
              </div>
            </div>

            <button
              onClick={handlePlayTasteSet}
              className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline"
            >
              <span>{isHindi ? "पूरा सेट खेलें" : "Play Full Set"}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <p className={styles.tasteQuestion}>{liveQuestion.text}</p>

          <div className={styles.tasteOptionsGrid}>
            {liveQuestion.options.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              const isCorrect = opt === liveQuestion.correctAnswer;
              let btnClass = styles.tasteOptionBtn;
              if (hasAnswered) {
                if (isCorrect) btnClass += ` ${styles.tasteOptionBtnCorrect}`;
                else if (isSelected) btnClass += ` ${styles.tasteOptionBtnIncorrect}`;
              }

              return (
                <button
                  key={idx}
                  onClick={() => !hasAnswered && handleLiveTasteOption(opt)}
                  className={btnClass}
                  disabled={hasAnswered}
                >
                  <span>{opt}</span>
                  {hasAnswered && isCorrect && <CheckCircle2 size={16} className="text-emerald-600" />}
                  {hasAnswered && isSelected && !isCorrect && <XCircle size={16} className="text-rose-600" />}
                </button>
              );
            })}
          </div>

          {hasAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/50 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-between"
            >
              <span>
                {selectedOption === liveQuestion.correctAnswer
                  ? (isHindi ? "🎉 सही उत्तर! आपको एडल्ट्स क्विज़ पोर्टल में ले जाया जा रहा है..." : "🎉 Correct! Uplinking to Adults Quiz Portal...")
                  : (isHindi ? `💡 सही उत्तर: ${liveQuestion.correctAnswer}. एडल्ट्स पोर्टल में ले जाया जा रहा है...` : `💡 Correct answer: ${liveQuestion.correctAnswer}. Uplinking to Adults portal...`)}
              </span>
              <ArrowRight size={14} className="animate-pulse" />
            </motion.div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          THIN FOOTER (Requirement 6)
          Fast orientation, thin links, no bottom nav
         ══════════════════════════════════════════════════════════ */}
      <footer className={styles.thinFooter}>
        <div className="flex items-center gap-2">
          <span>🧠</span>
          <span className="font-extrabold text-slate-800 dark:text-slate-200">QuizWeb</span>
          <span>© {new Date().getFullYear()}</span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span>{isHindi ? "हिन्दी और अंग्रेजी में उपलब्ध" : "Available in Hindi & English"}</span>
          <span>·</span>
          <Link href="/privacy" className="hover:underline">
            {isHindi ? "गोपनीयता" : "Privacy"}
          </Link>
          <span>·</span>
          <Link href="/terms" className="hover:underline">
            {isHindi ? "नियम" : "Terms"}
          </Link>
        </div>
      </footer>

    </div>
  );
}
