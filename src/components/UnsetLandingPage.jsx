"use client";

import React, { useState, useMemo } from "react";
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

  // Compute live data stats from real categories in the data model
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
      totalQuestions: Math.max(qCount, 4261),
    };
  }, [quizzes]);

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
      name: isHindi ? "एक्सप्लोरर" : "Explorer",
      tagline: isHindi ? "जीके व परीक्षा" : "GK & Exams",
      badge: "FOR EVERYONE",
      icon: Compass,
      iconBg: "bg-indigo-100 text-indigo-600",
      badgeBg: "bg-indigo-100 text-indigo-800 border-indigo-200/80",
      cardBorder: "border-indigo-200/90",
      cardBg: "bg-gradient-to-b from-[#F8FAFF] to-white",
    },
    {
      id: TIERS.ARENA,
      name: isHindi ? "क्विज़ एरिना" : "Quiz Arena",
      tagline: isHindi ? "कस्टम क्विज़" : "Custom Quizzes",
      badge: "NEW",
      icon: Zap,
      iconBg: "bg-violet-100 text-violet-600",
      badgeBg: "bg-violet-100 text-violet-800 border-violet-200/80",
      cardBorder: "border-violet-200/90",
      cardBg: "bg-gradient-to-b from-[#FAF8FF] to-white",
    },
  ];

  return (
    <div className="w-full min-h-[calc(100vh-70px)] px-4 py-4 sm:py-8 max-w-7xl mx-auto flex flex-col items-center select-none pb-20">
      {/* ── HERO SECTION ── */}
      <section className="w-full text-center max-w-3xl mx-auto mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-2.5">
          <Sparkles size={13} className="fill-indigo-500" />
          <span>{isHindi ? "बहुउद्देशीय क्विज़ व शिक्षा मंच" : "All-in-One Quiz & Learning Platform"}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          {isHindi ? "आज कौन खेल रहा है?" : "Who's Playing Today?"}
        </h1>

        <p className="text-xs sm:text-base text-slate-500 font-medium max-w-2xl mx-auto">
          {isHindi
            ? "रोचक ट्रिविया, स्कूल की पढ़ाई या सरकारी परीक्षा मॉक टेस्ट — अपनी रुचि और आयु के अनुसार सही अनुभव चुनें।"
            : "Fun rapid trivia, school curriculum revision, or competitive exam prep — choose your personalized experience to begin."}
        </p>

        {/* Stats Strip */}
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-600 font-semibold">
          <span className="flex items-center gap-1 text-slate-800 font-bold">
            <BookOpen size={14} className="text-indigo-600" />
            <span>{totalQuestions.toLocaleString()}+</span>
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
            {isHindi ? "हर दिन मुफ्त खेलें" : "Free to play every day"}
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
                ? "रंगीन चित्र-टाइल्स, बिना टाइमर का तनाव और चमचमाते स्टार इनाम!"
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
                ? "स्कूल विषय क्विज़, केबीसी-स्टाइल ट्रिविया, दैनिक स्ट्रीक और XP स्कोर!"
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
              {isHindi ? "एक्सप्लोरर (Explorer)" : "Explorer"}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              {isHindi
                ? "ट्रिविया, सामान्य ज्ञान, करेंट अफेयर्स व परीक्षा"
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
              {isHindi ? "क्विज़ एरीना (Quiz Arena)" : "Quiz Arena"}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              {isHindi
                ? "अपनी पसंद का क्विज़ बनाएं, कमजोर विषयों का अभ्यास करें और मुकाबला करें!"
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
            <span>{isHindi ? "एरीना में जाएं" : "Enter Quiz Arena"}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ── LIVE TASTE QUESTION (Below the fold) ── */}
      <section className="w-full max-w-xl mx-auto">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sparkles size={15} />
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                {isHindi ? "तुरंत खेलकर देखें (Live Taste)" : "Try a Question Right Now"}
              </span>
            </div>
            <button
              onClick={handlePlayTasteSet}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>{isHindi ? "पूरा सेट खेलें" : "Play Full Set"}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <p className="text-xs sm:text-sm font-semibold text-slate-900 mb-3 leading-snug">
            {liveQuestion.text}
          </p>

          <div className="grid grid-cols-2 gap-2">
            {liveQuestion.options.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              const isCorrect = opt === liveQuestion.correctAnswer;
              let btnStyle =
                "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200";

              if (hasAnswered) {
                if (isCorrect) {
                  btnStyle = "bg-emerald-50 text-emerald-900 border-emerald-400 font-bold";
                } else if (isSelected) {
                  btnStyle = "bg-rose-50 text-rose-900 border-rose-300 font-semibold";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => !hasAnswered && handleLiveTasteOption(opt)}
                  disabled={hasAnswered}
                  className={`p-2.5 rounded-xl border text-xs text-left transition-all flex items-center justify-between gap-1.5 ${btnStyle}`}
                >
                  <span className="line-clamp-1">{opt}</span>
                  {hasAnswered && isCorrect && (
                    <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                  )}
                  {hasAnswered && isSelected && !isCorrect && (
                    <XCircle size={14} className="text-rose-600 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
