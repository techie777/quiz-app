"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Compass,
  GraduationCap,
  Zap,
  Heart,
  Star,
  Flame,
  Swords,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useTier, TIERS } from "@/context/TierContext";
import { useLanguage } from "@/context/LanguageContext";
import { useData } from "@/context/DataContext";

export default function UnsetLandingPage() {
  const router = useRouter();
  const { setTier } = useTier();
  const { isHindi } = useLanguage();
  const { quizzes } = useData();

  // Dynamic live stats fetched from database / admin stats API
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

  // Compute live data stats with priority to live database / public stats API
  const { totalQuestions, totalCategories } = useMemo(() => {
    if (liveStats && typeof liveStats.totalQuestions === "number") {
      return {
        totalQuestions: liveStats.totalQuestions,
        totalCategories: liveStats.totalCategories || 44,
      };
    }

    const activeCats = Array.isArray(quizzes)
      ? quizzes.filter((c) => !c.hidden)
      : [];
    const mainCats = activeCats.filter((c) => !c.parentId);
    const catCount = mainCats.length > 0 ? mainCats.length : 44;
    const qCount = mainCats.reduce(
      (acc, c) => acc + (c.questionCount ?? c.questions?.length ?? 0),
      0
    );

    return {
      totalCategories: catCount,
      totalQuestions: qCount,
    };
  }, [liveStats, quizzes]);

  // Handler for tier selection
  const handleSelectTier = (tierId) => {
    if (tierId === TIERS.ARENA) {
      setTier(TIERS.ARENA);
      router.push("/arena");
      return;
    }
    setTier(tierId);
  };

  // Find a real category with question for the compact "Live Taste" section
  const sampleCategory = useMemo(() => {
    if (!quizzes || !Array.isArray(quizzes) || quizzes.length === 0) {
      return null;
    }
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

  // 4 experiences configurations for Mobile 2x2 Tiles
  const MOBILE_TILES = [
    {
      id: TIERS.KIDS,
      name: isHindi ? "बच्चे" : "Kids",
      tagline: isHindi ? "आयु 5–12 वर्ष" : "Ages 5–12",
      badge: "AGE 5–12",
      icon: Sparkles,
      iconBg: "bg-amber-100 text-amber-600",
      badgeBg: "bg-amber-100 text-amber-800 border-amber-200/80",
      cardBorder: "border-amber-200/90",
      cardBg: "bg-gradient-to-b from-[#FFFDF7] to-white",
    },
    {
      id: TIERS.STUDENTS,
      name: isHindi ? "विद्यार्थी" : "Students",
      tagline: isHindi ? "कक्षा 6–12" : "Class 6–12",
      badge: "CLASS 6–12",
      icon: GraduationCap,
      iconBg: "bg-teal-100 text-teal-700",
      badgeBg: "bg-teal-100 text-teal-800 border-teal-200/80",
      cardBorder: "border-teal-200/90",
      cardBg: "bg-gradient-to-b from-[#F7FFFD] to-white",
    },
    {
      id: TIERS.ADULTS,
      name: isHindi ? "सामान्य ज्ञान" : "GK Hub",
      tagline: isHindi ? "40+ और भी अन्य क्विज़" : "40+ More Quizzes",
      badge: "POPULAR",
      icon: Compass,
      iconBg: "bg-indigo-100 text-indigo-600",
      badgeBg: "bg-indigo-100 text-indigo-800 border-indigo-200/80",
      cardBorder: "border-indigo-200/90",
      cardBg: "bg-gradient-to-b from-[#F8FAFF] to-white",
    },
    {
      id: TIERS.ARENA,
      name: isHindi ? "GK टेस्ट इंजन" : "GK Test Engine",
      tagline: isHindi ? "कस्टम टेस्ट अभ्यास" : "Custom Test Engine",
      badge: "NEW",
      icon: Zap,
      iconBg: "bg-violet-100 text-violet-600",
      badgeBg: "bg-violet-100 text-violet-800 border-violet-200/80",
      cardBorder: "border-violet-200/90",
      cardBg: "bg-gradient-to-b from-[#FAF8FF] to-white",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#e8f3fc] via-[#edf6fd] to-[#e4f1fc] dark:from-[#090e20] dark:via-[#0b132b] dark:to-[#030712] relative overflow-hidden">
      {/* Peaceful Ambient Sky-Blue Aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-gradient-to-b from-sky-200/40 via-blue-100/20 to-transparent blur-3xl pointer-events-none -z-0 dark:from-sky-900/15" />

      <div className="w-full min-h-[calc(100vh-70px)] px-4 py-4 sm:py-8 max-w-7xl mx-auto flex flex-col items-center select-none pb-20 relative z-10">
      {/* ── HERO SECTION ── */}
      <section className="w-full text-center max-w-3xl mx-auto mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2.5 shadow-2xs">
          <Sparkles size={13} className="fill-amber-500" />
          <span>{isHindi ? "🇮🇳 भारत का अपना निःशुल्क ज्ञान व क्विज़ मंच · 100% मुफ्त" : "India's Free Knowledge & Quiz Platform"}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          {isHindi ? "सपनों को दें ज्ञान की उड़ान, हर दिन कुछ नया सीखें" : "Empowering Every Learner, Every Dream"}
        </h1>

        <p className="text-xs sm:text-base text-slate-600 dark:text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
          {isHindi
            ? "गाँव हो या शहर, स्कूल की पढ़ाई हो या प्रतियोगी परीक्षा का सपना — यहाँ हर दिन 10 मिनट का अभ्यास आपके भविष्य को नई दिशा दे सकता है।"
            : "From school curriculum to competitive exams and lifelong curiosity — choose your personalized experience and learn for free every day."}
        </p>

        {/* Emotional Motivation Strip */}
        <div className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 italic">
          {isHindi ? "✨ \"यहाँ हर सवाल सिर्फ एक प्रश्न नहीं, आपके सपनों को सच करने की एक मजबूत सीढ़ी है।\"" : "✨ Knowledge is the key to unlocking your true potential."}
        </div>

        {/* Stats Strip */}
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-600 font-semibold">
          <span className="flex items-center gap-1 text-slate-800 font-bold">
            <BookOpen size={14} className="text-indigo-600" />
            <span>{totalQuestions > 0 ? `${totalQuestions.toLocaleString()}+` : "0"}</span>
            <span className="text-slate-500 font-normal">{isHindi ? "प्रश्न" : "Questions"}</span>
          </span>
          <span className="text-slate-300">·</span>
          <span className="flex items-center gap-1 text-slate-800 font-bold">
            <Sparkles size={14} className="text-amber-500" />
            <span>{totalCategories}+</span>
            <span className="text-slate-500 font-normal">{isHindi ? "विषय" : "Categories"}</span>
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 font-bold text-xs">
            {isHindi ? "हर दिन 100% मुफ्त" : "Free to play every day"}
          </span>
          <span className="text-slate-300">·</span>
          <Link
            href="/donate"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200/80 hover:bg-rose-100 transition-colors shadow-2xs"
          >
            <Heart size={13} className="fill-rose-500 text-rose-500" />
            <span>{isHindi ? "हमारा समर्थन करें" : "Support us"}</span>
          </Link>
        </div>
      </section>

      {/* ── MOBILE VIEW: 2×2 TILE GRID (< 768px) ── */}
      <section className="w-full max-w-lg mx-auto mb-6 block md:hidden">
        <div className="grid grid-cols-2 gap-3">
          {MOBILE_TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <motion.div
                key={tile.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelectTier(tile.id)}
                role="button"
                tabIndex={0}
                className={`relative h-[142px] p-3.5 rounded-2xl border ${tile.cardBorder} ${tile.cardBg} shadow-sm flex flex-col justify-between items-start text-left cursor-pointer transition-all`}
              >
                <div className="w-full flex items-center justify-between">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${tile.iconBg}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${tile.badgeBg}`}
                  >
                    {tile.badge}
                  </span>
                </div>

                <div>
                  <h2 className="text-base font-black text-slate-900 leading-tight">
                    {tile.name}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">
                    {tile.tagline}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── DESKTOP VIEW: 4 RICH VISUAL TIER CARDS (>= 768px) ── */}
      <section className="w-full hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {/* CARD 1: KIDS TIER */}
        <div
          onClick={() => handleSelectTier(TIERS.KIDS)}
          className="group relative rounded-3xl p-6 bg-white border-2 border-amber-400/50 hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-200 flex flex-col justify-between cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                <Sparkles size={24} className="text-amber-500" />
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200/80">
                {isHindi ? "आयु 5-12 वर्ष" : "Age 5–12"}
              </span>
            </div>

            <h2 className="text-xl font-black text-slate-900 mb-1.5">
              {isHindi ? "बच्चे (Kids)" : "Kids"}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              {isHindi
                ? "नन्हे कदमों की पहली उड़ान — रंगीन चित्र-टाइल्स, बिना टाइमर का तनाव और चमचमाते स्टार इनाम!"
                : "Playful picture-tiles, 10-question sets, zero timer pressure & star stickers."}
            </p>

            {/* Visual Snippet Box */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-amber-700">
                  {isHindi ? "पिक्चर-टाइल प्रिव्यू" : "Picture-Tile Style"}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-1">
                  <Star size={10} className="fill-amber-500 text-amber-500" /> 3 Stars
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {[
                  { label: isHindi ? "जानवर" : "Animals", color: "from-amber-400 to-orange-400" },
                  { label: isHindi ? "अंतरिक्ष" : "Space", color: "from-indigo-400 to-purple-500" },
                  { label: isHindi ? "रंग व कला" : "Colors", color: "from-rose-400 to-pink-500" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`py-1.5 px-1 rounded-lg bg-gradient-to-br ${item.color} text-white text-center text-[10.5px] font-bold shadow-xs`}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
              <div className="text-center text-[10px] font-bold text-amber-800">
                {isHindi ? "दबाव-मुक्त खेल · 10 प्रश्न प्रति सेट" : "Fun 10 Qs · No Timer Anxiety"}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 group-hover:gap-3 transition-all"
          >
            <span>{isHindi ? "किड्स मोड शुरू करें" : "Start Kids Zone"}</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* CARD 2: STUDENTS TIER */}
        <div
          onClick={() => handleSelectTier(TIERS.STUDENTS)}
          className="group relative rounded-3xl p-6 bg-white border-2 border-teal-400/50 hover:border-teal-500 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-200 flex flex-col justify-between cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shadow-xs">
                <GraduationCap size={24} className="text-teal-600" />
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-100 text-teal-900 border border-teal-200/80">
                {isHindi ? "कक्षा 6-12 · छात्र" : "Class 6–12"}
              </span>
            </div>

            <h2 className="text-xl font-black text-slate-900 mb-1.5">
              {isHindi ? "विद्यार्थी (Students)" : "Students"}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              {isHindi
                ? "मेहनत से संवरेगा आपका कल — स्कूल पाठ्यक्रम, बोर्ड परीक्षा रिवीज़न, दैनिक स्ट्रीक और आत्मविश्वास!"
                : "Curriculum revision, KBC trivia, daily study streaks & XP progression."}
            </p>

            {/* Visual Snippet Box */}
            <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/60 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-teal-800">
                  {isHindi ? "क्लास व बोर्ड चयन" : "Class & Board Tracker"}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-900">
                  Class 9 ▾
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 p-2 rounded-xl bg-white border border-teal-100 text-xs mb-2">
                <span className="font-bold flex items-center gap-1 text-slate-800">
                  <Flame size={14} className="text-orange-500" />
                  <span>5 Day Streak</span>
                </span>
                <span className="font-bold text-teal-700">⚡ 1,250 XP</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-bold">
                <div className="p-1.5 rounded-lg bg-teal-100/70 text-teal-800 text-center">
                  Study Quizzes
                </div>
                <div className="p-1.5 rounded-lg bg-indigo-100/70 text-indigo-800 text-center">
                  Fun Zone
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white font-bold text-sm shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 group-hover:gap-3 transition-all"
          >
            <span>{isHindi ? "स्टूडेंट्स हब में जाएं" : "Enter Students Hub"}</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* CARD 3: EXPLORER TIER */}
        <div
          onClick={() => handleSelectTier(TIERS.ADULTS)}
          className="group relative rounded-3xl p-6 bg-white border-2 border-indigo-400/50 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-200 flex flex-col justify-between cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
                <Compass size={24} className="text-indigo-600" />
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200/80">
                {isHindi ? "सभी के लिए" : "For everyone"}
              </span>
            </div>

            <h2 className="text-xl font-black text-slate-900 mb-1.5">
              {isHindi ? "सामान्य ज्ञान (GK Hub)" : "Explorer (GK)"}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              {isHindi
                ? "सपनों की सरकारी नौकरी और संपूर्ण ज्ञान — SSC, रेलवे, राज्य परीक्षाओं और ज्ञान संवर्धन का सच्चा साथी!"
                : "Trivia, GK, Current Affairs & Exam Series"}
            </p>

            {/* Visual Snippet Box */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/60 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-indigo-800">
                  {isHindi ? "ट्रिविया + परीक्षा" : "Play & Learn + Exams"}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Live
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="p-2 rounded-xl bg-white border border-indigo-100 text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Play & Learn (GK)</span>
                  <span className="text-[10px] text-emerald-600 font-extrabold">Free Sets</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-indigo-100 text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Exam Prep (SSC, RRB)</span>
                  <span className="text-[10px] text-indigo-600 font-extrabold">Mocks</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 group-hover:gap-3 transition-all"
          >
            <span>{isHindi ? "एक्सप्लोरर शुरू करें" : "Start Explorer"}</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* CARD 4: QUIZ ARENA */}
        <div
          onClick={() => {
            setTier(TIERS.ARENA);
            router.push("/arena");
          }}
          className="group relative rounded-3xl p-6 bg-white border-2 border-violet-400/50 hover:border-violet-500 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-200 flex flex-col justify-between cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center shadow-xs">
                <Zap size={24} className="fill-violet-600 text-violet-600" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-600 to-pink-500 text-white shadow-xs">
                NEW
              </span>
            </div>

            <h2 className="text-xl font-black text-slate-900 mb-1.5">
              {isHindi ? "GK टेस्ट इंजन" : "GK Test Engine"}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              {isHindi
                ? "कस्टम क्विज़ इंजन — विषय, कठिनाई व टाइमर चुनकर लगातार प्रश्नों का असीमित अभ्यास करें!"
                : "Build custom quiz challenges, filter categories, train weak spots & challenge friends."}
            </p>

            {/* Visual Snippet Box */}
            <div className="p-3.5 rounded-2xl bg-violet-50/70 border border-violet-200/60 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-violet-800">
                  {isHindi ? "कस्टम क्विज़ इंजन" : "Custom Engine"}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-900">
                  Builder
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="p-2 rounded-xl bg-white border border-violet-100 text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Multi-Category Filter</span>
                  <span className="text-[10px] text-violet-600 font-extrabold">10-50 Qs</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-violet-100 text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Challenge a Friend</span>
                  <span className="text-[10px] text-pink-600 font-extrabold">VS Mode</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white font-bold text-sm shadow-md shadow-violet-500/20 flex items-center justify-center gap-2 group-hover:gap-3 transition-all"
          >
            <span>{isHindi ? "GK टेस्ट इंजन शुरू करें" : "Start GK Test Engine"}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ── 5TH LAYER: INDIA GK DIGITAL BOOK BANNER & ACCESSIBILITY ── */}
      <section className="w-full max-w-5xl mx-auto mt-2 mb-8">
        <div className="relative overflow-hidden rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white border-2 border-indigo-500/40 shadow-xl shadow-indigo-950/40">
          {/* Decorative ambient background glows */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left Content */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-amber-300 text-xs font-black uppercase tracking-wider mb-3">
                <span>📖 {isHindi ? "डिजिटल बुक प्लेटफ़ॉर्म" : "Digital Book Hub"}</span>
                <span>·</span>
                <span className="text-emerald-400 font-extrabold">{isHindi ? "नया फ़ीचर (NEW)" : "NEW FEATURE"}</span>
              </div>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight mb-2">
                {isHindi
                  ? "India GK: आपकी हर जरूरत के लिए डिजिटल बुक"
                  : "India GK: A Digital Book For All Your Needs"}
              </h2>

              <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed mb-4 max-w-xl">
                {isHindi
                  ? "अध्याय दर अध्याय संरचित अध्ययन, संक्षिप्त (Quick Revision) व विस्तृत (Deep Study) पठन, और हर पृष्ठ के अंत में स्व-निहित अभ्यास क्विज़।"
                  : "Chapter-by-chapter structured learning with Short & Full reading modes and interactive self-contained quiz cards on every page."}
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-5 text-[11px] font-bold text-indigo-100">
                <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 backdrop-blur-xs">
                  ⚡ {isHindi ? "संक्षिप्त व विस्तृत मोड" : "Short & Full Modes"}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 backdrop-blur-xs">
                  🎯 {isHindi ? "हर पृष्ठ पर क्विज़ कार्ड" : "Page Quiz Cards"}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                  ✓ {isHindi ? "100% मुफ्त पठन" : "100% Free Access"}
                </span>
              </div>

              {/* CTA & Chapter Dropdown */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href="/gk-book/sindhu-ghati"
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  <span>{isHindi ? "किताब पढ़ना शुरू करें" : "Read Digital Book"}</span>
                  <ArrowRight size={16} />
                </Link>

                {/* Chapter Dropdown Quick Jump */}
                <div className="relative">
                  <select
                    className="w-full sm:w-auto px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-semibold outline-none cursor-pointer backdrop-blur-xs transition-colors"
                    onChange={(e) => {
                      if (e.target.value) {
                        router.push(e.target.value);
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled className="bg-slate-900 text-slate-400">
                      {isHindi ? "▼ सीधे पुस्तक या अध्याय पर जाएं..." : "▼ Jump to Book or Chapter..."}
                    </option>
                    <option value="/gk-book" className="bg-slate-900 text-amber-300 font-bold">
                      📚 {isHindi ? "मेरी डिजिटल पुस्तकें (सभी पुस्तकें)" : "My Bookshelf (All Books)"}
                    </option>
                    <option value="/gk-book/sindhu-ghati" className="bg-slate-900 text-white">
                      🇮🇳 1. India GK: सिंधु घाटी सभ्यता (Live)
                    </option>
                    <option value="/gk-book?book=world-gk&chapter=solar-system&page=1" className="bg-slate-900 text-white">
                      🌍 2. World GK: सौरमंडल एवं ब्रह्मांड (Live)
                    </option>
                    <option value="/gk-book?book=mp-gk" className="bg-slate-900 text-slate-300">
                      🏛️ 3. MP GK: मध्य प्रदेश सामान्य ज्ञान (Upcoming)
                    </option>
                    <option value="/gk-book?book=up-gk" className="bg-slate-900 text-slate-300">
                      🏛️ 4. UP GK: उत्तर प्रदेश सामान्य ज्ञान (Upcoming)
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Book Cover Thumbnail Preview */}
            <div className="w-36 sm:w-44 flex-shrink-0 group perspective">
              <Link href="/gk-book/sindhu-ghati" className="block relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border-2 border-indigo-400/40 transform group-hover:scale-105 group-hover:-rotate-1 transition-all duration-300 aspect-[3/4] bg-slate-800">
                  <img
                    src="/images/gk-book/india-gk-cover.jpg"
                    alt="India GK Digital Book Cover"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400 text-slate-950 shadow-xs">
                      {isHindi ? "लाइव पढ़ें" : "Read Live"}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
