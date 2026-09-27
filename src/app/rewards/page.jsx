"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Star, Sparkles, Trophy, Flame, Play, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

const STICKERS = [
  { id: "super_star", emoji: "🌟", name: "Super Star", nameHi: "सुपर स्टार", desc: "Complete any quiz with 3 stars!", unlockedDefault: true },
  { id: "rocket_kid", emoji: "🚀", name: "Space Cadet", nameHi: "अंतरिक्ष यात्री", desc: "Launch into learning!", unlockedDefault: true },
  { id: "dino_explorer", emoji: "🦖", name: "Dino Hunter", nameHi: "डायनासोर खोजकर्ता", desc: "Discover ancient facts", unlockedDefault: true },
  { id: "lion_champ", emoji: "🦁", name: "Brave Lion", nameHi: "शेर दिल", desc: "Roar through an animal quiz", unlockedDefault: false },
  { id: "color_artist", emoji: "🎨", name: "Color Wizard", nameHi: "रंगों का जादूगर", desc: "Create your own masterpiece", unlockedDefault: false },
  { id: "brainy_owl", emoji: "🦉", name: "Wise Owl", nameHi: "बुद्धिमान उल्लू", desc: "Play 5 quizzes in a row", unlockedDefault: false },
  { id: "dolphin_swimmer", emoji: "🐬", name: "Ocean Buddy", nameHi: "समुद्री मित्र", desc: "Dive deep into ocean science", unlockedDefault: false },
  { id: "golden_cup", emoji: "🏆", name: "Grand Champion", nameHi: "महा विजेता", desc: "Collect 25 stars to unlock", unlockedDefault: false },
];

export default function KidsRewardsPage() {
  const { isHindi } = useLanguage();
  const [stars, setStars] = useState(12);
  const [unlockedStickers, setUnlockedStickers] = useState(["super_star", "rocket_kid", "dino_explorer"]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedStars = localStorage.getItem("kids_stars_count");
      if (savedStars) {
        setStars(Math.max(12, parseInt(savedStars, 10) || 12));
      }
      const savedStickers = localStorage.getItem("kids_stickers_unlocked");
      if (savedStickers) {
        try {
          const parsed = JSON.parse(savedStickers);
          if (Array.isArray(parsed)) {
            setUnlockedStickers(Array.from(new Set([...unlockedStickers, ...parsed])));
          }
        } catch (e) {}
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 via-purple-50/30 to-pink-50/30 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-950 px-4 py-8 sm:py-10 pb-28">
      <div className="max-w-xl mx-auto">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>{isHindi ? "होम" : "Home"}</span>
          </Link>

          {/* Daily Streak Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black shadow-md shadow-amber-500/20">
            <Flame size={14} fill="currentColor" />
            <span>{isHindi ? "3 दिन की स्ट्रीक!" : "3 Day Streak!"}</span>
          </div>
        </div>

        {/* Hero Banner: Star Chest */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 p-6 sm:p-8 text-white shadow-xl shadow-orange-500/20 mb-8 select-none"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-amber-100/90 block mb-1">
                {isHindi ? "आपका खजाना" : "Your Treasure Chest"}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black drop-shadow-sm leading-tight">
                {isHindi ? "इनाम और स्टिकर्स" : "Rewards & Stickers"}
              </h1>
              <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-xs font-semibold">
                {isHindi
                  ? "क्विज़ खेलें और चमकदार स्टार्स व मजेदार स्टिकर्स अनलॉक करें!"
                  : "Play fun quizzes to collect shiny stars and unlock playful stickers!"}
              </p>
            </div>

            {/* Big Star Badge */}
            <div className="flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/20 backdrop-blur-md border-2 border-white/40 shadow-lg shrink-0">
              <span className="text-2xl sm:text-3xl">⭐</span>
              <span className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">{stars}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-100">
                {isHindi ? "स्टार्स" : "Stars"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Sticker Album Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
              <span>🎨</span>
              <span>{isHindi ? "स्टिकर एल्बम" : "Sticker Album"}</span>
            </h2>
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 px-2.5 py-0.5 rounded-full">
              {unlockedStickers.length} / {STICKERS.length} {isHindi ? "अनलॉक" : "Unlocked"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {STICKERS.map((sticker) => {
              const isUnlocked = unlockedStickers.includes(sticker.id);
              return (
                <motion.div
                  key={sticker.id}
                  whileHover={isUnlocked ? { scale: 1.05, y: -2 } : {}}
                  className={`relative p-4 rounded-2xl flex flex-col items-center text-center transition-all ${
                    isUnlocked
                      ? "bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-500/40 shadow-md shadow-amber-500/10"
                      : "bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 opacity-60"
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-2 select-none ${
                      isUnlocked
                        ? "bg-amber-50 dark:bg-amber-950/30"
                        : "bg-slate-200 dark:bg-slate-800 filter grayscale"
                    }`}
                  >
                    <span>{sticker.emoji}</span>
                  </div>

                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 truncate w-full mb-0.5">
                    {isHindi ? sticker.nameHi : sticker.name}
                  </h3>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                    {isUnlocked ? (isHindi ? "अनलॉक हुआ!" : "Collected!") : sticker.desc}
                  </p>

                  {isUnlocked && (
                    <span className="absolute top-2 right-2 text-xs">✨</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CTA: Play Quiz & Earn More */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl shrink-0">
              🎮
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {isHindi ? "और स्टार्स जीतें!" : "Earn More Stars!"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isHindi
                  ? "अगला मजेदार क्विज़ खेलें और नया स्टिकर अनलॉक करें।"
                  : "Play a quick 10-question quiz to unlock the next sticker badge."}
              </p>
            </div>
          </div>

          <Link
            href="/quizzes"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-600/25 active:scale-95 transition-all"
          >
            <Play size={16} fill="currentColor" />
            <span>{isHindi ? "खेलना शुरू करें" : "Start Playing"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
