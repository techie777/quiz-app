"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  Play,
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
          "bg-indigo-600/90 text-white border-indigo-400/50 shadow-xs",
        desc: isHindi
          ? "टाइमर और स्कोर के साथ खेलें"
          : "Timed quizzes with scores",
        href: "/quizzes",
        emoji: "🎯",
        icon: Gamepad2,
        image: "/images/play-menu/play-quiz.webp",
        actionText: isHindi ? "खेलें" : "Play",
        gradient: "from-indigo-500 via-purple-500 to-pink-500",
        activeBorder: "border-indigo-500 ring-4 ring-indigo-500/40",
        shadowColor: "shadow-indigo-500/20",
        accentColor: "text-indigo-600 dark:text-indigo-400",
      },
      {
        id: "daily-quiz",
        category: "quizzes",
        keyNumber: "2",
        title: isHindi ? "दैनिक क्विज़" : "Daily Quiz",
        badge: isHindi ? "रोज़ नया" : "Daily Streak",
        badgeStyle:
          "bg-amber-600/90 text-white border-amber-400/50 shadow-xs",
        desc: isHindi
          ? "10 नए प्रश्न व स्ट्रीक"
          : "10 fresh daily questions",
        href: "/daily-quiz/past",
        emoji: "🔥",
        icon: Flame,
        image: "/images/play-menu/daily-quiz.webp",
        actionText: isHindi ? "शुरू करें" : "Start",
        gradient: "from-amber-500 via-orange-500 to-rose-500",
        activeBorder: "border-amber-500 ring-4 ring-amber-500/40",
        shadowColor: "shadow-amber-500/20",
        accentColor: "text-amber-600 dark:text-amber-400",
      },
      {
        id: "current-affairs",
        category: "learn",
        keyNumber: "3",
        title: isHindi ? "दैनिक करेंट अफेयर्स" : "Current Affairs",
        badge: isHindi ? "आज का GK" : "Today's News",
        badgeStyle:
          "bg-blue-600/90 text-white border-blue-400/50 shadow-xs",
        desc: isHindi
          ? "परीक्षा समसामयिकी व तथ्य"
          : "Daily news & exam GK",
        href: "/daily-current-affairs",
        emoji: "📰",
        icon: Newspaper,
        image: "/images/play-menu/current-affairs.webp",
        actionText: isHindi ? "पढ़ें" : "Read",
        gradient: "from-blue-500 via-sky-500 to-cyan-500",
        activeBorder: "border-blue-500 ring-4 ring-blue-500/40",
        shadowColor: "shadow-blue-500/20",
        accentColor: "text-blue-600 dark:text-blue-400",
      },
      {
        id: "fun-facts",
        category: "learn",
        keyNumber: "4",
        title: isHindi ? "रोचक तथ्य" : "Fun Facts",
        badge: isHindi ? "3D कार्ड्स" : "3D Flip",
        badgeStyle:
          "bg-emerald-600/90 text-white border-emerald-400/50 shadow-xs",
        desc: isHindi
          ? "हैरान करने वाले अनोखे तथ्य"
          : "Astonishing bite-sized facts",
        href: "/fun-facts",
        emoji: "💡",
        icon: Sparkles,
        image: "/images/play-menu/fun-facts.webp",
        actionText: isHindi ? "देखें" : "Explore",
        gradient: "from-emerald-400 via-teal-500 to-emerald-600",
        activeBorder: "border-emerald-500 ring-4 ring-emerald-500/40",
        shadowColor: "shadow-emerald-500/20",
        accentColor: "text-emerald-600 dark:text-emerald-400",
      },
      {
        id: "true-false",
        category: "quizzes",
        keyNumber: "5",
        title: isHindi ? "सही या गलत" : "True & False",
        badge: isHindi ? "रैपिड फायर" : "Rapid Fire",
        badgeStyle:
          "bg-rose-600/90 text-white border-rose-400/50 shadow-xs",
        desc: isHindi
          ? "तेज़ गति से त्वरित फैसला"
          : "Fast true or false test",
        href: "/true-false",
        emoji: "⚡",
        icon: Zap,
        image: "/images/play-menu/true-false.webp",
        actionText: isHindi ? "रैपिड" : "Rapid",
        gradient: "from-rose-500 via-pink-500 to-red-600",
        activeBorder: "border-rose-500 ring-4 ring-rose-500/40",
        shadowColor: "shadow-rose-500/20",
        accentColor: "text-rose-600 dark:text-rose-400",
      },
      {
        id: "my-books",
        category: "learn",
        keyNumber: "6",
        title: isHindi ? "मेरी पुस्तकें" : "My Books",
        badge: isHindi ? "ई-बुक्स" : "E-Books",
        badgeStyle:
          "bg-purple-600/90 text-white border-purple-400/50 shadow-xs",
        desc: isHindi
          ? "ऑडियो रीडर व नोट्स"
          : "Digital books & audio reader",
        href: "/gk-book",
        emoji: "📖",
        icon: BookOpen,
        image: "/images/play-menu/my-books.webp",
        actionText: isHindi ? "खोलें" : "Open",
        gradient: "from-violet-500 via-purple-600 to-indigo-700",
        activeBorder: "border-purple-500 ring-4 ring-purple-500/40",
        shadowColor: "shadow-purple-500/20",
        accentColor: "text-purple-600 dark:text-purple-400",
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
            particleCount: 80,
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

  // Keyboard shortcuts (1-6, 'R' for random, 'Escape' to close)
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

  // Pre-warm routes when modal is open for zero-delay navigation
  useEffect(() => {
    if (isOpen) {
      playFeatures.forEach((item) => {
        try {
          router.prefetch(item.href);
        } catch {}
      });
    }
  }, [isOpen, playFeatures, router]);

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
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md select-none animate-in fade-in duration-200"
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
        initial={{ opacity: 0, y: 35, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 25, scale: 0.95 }}
        transition={{ type: "spring", damping: 26, stiffness: 350 }}
        className="w-full max-w-xl max-h-[94vh] sm:max-h-[90vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 rounded-t-[32px] sm:rounded-3xl p-3.5 sm:p-5 shadow-2xl shadow-slate-950/50 relative flex flex-col gap-3 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2.5 pb-1 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            {/* Animated Gamepad Badge */}
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center text-lg sm:text-xl shadow-md shadow-indigo-500/30 shrink-0">
              <span className="relative z-10">🎮</span>
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900 animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h2
                  id="play-menu-title"
                  className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight tracking-tight"
                >
                  {isHindi ? "गेमिंग व लर्निंग हब" : "Play & Learn Hub"}
                </h2>
                <span className="hidden xs:inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500/10 to-pink-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                  <Sparkles size={10} /> 6 MODES
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.2 font-medium">
                {isHindi
                  ? "अपनी पसंद का गेम चुनें या रैंडम रोल करें"
                  : "Choose your game mode or roll random"}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => {
              playTapSound();
              onClose?.();
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 hover:rotate-90 flex items-center justify-center transition-all duration-200 shrink-0 active:scale-90"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Interactive Controls Bar: Category Tabs + Surprise Me Roulette Button */}
        <div className="flex items-center justify-between gap-1.5 flex-nowrap overflow-x-auto no-scrollbar py-0.5">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-[11px] font-bold shrink-0">
            <button
              onClick={() => {
                playTapSound();
                setActiveTab("all");
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeTab === "all"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-black"
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
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeTab === "quizzes"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-black"
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
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeTab === "learn"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-black"
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
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black transition-all shadow-xs shrink-0 ${
              isSpinning
                ? "bg-amber-500 text-white animate-pulse"
                : "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white hover:brightness-110 hover:shadow-md hover:shadow-amber-500/25 active:scale-95"
            }`}
          >
            <Dices size={14} className={isSpinning ? "animate-spin" : ""} />
            <span>
              {isSpinning
                ? isHindi
                  ? "घूम रहा है..."
                  : "Rolling..."
                : isHindi
                ? "🎲 रैंडम खेलें"
                : "🎲 Surprise Me"}
            </span>
          </button>
        </div>

        {/* 2x2 Responsive Visual Tiles Grid (Strict 2 columns across all screens) */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 overflow-y-auto pr-1 py-1 max-h-[64vh] sm:max-h-[60vh]">
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
                    scale: isWinner ? 1.04 : isHighlighted ? 1.02 : 1,
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    href={item.href}
                    prefetch={true}
                    onClick={(e) => {
                      if (isSpinning) {
                        e.preventDefault();
                        return;
                      }
                      playTapSound();
                      onClose?.();
                    }}
                    onMouseEnter={() => playTapSound()}
                    className={`w-full text-left rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between group relative overflow-hidden bg-white dark:bg-slate-900 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#1e293b] hover:shadow-[0_6px_0_0_#cbd5e1] dark:hover:shadow-[0_6px_0_0_#334155] active:translate-y-1 active:shadow-none no-underline text-inherit ${
                      isHighlighted
                        ? item.activeBorder
                        : "border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500"
                    }`}
                  >
                    {/* Top Tile Image Artwork */}
                    <div className="relative h-24 sm:h-28 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(max-width: 640px) 50vw, 280px"
                        className="object-cover group-hover:scale-108 transition-transform duration-300"
                      />
                      {/* Gradient Overlay for Contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-black/20" />

                      {/* Top Badges over image */}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                        {/* 3D Emoji Avatar */}
                        <div className="w-7 h-7 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-sm flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-6 transition-transform">
                          <span>{item.emoji}</span>
                        </div>
                      </div>

                      <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${item.badgeStyle}`}
                        >
                          {item.badge}
                        </span>
                        {/* Keyboard shortcut hint on desktop */}
                        <span className="hidden sm:inline-flex items-center justify-center w-4 h-4 rounded bg-black/60 backdrop-blur-md text-[9px] font-mono font-bold text-white/90 border border-white/20">
                          {item.keyNumber}
                        </span>
                      </div>

                      {/* Winner Celebration Banner */}
                      {isWinner && (
                        <div className="absolute inset-0 bg-amber-500/90 z-20 flex flex-col items-center justify-center text-white text-center p-2 animate-bounce">
                          <span className="text-xl">🏆</span>
                          <span className="text-xs font-black uppercase tracking-wider">
                            WINNER!
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Tile Text & Action Bar */}
                    <div className="p-2.5 sm:p-3 flex flex-col justify-between flex-1 w-full gap-1.5 bg-white dark:bg-slate-900">
                      <div>
                        <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                          {item.title}
                        </h3>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-medium">
                          {item.desc}
                        </p>
                      </div>

                      {/* Micro Action Button */}
                      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between w-full">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          {item.actionText}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-gradient-to-r ${item.gradient} group-hover:text-white flex items-center justify-center transition-all duration-200 group-hover:translate-x-0.5`}
                        >
                          <ChevronRight size={12} />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px]">
            <span className="text-amber-500">⚡</span>
            <span>
              {isHindi
                ? "शॉर्टकट: 1-6 दबाएं या 'R' से रैंडम चुनें"
                : "Shortcut: Press 1-6 or 'R' for random"}
            </span>
          </div>

          <button
            onClick={() => {
              playTapSound();
              onClose?.();
            }}
            className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {isHindi ? "बंद करें (Esc)" : "Close (Esc)"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
