"use client";

import React from "react";
import { GraduationCap, ChevronDown } from "lucide-react";
import { useTier } from "@/context/TierContext";
import { useLanguage } from "@/context/LanguageContext";

export default function StudentClassSelector({ className = "", compact = false }) {
  const { studentGrade, setStudentGrade, studentGradeOptions, tier, TIERS } = useTier();
  const { isHindi } = useLanguage();

  if (tier !== "students") return null;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <label htmlFor="student-class-select" className="sr-only">
        {isHindi ? "कक्षा और बोर्ड चुनें" : "Select Class & Board"}
      </label>

      <div className="relative flex items-center group">
        <div className="absolute left-3 pointer-events-none text-sky-500 dark:text-sky-400">
          <GraduationCap size={compact ? 14 : 16} />
        </div>

        <select
          id="student-class-select"
          value={studentGrade}
          onChange={(e) => setStudentGrade(e.target.value)}
          className={`appearance-none bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700/80 hover:border-sky-500 text-slate-800 dark:text-slate-100 font-extrabold rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer transition-all ${
            compact
              ? "text-xs py-1.5 pl-8 pr-7"
              : "text-xs sm:text-sm py-2 sm:py-2.5 pl-9 sm:pl-10 pr-8 sm:pr-9"
          }`}
        >
          {studentGradeOptions.map((option) => (
            <option key={option} value={option} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
              {option}
            </option>
          ))}
        </select>

        <div className="absolute right-2.5 pointer-events-none text-slate-400 group-hover:text-sky-500 transition-colors">
          <ChevronDown size={14} />
        </div>
      </div>
    </div>
  );
}
