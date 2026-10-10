"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Star,
  Sparkles,
  Trophy,
  Flame,
  Play,
  ArrowLeft,
  Coins,
  Gift,
  Wallet,
  Check,
  Lock,
  Unlock,
  Zap,
  Award,
  ArrowRight,
  X,
  Share2,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { BADGES, getUnlockedBadges, getBadgeStats } from "@/lib/badgeManager";

const STICKERS = [
  { id: "super_star", emoji: "🌟", name: "Super Star", nameHi: "सुपर स्टार", desc: "Complete any quiz with 3 stars!", descHi: "किसी भी क्विज़ में 3 स्टार्स प्राप्त करें!", starsReq: 3, unlockedDefault: true },
  { id: "rocket_kid", emoji: "🚀", name: "Space Cadet", nameHi: "अंतरिक्ष यात्री", desc: "Launch into daily learning!", descHi: "दैनिक अभ्यास शुरू करें!", starsReq: 6, unlockedDefault: true },
  { id: "dino_explorer", emoji: "🦖", name: "Dino Hunter", nameHi: "डायनासोर खोजकर्ता", desc: "Discover ancient historical facts", descHi: "प्राचीन इतिहास के तथ्य खोजें", starsReq: 9, unlockedDefault: true },
  { id: "lion_champ", emoji: "🦁", name: "Brave Lion", nameHi: "शेर दिल", desc: "Roar through nature & science quizzes", descHi: "विज्ञान क्विज़ में दहाड़ें", starsReq: 12, unlockedDefault: false },
  { id: "color_artist", emoji: "🎨", name: "Color Wizard", nameHi: "रंगों का जादूगर", desc: "Create a 5-streak without mistakes", descHi: "बिना गलती 5 सवाल सही करें", starsReq: 15, unlockedDefault: false },
  { id: "brainy_owl", emoji: "🦉", name: "Wise Owl", nameHi: "बुद्धिमान उल्लू", desc: "Play 5 quizzes in a single day", descHi: "एक दिन में 5 क्विज़ खेलें", starsReq: 18, unlockedDefault: false },
  { id: "dolphin_swimmer", emoji: "🐬", name: "Ocean Buddy", nameHi: "समुद्री मित्र", desc: "Dive deep into ocean and geography", descHi: "भूगोल और महासागर विज्ञान में गोता लगाएं", starsReq: 21, unlockedDefault: false },
  { id: "golden_cup", emoji: "🏆", name: "Grand Champion", nameHi: "महा विजेता", desc: "Collect 25 stars to unlock grand badge", descHi: "25 स्टार्स इकट्ठा करके महा विजेता बनें", starsReq: 25, unlockedDefault: false },
];

