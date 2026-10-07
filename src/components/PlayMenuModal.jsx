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
          "bg-indigo-50 text-indigo-700 border-indigo-200/70 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800/60",
        desc: isHindi
          ? "टाइमर और स्कोर के साथ खेलें"
          : "Timed quizzes with scores",
        href: "/quizzes",
        emoji: "🎯",
        icon: Gamepad2,
        image: "/images/play-menu/play-quiz.webp",
        actionText: isHindi ? "खेलें" : "Play",
      },
      {
        id: "daily-quiz",
        category: "quizzes",
        keyNumber: "2",
        title: isHindi ? "दैनिक क्विज़" : "Daily Quiz",
        badge: isHindi ? "रोज़ नया" : "Daily Streak",
        badgeStyle:
          "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/60",
        desc: isHindi
          ? "10 नए प्रश्न व स्ट्रीक"
          : "10 fresh daily questions",
        href: "/daily-quiz/past",
        emoji: "🔥",
        icon: Flame,
        image: "/images/play-menu/daily-quiz.webp",
        actionText: isHindi ? "शुरू करें" : "Start",
      },
      {
        id: "current-affairs",
        category: "learn",
        keyNumber: "3",
        title: isHindi ? "दैनिक करेंट अफेयर्स" : "Current Affairs",
        badge: isHindi ? "आज का GK" : "Today's News",
        badgeStyle:
          "bg-sky-50 text-sky-700 border-sky-200/70 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800/60",
        desc: isHindi
          ? "परीक्षा समसामयिकी व तथ्य"
          : "Daily news & exam GK",
        href: "/daily-current-affairs",
        emoji: "📰",
        icon: Newspaper,
        image: "/images/play-menu/current-affairs.webp",
        actionText: isHindi ? "पढ़ें" : "Read",
      },
      {
        id: "fun-facts",
        category: "learn",
        keyNumber: "4",
        title: isHindi ? "रोचक तथ्य" : "Fun Facts",
        badge: isHindi ? "3D कार्ड्स" : "3D Flip",
        badgeStyle:
          "bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/60",
        desc: isHindi
          ? "हैरान करने वाले अनोखे तथ्य"
          : "Astonishing bite-sized facts",
        href: "/fun-facts",
        emoji: "💡",
        icon: Sparkles,
        image: "/images/play-menu/fun-facts.webp",
        actionText: isHindi ? "देखें" : "Explore",
      },
      {
        id: "true-false",
        category: "quizzes",
        keyNumber: "5",
        title: isHindi ? "सही या गलत" : "True & False",
        badge: isHindi ? "रैपिड फायर" : "Rapid Fire",
        badgeStyle:
          "bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800/60",
        desc: isHindi
          ? "तेज़ गति से त्वरित फैसला"
          : "Fast true or false test",
        href: "/true-false",
        emoji: "⚡",
        icon: Zap,
        image: "/images/play-menu/true-false.webp",
        actionText: isHindi ? "रैपिड" : "Rapid",
      },
      {
        id: "my-books",
        category: "learn",
        keyNumber: "6",
        title: isHindi ? "मेरी पुस्तकें" : "My Books",
        badge: isHindi ? "ई-बुक्स" : "E-Books",
        badgeStyle:
          "bg-purple-50 text-purple-700 border-purple-200/70 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800/60",
        desc: isHindi
          ? "डिजिटल पुस्तकें व ऑडियो नोट्स"
          : "Digital books & audio notes",
        href: "/gk-book",
        emoji: "📖",
        icon: BookOpen,
        image: "/images/play-menu/my-books.webp",
        actionText: isHindi ? "खोलें" : "Open",
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
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm select-none animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="play-menu-title"
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-t-[28px] sm:rounded-3xl p-4 sm:p-5 shadow-2xl relative flex flex-col gap-3 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Simple & Clean Header */}
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Gamepad2 size={18} />
            </div>
            <div>
              <h2
                id="play-menu-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight"
              >
                {isHindi ? "गेमिंग व लर्निंग हब" : "Play & Learn Hub"}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                {isHindi
                  ? "अपनी पसंद का गेम चुनें या रैंडम रोल करें"
                  : "Choose an activity or roll random"}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playTapSound();
              onClose?.();
            }}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Clean Filter Tabs & Surprise Me Button */}
        <div className="flex items-center justify-between gap-2 py-0.5">
          {/* iOS-style Segmented Filter */}
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold">
            <button
              onClick={() => {
                playTapSound();
                setActiveTab("all");
              }}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === "all"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              {isHindi ? "सभी (6)" : "All (6)"}
            </button>
            <button
              onClick={() => {
                playTapSound();
                setActiveTab("quizzes");
              }}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === "quizzes"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              {isHindi ? "क्विज़ (3)" : "Quizzes (3)"}
            </button>
            <button
              onClick={() => {
                playTapSound();
                setActiveTab("learn");
              }}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === "learn"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              {isHindi ? "ज्ञान (3)" : "Learn (3)"}
            </button>
          </div>

          {/* Clean Surprise Me / Random Roll Button */}
          <button
            type="button"
            disabled={isSpinning}
            onClick={handleSurpriseMe}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shrink-0 ${
              isSpinning
                ? "bg-amber-100 text-amber-800 border-amber-300 animate-pulse"
                : "bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 shadow-xs active:scale-95"
            }`}
          >
            <Dices size={14} className={isSpinning ? "animate-spin" : ""} />
            <span>
              {isSpinning
                ? isHindi
                  ? "घूम रहा है..."
                  : "Rolling..."
                : isHindi
                ? "रैंडम रोल"
                : "Surprise Me"}
            </span>
          </button>
        </div>

        {/* Clean 2-Column Responsive Card Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 overflow-y-auto pr-0.5 py-1 max-h-[60vh] sm:max-h-[58vh]">
          <AnimatePresence mode="popLayout">
            {filteredFeatures.map((item) => {
              const isHighlighted = highlightedId === item.id;
              const isWinner = winnerId === item.id;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{
                    opacity: 1,
                    scale: isWinner ? 1.03 : isHighlighted ? 1.02 : 1,
                  }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
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
                    className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 overflow-hidden bg-white dark:bg-slate-900 no-underline text-inherit ${
                      isHighlighted
                        ? "border-indigo-500 ring-2 ring-indigo-500/50 shadow-md shadow-indigo-500/10"
                        : "border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 hover:shadow-md"
                    }`}
                  >
                    {/* Clean Artwork Image Banner (No dark overlay!) */}
                    <div className="relative h-24 sm:h-28 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(max-width: 640px) 50vw, 260px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Top Left Emoji Chip */}
                      <div className="absolute top-2 left-2 z-10">
                        <div className="w-6 h-6 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-xs flex items-center justify-center shadow-xs border border-white/40 dark:border-slate-700/40">
                          <span>{item.emoji}</span>
                        </div>
                      </div>

                      {/* Top Right Pastel Badge */}
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shadow-xs ${item.badgeStyle}`}
                        >
                          {item.badge}
                        </span>
                        <span className="hidden sm:inline-flex items-center justify-center w-4 h-4 rounded bg-black/40 backdrop-blur-sm text-[9px] font-mono font-medium text-white/90">
                          {item.keyNumber}
                        </span>
                      </div>

                      {/* Winner Celebration Banner */}
                      {isWinner && (
                        <div className="absolute inset-0 bg-indigo-600/90 z-20 flex flex-col items-center justify-center text-white text-center p-2">
                          <span className="text-xl">🏆</span>
                          <span className="text-xs font-bold uppercase tracking-wider">
                            {isHindi ? "चुना गया!" : "Selected!"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Clean Bottom Text Body */}
                    <div className="p-2.5 sm:p-3 flex flex-col justify-between flex-1 gap-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                          {item.title}
                        </h3>
                        <ChevronRight
                          size={14}
                          className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0"
                        />
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 font-normal">
                        {item.desc}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Clean Minimal Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span>⚡</span>
            <span>
              {isHindi
                ? "शॉर्टकट: 1-6 दबाएं या 'R' से रैंडम"
                : "Shortcut: Press 1-6 or 'R' for random"}
            </span>
          </div>

          <button
            onClick={() => {
              playTapSound();
              onClose?.();
            }}
            className="text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {isHindi ? "बंद करें (Esc)" : "Close (Esc)"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
