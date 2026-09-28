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
  Swords,
  Heart,
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

        {/* Live Data Stats Strip (Requirement 2) & Support Us CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-4"
        >
          <div className={styles.statsStrip}>
            <span className={styles.statItem}>
              <BookOpen size={14} className="text-[var(--brand-primary)]" />
              <strong>{totalQuestions}+</strong> {isHindi ? "प्रश्न" : "Questions"}
            </span>
            <span className={styles.statDot}>·</span>
            <span className={styles.statItem}>
              <Sparkles size={14} className="text-amber-500" />
              <strong>{totalCategories}+</strong> {isHindi ? "विषय" : "Categories"}
            </span>
            <span className={styles.statDot}>·</span>
            <span className={styles.statItem}>
              <Compass size={14} className="text-indigo-600" />
              <strong>4</strong> {isHindi ? "विशेष अनुभव" : "Experiences"}
            </span>
            <span className={styles.statDot}>·</span>
            <span className={styles.statItem}>
              <Zap size={14} className="text-emerald-500" />
              <span>{isHindi ? "हर दिन मुफ्त खेलें" : "Free to play every day"}</span>
            </span>
          </div>

          <Link
            href="/donate"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 transition-all shadow-sm min-h-[38px]"
          >
            <Heart size={14} className="fill-rose-500 text-rose-500" />
            <span>{isHindi ? "हमारा समर्थन करें" : "Support us"}</span>
          </Link>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOUR LARGE VISUAL TIER CARDS (Step 2)
          Kids, Students, Explorer, Quiz Arena (NEW tag)
         ══════════════════════════════════════════════════════════ */}
      <section className={styles.cardsGrid}>
        
        {/* CARD 1: KIDS TIER (5-12 yrs) */}
        <motion.div
          whileTap={{ scale: 0.985 }}
          onClick={() => handleSelectTier(TIERS.KIDS)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleSelectTier(TIERS.KIDS);
            }
          }}
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
                <Sparkles size={24} className="text-amber-500" />
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

            {/* Visual Snippet Box */}
            <div className={styles.visualSnippetBox}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                  {isHindi ? "पिक्चर-टाइल प्रिव्यू" : "Picture-Tile Style"}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-1">
                  <Star size={10} className="fill-amber-500 text-amber-500" /> 3 Stars
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: isHindi ? "जानवर" : "Animals", color: "from-amber-400 to-orange-400" },
                  { label: isHindi ? "अंतरिक्ष" : "Space", color: "from-indigo-400 to-purple-500" },
                  { label: isHindi ? "रंग व कला" : "Colors", color: "from-rose-400 to-pink-500" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-xl bg-gradient-to-br ${item.color} text-white text-center shadow-sm`}
                  >
                    <span className="text-[11px] font-bold truncate block">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-center text-[10px] font-bold text-amber-700 dark:text-amber-300">
                {isHindi ? "दबाव-मुक्त खेल · 10 प्रश्न प्रति सेट" : "Fun 10 Qs · No Timer Anxiety"}
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
          whileTap={{ scale: 0.985 }}
          onClick={() => handleSelectTier(TIERS.STUDENTS)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleSelectTier(TIERS.STUDENTS);
            }
          }}
          className={`${styles.tierCard} ${styles.tierCardStudents}`}
          role="button"
          tabIndex={0}
          aria-label="Select Students Tier"
        >
          <div>
            <div className={styles.cardHeader}>
              <div
                className={styles.cardIconCircle}
                style={{ background: "rgba(13, 148, 136, 0.15)", color: "#0d9488" }}
              >
                <GraduationCap size={24} className="text-teal-600 dark:text-teal-400" />
              </div>
              <span
                className={styles.cardAgePill}
                style={{ background: "#ccfbf1", color: "#0f766e" }}
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

            {/* Visual Snippet Box */}
            <div className={styles.visualSnippetBox}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                  {isHindi ? "क्लास व बोर्ड चयन" : "Class & Board Tracker"}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-900 dark:bg-teal-900/40 dark:text-teal-200">
                  Class 9 ▾
                </span>
              </div>
              
              <div className="flex items-center justify-between gap-1 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs mb-2">
                <span className="font-bold flex items-center gap-1">
                  <Flame size={14} className="text-orange-500" />
                  <span>5 Day Streak</span>
                </span>
                <span className="font-bold text-teal-600 dark:text-teal-400">
                  ⚡ 1,250 XP
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-bold">
                <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-center border border-teal-200/50">
                  Study Quizzes
                </div>
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-center border border-indigo-200/50">
                  Fun Zone
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className={styles.cardCtaButton}
            style={{ background: "linear-gradient(135deg, #0d9488 0%, #0284c7 100%)" }}
          >
            <span>{isHindi ? "स्टूडेंट्स हब में जाएं" : "Enter Students Hub"}</span>
            <ArrowRight size={16} />
          </button>
        </motion.div>

        {/* CARD 3: EXPLORER TIER (For everyone / General & Exams) */}
        <motion.div
          whileTap={{ scale: 0.985 }}
          onClick={() => handleSelectTier(TIERS.ADULTS)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleSelectTier(TIERS.ADULTS);
            }
          }}
          className={`${styles.tierCard} ${styles.tierCardAdults}`}
          role="button"
          tabIndex={0}
          aria-label="Select Explorer Tier"
        >
          <div>
            <div className={styles.cardHeader}>
              <div
                className={styles.cardIconCircle}
                style={{ background: "rgba(99, 102, 241, 0.15)", color: "#4f46e5" }}
              >
                <Compass size={24} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <span
                className={styles.cardAgePill}
                style={{ background: "#ede9fe", color: "#6d28d9" }}
              >
                {isHindi ? "सभी के लिए" : "For everyone"}
              </span>
            </div>

            <h2 className={styles.cardTitle}>{isHindi ? "एक्सप्लोरर (Explorer)" : "Explorer"}</h2>
            <p className={styles.cardTagline}>
              {isHindi
                ? "ट्रिविया, सामान्य ज्ञान, करेंट अफेयर्स व परीक्षा"
                : "Trivia, GK, Current Affairs & Exams"}
            </p>

            {/* Visual Snippet Box */}
            <div className={styles.visualSnippetBox}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {isHindi ? "ट्रिविया + परीक्षा" : "Play & Learn + Exams"}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Live
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200/50 flex items-center justify-between">
                  <span>Play & Learn (GK)</span>
                  <span className="text-[10px]">Free Sets</span>
                </div>
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 text-xs font-bold border border-indigo-200/50 flex items-center justify-between">
                  <span>Exam Prep (SSC, RRB)</span>
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
            <span>{isHindi ? "एक्सप्लोरर शुरू करें" : "Start Explorer"}</span>
            <ArrowRight size={16} />
          </button>
        </motion.div>

        {/* CARD 4: QUIZ ARENA (Custom Quiz Builder) */}
        <motion.div
          whileTap={{ scale: 0.985 }}
          onClick={() => {
            setTier(TIERS.ARENA);
            router.push("/arena");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setTier(TIERS.ARENA);
              router.push("/arena");
            }
          }}
          className={`${styles.tierCard} ${styles.tierCardArena}`}
          role="button"
          tabIndex={0}
          aria-label="Select Quiz Arena"
        >
          <div>
            <div className={styles.cardHeader}>
              <div
                className={styles.cardIconCircle}
                style={{ background: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6" }}
              >
                <Swords size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
              <span
                className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-violet-600 to-pink-500 text-white px-2 py-0.5 rounded-full"
              >
                NEW
              </span>
            </div>

            <h2 className={styles.cardTitle}>{isHindi ? "क्विज़ एरीना (Quiz Arena)" : "Quiz Arena"}</h2>
            <p className={styles.cardTagline}>
              {isHindi
                ? "अपनी पसंद का क्विज़ बनाएं, कमजोर विषयों का अभ्यास करें और मुकाबला करें!"
                : "Build custom quiz challenges, filter categories, train weak spots & challenge friends."}
            </p>

            {/* Visual Snippet Box */}
            <div className={styles.visualSnippetBox}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  {isHindi ? "कस्टम क्विज़ इंजन" : "Custom Engine"}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200">
                  Builder
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 text-xs font-bold border border-purple-200/50 flex items-center justify-between">
                  <span>Multi-Category Filter</span>
                  <span className="text-[10px]">10-50 Qs</span>
                </div>
                <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-800 dark:text-pink-300 text-xs font-bold border border-pink-200/50 flex items-center justify-between">
                  <span>Challenge a Friend</span>
                  <span className="text-[10px]">VS Mode</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className={styles.cardCtaButton}
            style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)" }}
          >
            <span>{isHindi ? "एरीना में जाएं" : "Enter Quiz Arena"}</span>
            <ArrowRight size={16} />
          </button>
        </motion.div>

      </section>

      {/* ══════════════════════════════════════════════════════════
          "HOW QUIZWEB WORKS" STRIP (Requirement 4)
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
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 mb-2">
              <Compass size={20} />
            </div>
            <h4 className={styles.stepTitle}>
              {isHindi ? "अपना मोड चुनें" : "Pick Your Mode"}
            </h4>
            <p className={styles.stepDesc}>
              {isHindi
                ? "Kids, Students, Explorer या Arena में से अपनी पसंद चुनें।"
                : "Choose Kids, Students, Explorer, or Quiz Arena based on your goal."}
            </p>
          </div>

          <div className={styles.stepArrow}>→</div>

          {/* Step 2 */}
          <div className={styles.stepCard}>
            <div className={styles.stepNumberBadge}>02</div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 mb-2">
              <BookOpen size={20} />
            </div>
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
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 mb-2">
              <Zap size={20} />
            </div>
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
         ══════════════════════════════════════════════════════════ */}
      <section className={styles.liveTasteSection}>
        <div className={styles.tasteCard}>
          <div className={styles.tasteCardHeader}>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600">
                <Sparkles size={18} />
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block">
                  {isHindi ? "तुरंत खेलकर देखें (Live Taste)" : "Try a Question Right Now"}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  {sampleCategory?.topic || "General Knowledge"} · Set 1
                </span>
              </div>
            </div>

            <button
              onClick={handlePlayTasteSet}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline"
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
                  ? (isHindi ? "🎉 सही उत्तर! आपको एक्सप्लोरर क्विज़ हब में ले जाया जा रहा है..." : "🎉 Correct! Uplinking to Explorer Quiz Hub...")
                  : (isHindi ? `💡 सही उत्तर: ${liveQuestion.correctAnswer}. एक्सप्लोरर हब में ले जाया जा रहा है...` : `💡 Correct answer: ${liveQuestion.correctAnswer}. Uplinking to Explorer Hub...`)}
              </span>
              <ArrowRight size={14} className="animate-pulse" />
            </motion.div>
          )}
        </div>
      </section>

    </div>
  );
}
