"use client";

import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Newspaper,
  Sparkles,
  Zap,
  ChevronRight,
} from "lucide-react";

export const MASTER_SMALL_FEATURES = [
  {
    id: "govt_exams",
    href: "/govt-exams",
    icon: GraduationCap,
    title: "Govt Exams",
    titleHi: "सरकारी परीक्षाएं",
    subtitle: "40+ Exams & PYQs",
    subtitleHi: "40+ परीक्षाएं व PYQs",
    badge: "40+ EXAMS",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800",
    iconBg: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400",
    accentBorder: "hover:border-indigo-300",
  },
  {
    id: "current_affairs",
    href: "/daily-current-affairs",
    icon: Newspaper,
    title: "Current Affairs",
    titleHi: "दैनिक करेंट अफेयर्स",
    subtitle: "Daily Top 10 & Quiz",
    subtitleHi: "आज के 10 समाचार व टेस्ट",
    badge: "DAILY",
    badgeColor: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-800",
    iconBg: "bg-sky-500/10 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400",
    accentBorder: "hover:border-sky-300",
  },
  {
    id: "fun_facts",
    href: "/fun-facts",
    icon: Sparkles,
    title: "Fun Facts",
    titleHi: "रोचक तथ्य",
    subtitle: "1,000+ Mind Facts",
    subtitleHi: "1,000+ अद्भुत ज्ञान",
    badge: "TRIVIA",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800",
    iconBg: "bg-amber-500/10 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    accentBorder: "hover:border-amber-300",
  },
  {
    id: "true_false",
    href: "/true-false",
    icon: Zap,
    title: "True & False",
    titleHi: "सही या गलत",
    subtitle: "60s Rapid Blitz",
    subtitleHi: "60s रैपिड फायर गेम",
    badge: "RAPID",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    accentBorder: "hover:border-emerald-300",
  },
];

export default function MasterFeaturesSection({ isHindi = true }) {
  return (
    <section className="w-full space-y-2.5 my-2">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
          <span>{isHindi ? "मास्टर फीचर्स व अध्ययन हब" : "Master Features & Hubs"}</span>
          <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
            ({isHindi ? "Quick Hubs" : "प्रमुख हब"})
          </span>
        </h2>
        <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
          {isHindi ? "4 प्रमुख हब" : "4 Core Hubs"}
        </span>
      </div>

      {/* Identical Compact 2-Column (Mobile) / 4-Column (Desktop) Small Card View Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {MASTER_SMALL_FEATURES.map((cat) => {
          const IconComponent = cat.icon;
          return (
            <Link
              key={cat.id}
              href={cat.href}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group active:scale-[0.98] ${cat.accentBorder}`}
            >
              {/* Top Row: Icon and Badge */}
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${cat.iconBg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <span className={`text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded-full border ${cat.badgeColor}`}>
                  {cat.badge}
                </span>
              </div>

              {/* Content Details */}
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                  {isHindi ? cat.titleHi : cat.title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                  {isHindi ? cat.subtitleHi : cat.subtitle}
                </p>
              </div>

              {/* Card Footer micro-action */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-medium text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                <span>{isHindi ? "अभ्यास शुरू करें" : "Start Now"}</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
