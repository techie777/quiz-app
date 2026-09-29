"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Clock, Sparkles, X, Play, Crown, ArrowRight, ShieldCheck, Tv } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTier } from "@/context/TierContext";
import { useEntitlement } from "@/context/EntitlementContext";

export default function LockedSetBottomSheet({ onStartSet }) {
  const router = useRouter();
  const { isHindi } = useLanguage();
  const { tier } = useTier();
  const {
    lockedSheetOpen,
    lockedSet,
    closeLockedSheet,
    countdownFormatted,
    countdownFormattedHi,
    canWatchAd,
    unlockViaAd,
    freeSetsPerWindow,
    loading,
  } = useEntitlement();

  const [watchingAd, setWatchingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);

  if (!lockedSheetOpen || !lockedSet) return null;

  const setIndex = lockedSet.index || 1;
  const isKidsOrStudents = tier === "kids" || tier === "students";
  const displayCountdown = isHindi ? countdownFormattedHi : countdownFormatted;

  const handleWatchAd = async () => {
    setWatchingAd(true);
    setAdCountdown(5);

    const interval = setInterval(() => {
      setAdCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setWatchingAd(false);
          unlockViaAd(lockedSet).then((success) => {
            if (success && onStartSet) {
              onStartSet(lockedSet);
            }
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleGoPro = () => {
    closeLockedSheet();
    router.push("/pro");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeLockedSheet}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        />

        {/* Sheet / Modal Container */}
        <motion.div
          initial={{ y: "100%", opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 280 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden z-10 p-6 sm:p-7 text-center"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={closeLockedSheet}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Top Amber Lock Icon */}
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 border border-amber-200/80 dark:border-amber-800/60 mx-auto flex items-center justify-center text-2xl shadow-inner mb-3">
            <Lock size={26} strokeWidth={2.2} />
          </div>

          {/* Title */}
          <span className="px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800 inline-block mb-1.5">
            {isHindi ? "दैनिक मुफ्त सीमा पूर्ण" : "Daily Free Limit Reached"}
          </span>

          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-1.5">
            {isHindi
              ? `सेट ${setIndex} अभी लॉक है`
              : `Set ${setIndex} is currently locked`}
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto mb-4 font-medium leading-relaxed">
            {isHindi
              ? `आप 24 घंटे में अपने ${freeSetsPerWindow} मुफ्त सेट खेल चुके हैं।`
              : `You have enjoyed your ${freeSetsPerWindow} free sets for this 24-hour window.`}
          </p>

          {/* Live Countdown Timer Box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center gap-2 mb-5 text-slate-700 dark:text-slate-200">
            <Clock size={16} className="text-indigo-600 dark:text-indigo-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-extrabold">
              {isHindi
                ? `मुफ्त सेट वापसी: ${displayCountdown || "शीघ्र ही"}`
                : `Free sets return in: ${displayCountdown || "Soon"}`}
            </span>
          </div>

          {/* Interactive Actions by Tier */}
          {watchingAd ? (
            /* Rewarded Ad Simulation Gate */
            <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex flex-col items-center justify-center">
              <Tv size={28} className="text-indigo-600 dark:text-indigo-400 mb-2 animate-bounce" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                {isHindi ? "विज्ञापन चल रहा है... सेट अनलॉक हो रहा है" : "Short sponsor ad playing... unlocking set"}
              </p>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {adCountdown}s
              </span>
            </div>
          ) : isKidsOrStudents ? (
            /* Kids & Students: Countdown + Go Pro (NO ADS EVER) */
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleGoPro}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-sm shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Crown size={16} />
                <span>{isHindi ? "QuizWeb Pro में अपग्रेड करें" : "Upgrade to QuizWeb Pro"}</span>
                <ArrowRight size={16} />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 pt-1">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>
                  {isHindi
                    ? "माता-पिता या अभिभावक से भुगतान करने को कहें"
                    : "Ask a parent or guardian to upgrade"}
                </span>
              </div>
            </div>
          ) : (
            /* Explorer & Arena: Watch Ad option + Go Pro + Countdown alternative */
            <div className="space-y-2.5">
              {/* Option 1: Watch Ad to start this set */}
              {canWatchAd && (
                <button
                  type="button"
                  onClick={handleWatchAd}
                  disabled={loading}
                  className="w-full py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Tv size={16} className="text-amber-400 dark:text-indigo-600" />
                  <span>
                    {isHindi
                      ? "छोटा विज्ञापन देखें और यह सेट तुरंत शुरू करें"
                      : "Watch a short ad to start this set"}
                  </span>
                </button>
              )}

              {/* Option 2: Go Pro - No Ads */}
              <button
                type="button"
                onClick={handleGoPro}
                className="w-full py-3 px-5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs sm:text-sm border border-indigo-200 dark:border-indigo-800/80 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Crown size={15} className="text-amber-500" />
                <span>
                  {isHindi
                    ? "Go Pro — असीमित सेट्स, कोई विज्ञापन नहीं (₹49 से)"
                    : "Go Pro — Unlimited Sets, No Ads (from ₹49)"}
                </span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
