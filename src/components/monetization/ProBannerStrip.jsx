"use client";

import React from "react";
import Link from "next/link";
import { Crown, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTier } from "@/context/TierContext";

export default function ProBannerStrip({ className = "" }) {
  const { isHindi } = useLanguage();
  const { tier } = useTier();

  const isKidsOrStudents = tier === "kids" || tier === "students";

  return (
    <div
      className={`w-full my-6 p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white shadow-md relative overflow-hidden select-none ${className}`}
    >
      {/* Background glow decoration */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm font-black">
            <Crown size={20} />
          </div>

          <div>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-black tracking-tight text-white">
                {isHindi ? "QuizWeb Pro असीमित एक्सेस" : "QuizWeb Pro Unlimited Access"}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950">
                ₹49 / {isHindi ? "माह" : "mo"}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              {isHindi
                ? "सभी 4 मॉड्यूल्स में असीमित सेट्स, कोई लॉक नहीं, कोई विज्ञापन नहीं।"
                : "No limits, no locked sets, and zero ads across all 4 modules."}
            </p>
          </div>
        </div>

        <Link
          href="/pro"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-black text-xs shadow-sm hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <span>{isHindi ? "प्लान देखें" : "View Plans"}</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {isKidsOrStudents && (
        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-center sm:justify-start gap-1.5 text-[10px] font-semibold text-slate-400">
          <ShieldCheck size={12} className="text-emerald-400" />
          <span>
            {isHindi
              ? "माता-पिता या अभिभावक से भुगतान करने को कहें"
              : "Ask a parent or guardian to subscribe"}
          </span>
        </div>
      )}
    </div>
  );
}
