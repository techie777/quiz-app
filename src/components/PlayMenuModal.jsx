"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2,
  Flame,
  Newspaper,
  Sparkles,
  Zap,
  BookOpen,
  X,
  ChevronRight,
  Dices,
  Trophy,
  Compass,
  ArrowRight,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useLanguage } from "@/context/LanguageContext";
import { playTapSound, playTickerSound, playStreakSound } from "@/lib/sounds";

export default function PlayMenuModal({ isOpen, onClose }) {
  const router = useRouter();
  const { isHindi } = useLanguage();

  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'quizzes' | 'learn'
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);
  const [winnerId, setWinnerId] = useState(null);

  const playFeatures = useMemo(
    () => [
      {
        id: "play-quiz",
        category: "quizzes",
        keyNumber: "1",
        title: isHindi ? "क्विज़ खेलें" : "Play Quiz",
        badge: isHindi ? "1000+ क्विज़" : "1000+ Quizzes",
        badgeStyle:
          "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/80",
        desc: isHindi
          ? "सभी श्रेणियों में टाइमर, स्कोर और मैस्कॉट के साथ खेलें"
          : "Timed quizzes across science, history, tech & more",
        href: "/quizzes",
        emoji: "🎯",
        icon: Gamepad2,
        actionText: isHindi ? "क्विज़ शुरू करें" : "Start Quiz",
        gradient: "from-indigo-500 via-purple-500 to-pink-500",
        cardBg:
          "bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-white dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900/90",
        borderHover: "hover:border-indigo-500/80 dark:hover:border-indigo-500/80",
        activeBorder: "border-indigo-500 ring-4 ring-indigo-500/30",
        shadowColor: "shadow-indigo-500/15",
        accentColor: "text-indigo-600 dark:text-indigo-400",
        accentBg: "bg-indigo-600",
      },
      {
        id: "daily-quiz",
        category: "quizzes",
        keyNumber: "2",
        title: isHindi ? "दैनिक क्विज़" : "Daily Quiz",
        badge: isHindi ? "रोज़ाना नया" : "Daily Streak",
        badgeStyle:
          "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80",
        desc: isHindi
          ? "प्रतिदिन 10 नए प्रश्न हल करें और अपनी स्ट्रीक बनाएं"
          : "10 fresh daily questions to test your knowledge",
        href: "/daily-quiz/past",
        emoji: "🔥",
        icon: Flame,
        actionText: isHindi ? "आज का क्विज़" : "Today's Quiz",
        gradient: "from-amber-500 via-orange-500 to-rose-500",
        cardBg:
          "bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-white dark:from-amber-950/40 dark:via-orange-950/20 dark:to-slate-900/90",
        borderHover: "hover:border-amber-500/80 dark:hover:border-amber-500/80",
        activeBorder: "border-amber-500 ring-4 ring-amber-500/30",
        shadowColor: "shadow-amber-500/15",
        accentColor: "text-amber-600 dark:text-amber-400",
        accentBg: "bg-amber-600",
      },
      {
        id: "current-affairs",
        category: "learn",
        keyNumber: "3",
        title: isHindi ? "दैनिक करेंट अफेयर्स" : "Current Affairs",
        badge: isHindi ? "आज के समाचार" : "Today's News",
        badgeStyle:
          "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/80",
        desc: isHindi
          ? "प्रतियोगी परीक्षाओं के लिए दैनिक समसामयिकी व तथ्य"
          : "Daily news, national & international exam updates",
        href: "/daily-current-affairs",
        emoji: "📰",
        icon: Newspaper,
        actionText: isHindi ? "समाचार देखें" : "Read News",
        gradient: "from-blue-500 via-sky-500 to-cyan-500",
        cardBg:
          "bg-gradient-to-br from-blue-50/70 via-cyan-50/40 to-white dark:from-blue-950/40 dark:via-cyan-950/20 dark:to-slate-900/90",
        borderHover: "hover:border-blue-500/80 dark:hover:border-blue-500/80",
        activeBorder: "border-blue-500 ring-4 ring-blue-500/30",
        shadowColor: "shadow-blue-500/15",
        accentColor: "text-blue-600 dark:text-blue-400",
        accentBg: "bg-blue-600",
      },
      {
        id: "fun-facts",
        category: "learn",
        keyNumber: "4",
        title: isHindi ? "रोचक तथ्य" : "Fun Facts",
        badge: isHindi ? "3D कार्ड्स" : "3D Flip Cards",
        badgeStyle:
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80",
        desc: isHindi
          ? "3D फ्लिप कार्ड्स में ज्ञानवर्धक और हैरान करने वाले तथ्य"
          : "Bite-sized astonishing facts on tactile 3D cards",
        href: "/fun-facts",
        emoji: "💡",
        icon: Sparkles,
        actionText: isHindi ? "तथ्य एक्सप्लोर करें" : "Explore Facts",
        gradient: "from-emerald-400 via-teal-500 to-emerald-600",
        cardBg:
          "bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900/90",
        borderHover:
          "hover:border-emerald-500/80 dark:hover:border-emerald-500/80",
        activeBorder: "border-emerald-500 ring-4 ring-emerald-500/30",
        shadowColor: "shadow-emerald-500/15",
        accentColor: "text-emerald-600 dark:text-emerald-400",
        accentBg: "bg-emerald-600",
      },
      {
        id: "true-false",
        category: "quizzes",
        keyNumber: "5",
        title: isHindi ? "सही या गलत" : "True & False",
        badge: isHindi ? "रैपिड फायर" : "Rapid Fire",
        badgeStyle:
          "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/80",
        desc: isHindi
          ? "तेज़ गति से तथ्यों की सच्चाई परखें और स्कोर बढ़ाएं"
          : "Rapid-fire true or false facts challenge",
        href: "/true-false",
        emoji: "⚡",
        icon: Zap,
        actionText: isHindi ? "रैपिड टेस्ट" : "Rapid Play",
        gradient: "from-rose-500 via-pink-500 to-red-600",
        cardBg:
          "bg-gradient-to-br from-rose-50/70 via-pink-50/40 to-white dark:from-rose-950/40 dark:via-pink-950/20 dark:to-slate-900/90",
        borderHover: "hover:border-rose-500/80 dark:hover:border-rose-500/80",
        activeBorder: "border-rose-500 ring-4 ring-rose-500/30",
        shadowColor: "shadow-rose-500/15",
        accentColor: "text-rose-600 dark:text-rose-400",
        accentBg: "bg-rose-600",
      },
      {
        id: "my-books",
        category: "learn",
        keyNumber: "6",
        title: isHindi ? "मेरी पुस्तकें" : "My Books",
        badge: isHindi ? "ई-बुक्स शेल्फ" : "E-Books Shelf",
        badgeStyle:
          "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/80",
        desc: isHindi
          ? "डिजिटल सामान्य ज्ञान पुस्तकें, ऑडियो रीडर और नोट्स"
          : "Interactive GK books, smart audio reader & notes",
        href: "/gk-book",
        emoji: "📖",
        icon: BookOpen,
        actionText: isHindi ? "किताबें पढ़ें" : "Read Books",
        gradient: "from-violet-500 via-purple-600 to-indigo-700",
        cardBg:
          "bg-gradient-to-br from-purple-50/70 via-violet-50/40 to-white dark:from-purple-950/40 dark:via-violet-950/20 dark:to-slate-900/90",
        borderHover:
          "hover:border-purple-500/80 dark:hover:border-purple-500/80",
        activeBorder: "border-purple-500 ring-4 ring-purple-500/30",
        shadowColor: "shadow-purple-500/15",
        accentColor: "text-purple-600 dark:text-purple-400",
        accentBg: "bg-purple-600",
      },
    ],
    [isHindi]
  );

  const filteredFeatures = useMemo(() => {
    if (activeTab === "all") return playFeatures;
    return playFeatures.filter((f) => f.category === activeTab);
  }, [activeTab, playFeatures]);

  const handleSelectFeature = useCallback(
    (href) => {
      playTapSound();
      onClose?.();
      router.push(href);
    },
    [onClose, router]
  );

  // Surprise Me / Random Roulette Pick
  const handleSurpriseMe = useCallback(() => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWinnerId(null);
    playTapSound();

    let step = 0;
    const totalSteps = 16;
    const intervalTime = 65;

    const interval = setInterval(() => {
      step++;
      const randomIndex = Math.floor(Math.random() * playFeatures.length);
      const chosen = playFeatures[randomIndex];
      setHighlightedId(chosen.id);
      playTickerSound();

      if (step >= totalSteps) {
        clearInterval(interval);
        const finalIndex = Math.floor(Math.random() * playFeatures.length);
        const winner = playFeatures[finalIndex];
        setHighlightedId(winner.id);
        setWinnerId(winner.id);

        playStreakSound();

        try {
          confetti({
            particleCount: 75,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"],
          });
        } catch {}

        setTimeout(() => {
          setIsSpinning(false);
          handleSelectFeature(winner.href);
        }, 900);
      }
    }, intervalTime);
  }, [isSpinning, playFeatures, handleSelectFeature]);

  // Keyboard shortcut navigation (1-6, 'R' for random, 'Escape' to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose?.();
        return;
      }

      if (e.key.toLowerCase() === "r" && !isSpinning) {
        e.preventDefault();
        handleSurpriseMe();
        return;
      }

      const match = playFeatures.find((f) => f.keyNumber === e.key);
      if (match && !isSpinning) {
        e.preventDefault();
        handleSelectFeature(match.href);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSpinning, onClose, handleSelectFeature, handleSurpriseMe, playFeatures]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-md select-none animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="play-menu-title"
    >
      {/* Background Animated Gradient Aura */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-fuchsia-500/15 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ type: "spring", damping: 26, stiffness: 350 }}
        className="w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 rounded-t-[32px] sm:rounded-3xl p-4 sm:p-6 shadow-2xl shadow-slate-950/50 relative flex flex-col gap-3.5 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 pb-1 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            {/* Animated Gamepad Badge */}
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30 shrink-0">
              <span className="relative z-10">🎮</span>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900 animate-ping" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="play-menu-title"
                  className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight tracking-tight"
                >
                  {isHindi ? "गेमिंग व लर्निंग हब" : "Play & Learn Hub"}
                </h2>
                <span className="hidden xs:inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500/10 to-pink-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                  <Sparkles size={11} /> 6 MODES
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                {isHindi
                  ? "अपनी पसंद का मोड चुनें या रैंडम गेम खेलें"
                  : "Pick your favorite challenge or roll random"}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => {
              playTapSound();
              onClose?.();
            }}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 hover:rotate-90 flex items-center justify-center transition-all duration-200 shrink-0 active:scale-90"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Interactive Controls Bar: Category Tabs + Surprise Me Roulette Button */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold">
            <button
              onClick={() => {
                playTapSound();
                setActiveTab("all");
              }}
              className={`px-3 py-1.5 rounded-xl transition-all relative ${
                activeTab === "all"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {isHindi ? "🌟 सभी (6)" : "🌟 All (6)"}
            </button>
            <button
              onClick={() => {
                playTapSound();
                setActiveTab("quizzes");
              }}
              className={`px-3 py-1.5 rounded-xl transition-all relative ${
                activeTab === "quizzes"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {isHindi ? "🎯 क्विज़ (3)" : "🎯 Quizzes (3)"}
            </button>
            <button
              onClick={() => {
                playTapSound();
                setActiveTab("learn");
              }}
              className={`px-3 py-1.5 rounded-xl transition-all relative ${
                activeTab === "learn"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {isHindi ? "📚 ज्ञान (3)" : "📚 Learn (3)"}
            </button>
          </div>

          {/* Surprise Me / Random Roll Button */}
          <button
            type="button"
            disabled={isSpinning}
            onClick={handleSurpriseMe}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-black transition-all shadow-sm ${
              isSpinning
                ? "bg-amber-500 text-white animate-pulse"
                : "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white hover:brightness-110 hover:shadow-md hover:shadow-amber-500/25 active:scale-95"
            }`}
          >
            <Dices size={15} className={isSpinning ? "animate-spin" : ""} />
            <span>
              {isSpinning
                ? isHindi
                  ? "किस्मत चुन रही है..."
                  : "Rolling..."
                : isHindi
                ? "🎲 रैंडम खेलें"
                : "🎲 Surprise Me"}
            </span>
          </button>
        </div>

        {/* 3D Interactive Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 overflow-y-auto pr-1 py-1 max-h-[58vh] sm:max-h-[52vh]">
          <AnimatePresence mode="popLayout">
            {filteredFeatures.map((item) => {
              const isHighlighted = highlightedId === item.id;
              const isWinner = winnerId === item.id;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{
                    opacity: 1,
                    scale: isWinner ? 1.03 : isHighlighted ? 1.02 : 1,
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectFeature(item.href)}
                    onMouseEnter={() => playTapSound()}
                    className={`w-full text-left p-3 sm:p-3.5 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between gap-2.5 group relative overflow-hidden ${
                      isHighlighted
                        ? item.activeBorder
                        : `border-slate-200/80 dark:border-slate-800 ${item.borderHover}`
                    } ${
                      item.cardBg
                    } shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#1e293b] hover:shadow-[0_6px_0_0_#cbd5e1] dark:hover:shadow-[0_6px_0_0_#334155] active:translate-y-1 active:shadow-none`}
                  >
                    {/* Top Row: Emoji Icon + Badges */}
                    <div className="flex items-start justify-between gap-2 w-full">
                      {/* 3D Emoji Avatar */}
                      <div className="relative">
                        <div
                          className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${item.gradient} text-white flex items-center justify-center text-xl shadow-md ${item.shadowColor} shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}
                        >
                          <span className="drop-shadow-sm">{item.emoji}</span>
                        </div>
                      </div>

                      {/* Badges + Key shortcut */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${item.badgeStyle} shrink-0`}
                        >
                          {item.badge}
                        </span>
                        {/* Keyboard shortcut hint */}
                        <span className="hidden sm:inline-flex items-center justify-center w-5 h-5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 border border-slate-300/80 dark:border-slate-700">
                          {item.keyNumber}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Title & Description */}
                    <div className="min-w-0 w-full">
                      <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center justify-between">
                        <span>{item.title}</span>
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed font-normal">
                        {item.desc}
                      </p>
                    </div>

                    {/* Bottom Micro-Action: Tactile Pill Button */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between w-full">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {item.actionText}
                      </span>
                      <div
                        className={`w-7 h-7 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-gradient-to-r ${item.gradient} group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-xs group-hover:translate-x-0.5`}
                      >
                        <ChevronRight size={15} />
                      </div>
                    </div>

                    {/* Highlighted Glowing Indicator for Winner/Spinner */}
                    {isWinner && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md animate-bounce">
                        🎉 WINNER!
                      </div>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Modal Footer Tip & Keyboard Quick Hints */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-amber-500">⚡</span>
            <span>
              {isHindi
                ? "शॉर्टकट: 1-6 दबाएं या 'R' से रैंडम चुनें"
                : "Shortcut: Press 1-6 to launch, or 'R' for random"}
            </span>
          </div>

          <button
            onClick={() => {
              playTapSound();
              onClose?.();
            }}
            className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {isHindi ? "बंद करें (Esc)" : "Close (Esc)"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