export default function RewardsPage() {
  const { isHindi } = useLanguage();

  // Active Hub Tab: 'badges' | 'wallet_store' | 'stickers'
  const [activeTab, setActiveTab] = useState("badges");

  // Real stats
  const [stars, setStars] = useState(15);
  const [coins, setCoins] = useState(350);
  const [streak, setStreak] = useState(3);
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [badgeStats, setBadgeStats] = useState({});
  const [unlockedStickers, setUnlockedStickers] = useState(["super_star", "rocket_kid", "dino_explorer"]);

  // Modals
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [selectedSticker, setSelectedSticker] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. Stars
      const savedStars = localStorage.getItem("kids_stars_count");
      if (savedStars) {
        setStars(Math.max(12, parseInt(savedStars, 10) || 12));
      }

      // 2. Coins
      const savedWallet = localStorage.getItem("quizweb_guest_wallet");
      if (savedWallet) {
        try {
          const parsed = JSON.parse(savedWallet);
          if (parsed?.coinBalance !== undefined) setCoins(parsed.coinBalance);
        } catch (e) {}
      }

      // 3. Streak
      const savedStreak = localStorage.getItem("quizweb_daily_streak_v2");
      if (savedStreak) {
        setStreak(Math.max(1, parseInt(savedStreak, 10) || 1));
      }

      // 4. Badges & Stats
      const badges = getUnlockedBadges();
      const stats = getBadgeStats();
      setUnlockedBadges(badges || []);
      setBadgeStats(stats || {});

      // 5. Stickers
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

  const totalBadges = BADGES.length;
  const badgesProgress = Math.round((unlockedBadges.length / totalBadges) * 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 sm:py-10 px-4 sm:px-6 pb-28 transition-colors">
      <div className="max-w-4xl mx-auto">
        {/* Top Bar Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-xs"
          >
            <ArrowLeft size={14} />
            <span>{isHindi ? "होम" : "Home"}</span>
          </Link>

          <div className="flex items-center gap-2.5">
            {/* Quick Coin Pill linking to /wallet */}
            <Link
              href="/wallet"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-black hover:bg-amber-500/20 transition-all shadow-xs"
            >
              <Coins size={14} className="text-amber-500" />
              <span>{coins.toLocaleString()} {isHindi ? "सिक्के" : "Coins"}</span>
              <ArrowRight size={12} className="opacity-70" />
            </Link>

            {/* Streak Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-black shadow-md shadow-orange-500/20">
              <Flame size={14} fill="currentColor" />
              <span>{streak} {isHindi ? "दिन की स्ट्रीक" : "Day Streak"}</span>
            </div>
          </div>
        </div>

        {/* Hero Banner */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 sm:p-8 text-white shadow-xl shadow-indigo-600/20 mb-8 select-none"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[11px] font-black uppercase tracking-wider text-indigo-100 mb-2">
                <Sparkles size={12} />
                <span>{isHindi ? "उपलब्धियां व पुरस्कार" : "Achievements & Rewards"}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black drop-shadow-sm leading-tight">
                {isHindi ? "रिवॉर्ड्स व उपलब्धि हब" : "Rewards & Milestones Hub"}
              </h1>
              <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-md font-semibold">
                {isHindi
                  ? "क्विज़ हल करके बैज अनलॉक करें, सिक्के कमाएं और आकर्षक वाउचर्स रिडीम करें!"
                  : "Collect shiny badges, accumulate coins, and redeem brand vouchers as you learn!"}
              </p>
            </div>

            {/* 3 Mini KPI Boxes */}
            <div className="grid grid-cols-3 gap-2.5 shrink-0">
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 text-center min-w-[75px]">
                <span className="text-xl">🏆</span>
                <span className="text-base font-black mt-0.5">{unlockedBadges.length}/{totalBadges}</span>
                <span className="text-[9px] font-black uppercase text-indigo-100">{isHindi ? "बैज" : "Badges"}</span>
              </div>

              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 text-center min-w-[75px]">
                <span className="text-xl">🪙</span>
                <span className="text-base font-black mt-0.5">{coins}</span>
                <span className="text-[9px] font-black uppercase text-indigo-100">{isHindi ? "सिक्के" : "Coins"}</span>
              </div>

              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 text-center min-w-[75px]">
                <span className="text-xl">⭐</span>
                <span className="text-base font-black mt-0.5">{stars}</span>
                <span className="text-[9px] font-black uppercase text-indigo-100">{isHindi ? "स्टार्स" : "Stars"}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Modern Tab Bar */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-900 border border-slate-300/60 dark:border-slate-800 mb-8 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("badges")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all flex-1 justify-center ${
              activeTab === "badges"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Trophy size={16} />
            <span>{isHindi ? "🏆 अचीवमेंट्स व बैज" : "🏆 Badges & Milestones"}</span>
          </button>

          <button
            onClick={() => setActiveTab("wallet_store")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all flex-1 justify-center ${
              activeTab === "wallet_store"
                ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Coins size={16} />
            <span>{isHindi ? "🪙 सिक्के व वाउचर्स" : "🪙 Coins & Vouchers"}</span>
          </button>

          <button
            onClick={() => setActiveTab("stickers")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all flex-1 justify-center ${
              activeTab === "stickers"
                ? "bg-white dark:bg-slate-800 text-pink-600 dark:text-pink-400 shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Star size={16} />
            <span>{isHindi ? "🎨 किड्स स्टिकर्स" : "🎨 Fun Stickers"}</span>
          </button>
        </div>

        {/* TAB 1: BADGES & MILESTONES */}
        {activeTab === "badges" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>उपलब्धि बैज (Milestone Badges)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isHindi
                    ? `आपने ${totalBadges} में से ${unlockedBadges.length} बैज अनलॉक किए हैं (${badgesProgress}%)`
                    : `Unlocked ${unlockedBadges.length} of ${totalBadges} badges (${badgesProgress}%)`}
                </p>
              </div>

              <div className="w-24 sm:w-32 bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${badgesProgress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {BADGES.map((badge) => {
                const isUnlocked = unlockedBadges.includes(badge.id);

                return (
                  <motion.div
                    key={badge.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedBadge({ ...badge, isUnlocked })}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isUnlocked
                        ? "bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-500/40 shadow-lg shadow-amber-500/10"
                        : "bg-slate-100/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl select-none ${
                            isUnlocked
                              ? "bg-amber-100 dark:bg-amber-950/50 shadow-inner"
                              : "bg-slate-200 dark:bg-slate-800 grayscale"
                          }`}
                        >
                          {badge.icon}
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                            isUnlocked
                              ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                          }`}
                        >
                          {isUnlocked ? <Unlock size={10} /> : <Lock size={10} />}
                          <span>{isUnlocked ? (isHindi ? "अनलॉक" : "Unlocked") : (isHindi ? "लॉक्ड" : "Locked")}</span>
                        </span>
                      </div>

                      <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mb-1">
                        {isHindi && badge.titleHi ? badge.titleHi : badge.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {isHindi && badge.descHi ? badge.descHi : badge.desc}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      <span>{isHindi ? "विवरण देखें" : "View Details"}</span>
                      <ArrowRight size={12} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* TAB 2: COINS & WALLET STORE */}
        {activeTab === "wallet_store" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Coin Summary Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl shrink-0">
                  🪙
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {isHindi ? "सिक्का शेष" : "Coin Balance"}
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    {coins.toLocaleString()} <span className="text-sm font-bold text-slate-400">Coins</span>
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                    {isHindi ? `लगभग ₹${(coins * 0.01).toFixed(2)} मूल्य` : `Approx ₹${(coins * 0.01).toFixed(2)} value`}
                  </p>
                </div>
              </div>

              <Link
                href="/wallet"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-indigo-600/25 active:scale-95 transition-all"
              >
                <Wallet size={16} />
                <span>{isHindi ? "पूर्ण वॉलेट व रिडीम खोलें" : "Open Full Wallet"}</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Vouchers Teaser */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Gift size={18} className="text-indigo-600 dark:text-indigo-400" />
                  <span>{isHindi ? "उपलब्ध डिजिटल वाउचर्स" : "Available Gift Cards"}</span>
                </h3>

                <Link href="/wallet" className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline">
                  {isHindi ? "सभी वाउचर्स देखें" : "View All Vouchers"}
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🛒</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">Amazon Pay ₹50</h4>
                      <p className="text-[11px] text-slate-400">5,000 Coins Required</p>
                    </div>
                  </div>
                  <Link
                    href="/wallet"
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-xs font-black hover:bg-indigo-100 transition"
                  >
                    {isHindi ? "रिडीम" : "Redeem"}
                  </Link>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">📦</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">Flipkart ₹50</h4>
                      <p className="text-[11px] text-slate-400">5,000 Coins Required</p>
                    </div>
                  </div>
                  <Link
                    href="/wallet"
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-xs font-black hover:bg-indigo-100 transition"
                  >
                    {isHindi ? "रिडीम" : "Redeem"}
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Ways to Earn */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20">
              <h4 className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap size={14} />
                <span>{isHindi ? "त्वरित सिक्के कमाएं:" : "Quick Ways to Earn Coins:"}</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link
                  href="/daily-quiz"
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold hover:border-indigo-400 transition"
                >
                  ⚡ Daily Quiz (+50)
                </Link>
                <Link
                  href="/arena"
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold hover:border-indigo-400 transition"
                >
                  ⚔️ GK Arena Match (+75)
                </Link>
                <Link
                  href="/mock-tests"
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold hover:border-indigo-400 transition"
                >
                  📝 Mock Test (+100)
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: KIDS STICKERS ALBUM */}
        {activeTab === "stickers" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🎨 {isHindi ? "मजेदार स्टिकर एल्बम" : "Fun Sticker Album"}</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isHindi
                    ? "क्विज़ हल करके स्टार्स पाएं और नए स्टिकर्स अनलॉक करें!"
                    : "Earn stars by taking quizzes to unlock animated stickers!"}
                </p>
              </div>

              <span className="text-xs font-black text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/60 border border-pink-200 dark:border-pink-900/40 px-3 py-1 rounded-full">
                {unlockedStickers.length} / {STICKERS.length} {isHindi ? "अनलॉक" : "Unlocked"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {STICKERS.map((sticker) => {
                const isUnlocked = unlockedStickers.includes(sticker.id) || stars >= sticker.starsReq;

                return (
                  <motion.div
                    key={sticker.id}
                    whileHover={isUnlocked ? { scale: 1.05, y: -2 } : {}}
                    onClick={() => setSelectedSticker({ ...sticker, isUnlocked })}
                    className={`relative p-4 rounded-2xl flex flex-col items-center text-center transition-all cursor-pointer ${
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
                      {isUnlocked
                        ? isHindi
                          ? "अनलॉक हुआ!"
                          : "Collected!"
                        : isHindi
                        ? `${sticker.starsReq} स्टार्स चाहिए`
                        : `Needs ${sticker.starsReq} stars`}
                    </p>

                    {isUnlocked && <span className="absolute top-2 right-2 text-xs">✨</span>}
                  </motion.div>
                );
              })}
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
          </motion.div>
        )}
      </div>

      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white relative text-center"
            >
              <button
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>

              <div
                className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl mb-4 select-none ${
                  selectedBadge.isUnlocked
                    ? "bg-amber-100 dark:bg-amber-950/60 shadow-lg shadow-amber-500/20"
                    : "bg-slate-100 dark:bg-slate-800 grayscale"
                }`}
              >
                {selectedBadge.icon}
              </div>

              <h3 className="text-xl font-black mb-1">
                {isHindi && selectedBadge.titleHi ? selectedBadge.titleHi : selectedBadge.title}
              </h3>

              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider mb-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {selectedBadge.isUnlocked ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check size={14} /> {isHindi ? "उपलब्ध हुआ" : "Unlocked"}
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Lock size={14} /> {isHindi ? "प्रगति जारी है" : "In Progress"}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                {isHindi && selectedBadge.descHi ? selectedBadge.descHi : selectedBadge.desc}
              </p>

              <button
                onClick={() => setSelectedBadge(null)}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-indigo-600/30"
              >
                {isHindi ? "ठीक है" : "Awesome"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sticker Detail Modal */}
      <AnimatePresence>
        {selectedSticker && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white relative text-center"
            >
              <button
                onClick={() => setSelectedSticker(null)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>

              <div
                className={`w-24 h-24 rounded-3xl mx-auto flex items-center justify-center text-5xl mb-4 select-none ${
                  selectedSticker.isUnlocked
                    ? "bg-amber-100 dark:bg-amber-950/60 shadow-xl shadow-amber-500/20"
                    : "bg-slate-100 dark:bg-slate-800 grayscale"
                }`}
              >
                {selectedSticker.emoji}
              </div>

              <h3 className="text-xl font-black mb-1">
                {isHindi ? selectedSticker.nameHi : selectedSticker.name}
              </h3>

              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-3">
                ⭐ {selectedSticker.starsReq} {isHindi ? "स्टार्स आवश्यक" : "Stars Required"}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                {isHindi ? selectedSticker.descHi : selectedSticker.desc}
              </p>

              <button
                onClick={() => setSelectedSticker(null)}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-indigo-600/30"
              >
                {isHindi ? "बंद करें" : "Close"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
