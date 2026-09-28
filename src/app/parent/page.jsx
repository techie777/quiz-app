"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Clock, BookOpen, Sparkles, ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTier, TIERS } from "@/context/TierContext";

export default function ParentStubPage() {
  const { isHindi } = useLanguage();
  const { setTier } = useTier();

  const previewFeatures = [
    {
      icon: Clock,
      title: isHindi ? "स्क्रीन समय सीमा" : "Screen Time Limits",
      desc: isHindi
        ? "दैनिक क्विज़ समय और ब्रेक इंटरवल को प्रबंधित करें।"
        : "Set daily play limits and friendly study reminders for healthy habits.",
      tag: isHindi ? "आगामी" : "Planned",
    },
    {
      icon: BookOpen,
      title: isHindi ? "उम्र-अनुकूल विषय" : "Curated Subjects",
      desc: isHindi
        ? "केवल वही विषय चुनें जो आपके बच्चे की कक्षा और रुचि के अनुकूल हों।"
        : "Pick subjects that align with your child's age group and learning goals.",
      tag: isHindi ? "आगामी" : "Planned",
    },
    {
      icon: ShieldCheck,
      title: isHindi ? "सुरक्षित मोड" : "Safe Kid Environment",
      desc: isHindi
        ? "विज्ञापन-मुक्त और पूर्णतः सुरक्षित शैक्षिक अनुभव।"
        : "Ad-free exploration mode with no external distractions or exam stress.",
      tag: isHindi ? "आगामी" : "Planned",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/20 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-8 sm:py-12 pb-24">
      <div className="max-w-xl mx-auto">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>{isHindi ? "होम पर वापस जाएं" : "Back to Home"}</span>
        </Link>

        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl text-center mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-3xl sm:text-4xl shadow-inner mb-4">
            <ShieldCheck size={36} className="text-indigo-600 dark:text-indigo-400" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 mb-3">
            <Lock size={12} />
            <span>{isHindi ? "पैरेंट ज़ोन" : "Parent Zone"}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
            {isHindi ? "पैरेंटल कंट्रोल" : "Parental Controls"}
          </h1>

          <p className="text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400 mb-2">
            {isHindi ? "पैरेंटल कंट्रोल जल्द आ रहा है" : "Parental controls coming soon"}
          </p>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {isHindi
              ? "हम माता-पिता के लिए बच्चों के अध्ययन की निगरानी, स्क्रीन समय प्रबंधन और सुरक्षित क्विज़ वातावरण तैयार कर रहे हैं।"
              : "We're building dedicated tools for parents to customize learning pace, track curiosity milestones, and maintain a safe, pressure-free learning zone."}
          </p>
        </div>

        {/* Upcoming Controls Preview */}
        <div className="space-y-3 mb-8">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
            {isHindi ? "आगामी सुविधाएं" : "Upcoming Features"}
          </h2>
          {previewFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {feat.title}
                    </h3>
                    <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {feat.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md shadow-indigo-500/20 transition-all active:scale-95"
          >
            <span>{isHindi ? "बच्चों के खेल पर वापस जाएं" : "Return to Kids Play"}</span>
            <ArrowRight size={16} />
          </Link>
          <button
            onClick={() => setTier(TIERS.ADULTS)}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all"
          >
            <span>{isHindi ? "एक्सप्लोरर मोड पर जाएं" : "Switch to Explorer Tier"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
