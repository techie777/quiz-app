"use client";

import Link from "next/link";
import { Zap, ArrowRight, SlidersHorizontal, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function ArenaPromptCard({ audience = "all", className = "" }) {
  const { isHindi } = useLanguage();

  const isKids = audience === "kids";
  const isStudents = audience === "students";

  let href = "/arena";
  if (isKids) href = "/arena?audience=kids";
  else if (isStudents) href = "/arena?audience=students";

  return (
    <Link
      href={href}
      className={`group relative block w-full overflow-hidden rounded-3xl border transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg ${
        isKids
          ? "bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border-amber-500/30 hover:border-amber-400 shadow-orange-500/10"
          : isStudents
          ? "bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 border-emerald-500/30 hover:border-emerald-400 shadow-emerald-500/10"
          : "bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-slate-900 border-amber-500/30 hover:border-amber-400 shadow-amber-500/10"
      } ${className}`}
    >
      <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl font-black shadow-inner ${
              isKids
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : isStudents
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            }`}
          >
            <Zap className="w-6 h-6 fill-current" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                {isHindi ? "क्विज़ एरिना: अपनी खुद की क्विज़ बनाएं" : "Quiz Arena: Build Your Own Quiz"}
              </span>
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isKids
                    ? "bg-amber-500/20 text-amber-300"
                    : isStudents
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-amber-500/20 text-amber-300"
                }`}
              >
                {isHindi ? "नया" : "NEW"}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {isKids
                ? isHindi
                  ? "अपनी पसंद के विषय, आसान प्रश्न और मजेदार टाइमर चुनें!"
                  : "Pick your favourite topics, easy questions, and fun mode!"
                : isStudents
                ? isHindi
                  ? "कठिनाई स्तर, परीक्षा और प्रश्नों की संख्या अपनी आवश्यकतानुसार सेट करें।"
                  : "Custom question count, difficulty & practice or exam test mode."
                : isHindi
                ? "मिश्रित श्रेणियां, परीक्षा स्तर और टेस्ट या प्रैक्टिस मोड सेट करें।"
                : "Custom categories, exam levels, timer & instant practice or test modes."}
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 hidden sm:flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
          <span>{isHindi ? "शुरू करें" : "Customize"}</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}
