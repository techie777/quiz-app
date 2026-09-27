"use client";

import React from "react";
import { motion } from "framer-motion";
import { Crown, Rocket, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";

export default function StickyPaywallCTA({
  hasLockedContent = true,
  isPro = false,
  onUnlockClick,
}) {
  const { isHindi } = useLanguage();
  const router = useRouter();

  if (isPro || !hasLockedContent) return null;

  const handleTrial = (e) => {
    e.stopPropagation();
    fetch("/api/mock-tests/trial")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.trialPaper?.id) {
          router.push(`/mock-tests/paper/${data.trialPaper.id}/instructions`);
        } else {
          router.push("/mock-tests");
        }
      })
      .catch(() => router.push("/mock-tests"));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] inset-x-0 z-40 px-3 sm:px-6 pointer-events-none"
    >
      <div className="max-w-4xl mx-auto p-3 sm:p-3.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-amber-400/40 shadow-2xl text-white flex items-center justify-between gap-3 pointer-events-auto">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
            <Crown size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-black text-white truncate flex items-center gap-1.5">
              <span>{isHindi ? "प्रीमियम सेट्स उपलब्ध हैं" : "Premium Sets Available"}</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-amber-400 text-slate-950">
                ₹11/mo
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate hidden sm:block">
              {isHindi
                ? "सभी क्विज़ सेट्स, संपूर्ण मॉक टेस्ट और विज्ञापन-मुक्त अभ्यास अनलॉक करें।"
                : "Unlock all 500+ quiz sets, govt exam mocks, and 100% ad-free learning."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleTrial}
            className="hidden xs:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-sky-300 font-extrabold text-xs transition-colors whitespace-nowrap"
          >
            <Rocket size={13} />
            <span>{isHindi ? "फ्री ट्रायल" : "Free Trial"}</span>
          </button>
          <button
            onClick={onUnlockClick}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md transition-all whitespace-nowrap active:scale-95"
          >
            <span>{isHindi ? "अनलॉक करें" : "Unlock Now"}</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
