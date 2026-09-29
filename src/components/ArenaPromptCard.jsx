"use client";

import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";
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
      className={`group relative block w-full overflow-hidden rounded-2xl border border-[#C7D2FE] bg-gradient-to-r from-[#EEF2FF] to-[#F5F3FF] p-4 sm:p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-indigo-300 active:scale-[0.99] ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          {/* Amber lightning icon tile */}
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-100 border border-amber-200/80 flex items-center justify-center flex-shrink-0 text-amber-600 shadow-sm">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-500 text-amber-500" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm sm:text-base font-extrabold text-[#1E1B4B] tracking-tight">
                {isHindi ? "क्विज़ एरिना" : "Quiz Arena"}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EDE9FE] text-[#6D28D9] border border-violet-200/60">
                {isHindi ? "नया" : "NEW"}
              </span>
            </div>
            <p className="text-xs text-[#475569] font-medium line-clamp-1 sm:line-clamp-none">
              {isHindi
                ? "2 टैप में अपनी क्विज़ बनाएं"
                : "Build your own quiz in 2 taps"}
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
          <span className="hidden xs:inline">{isHindi ? "शुरू करें" : "Build"}</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}
