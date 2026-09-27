"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Sparkles, Check, X, Zap, Shield, Rocket, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

export default function UnifiedPaywallModal({
  isOpen,
  onClose,
  itemTitle = "Premium Set",
  itemType = "quiz", // "quiz" | "mock"
}) {
  const router = useRouter();
  const { isHindi } = useLanguage();
  const [trialPaperId, setTrialPaperId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/mock-tests/trial")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.trialPaper?.id) {
            setTrialPaperId(data.trialPaper.id);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartTrial = () => {
    onClose();
    if (trialPaperId) {
      router.push(`/mock-tests/paper/${trialPaperId}/instructions`);
    } else {
      router.push("/mock-tests");
    }
  };

  const handleGoPro = () => {
    onClose();
    router.push("/pro");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-slate-900 border border-amber-400/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-white overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Background Decorative Glow */}
          <div className="absolute -top-24 -right-24 w-52 h-52 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Header Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40">
              <Crown size={14} className="text-amber-400 fill-amber-400" />
              {isHindi ? "प्रीमियम कंटेंट" : "Premium Content"}
            </span>
            <span className="text-xs text-slate-400 font-bold truncate max-w-[200px]">
              {itemTitle}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
            {isHindi
              ? "सभी क्विज़ सेट्स और मॉक टेस्ट अनलॉक करें"
              : "Unlock All Quiz Sets & Govt Exam Mocks"}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
            {isHindi
              ? "यह सेट केवल प्रो मेंबर्स के लिए उपलब्ध है। 100% फ्री ट्रायल टेस्ट आज़माएं या केवल ₹11/माह में संपूर्ण एक्सेस पाएं।"
              : "This set is locked for Pro members. Try a free live test or unlock all 500+ quiz sets and govt exam mocks for just ₹11/month."}
          </p>

          {/* Key Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6 text-xs">
            {[
              { icon: <Shield size={14} className="text-emerald-400" />, text: isHindi ? "100% विज्ञापन-मुक्त अनुभव" : "100% Ad-Free Experience" },
              { icon: <Crown size={14} className="text-amber-400" />, text: isHindi ? "सभी परीक्षा मॉक टेस्ट अनलॉक" : "All Govt Exam Mocks Unlocked" },
              { icon: <Zap size={14} className="text-purple-400" />, text: isHindi ? "असीमित 50/50 व पोल लाइफलाइन" : "Unlimited Quiz Lifelines" },
              { icon: <Sparkles size={14} className="text-sky-400" />, text: isHindi ? "सभी 500+ क्विज़ सेट्स" : "All 500+ Category Sets" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 text-slate-200">
                {b.icon}
                <span className="font-semibold">{b.text}</span>
              </div>
            ))}
          </div>

          {/* Pricing Highlight */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-400/10 via-indigo-500/10 to-purple-500/10 border border-amber-400/30 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase text-amber-300 tracking-wider">
                {isHindi ? "सीमित समय स्पेशल ऑफर" : "Limited Time Offer"}
              </div>
              <div className="text-2xl font-black text-white flex items-baseline gap-1">
                <span>₹11</span>
                <span className="text-xs text-slate-400 font-bold">/ {isHindi ? "माह" : "month"}</span>
              </div>
            </div>
            <button
              onClick={handleGoPro}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>{isHindi ? "प्रो बनें" : "Upgrade Pro"}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleStartTrial}
              className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-extrabold text-xs sm:text-sm text-center flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Rocket size={16} className="text-sky-400" />
              <span>{isHindi ? "फ्री ट्रायल टेस्ट दें" : "Start Free Trial Test"}</span>
            </button>
            <button
              onClick={handleGoPro}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm text-center flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
            >
              <Crown size={16} className="text-amber-300" />
              <span>{isHindi ? "सभी अनलॉक करें" : "Unlock Everything"}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
