"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Sparkles, ArrowRight, CheckCircle2, Clock } from "lucide-react";

export default function MyBooksHomeSection({ isHindi = false }) {
  const router = useRouter();
  const [selectedChapter, setSelectedChapter] = useState("");

  const handleChapterChange = (e) => {
    const val = e.target.value;
    setSelectedChapter(val);
    if (val) {
      router.push(val);
    }
  };

  const UPCOMING_BOOKS = [
    {
      id: "mp-gk",
      title: isHindi ? "मध्य प्रदेश सामान्य ज्ञान (MP GK)" : "Madhya Pradesh GK (MP GK)",
      subtitle: isHindi ? "इतिहास, नदियां, जनजातियां, राष्ट्रीय उद्यान व संस्कृति" : "History, Rivers, Tribes, Forests & MPPSC",
      cover: "/images/gk-book/mp-gk-cover.jpg",
      exams: "MPPSC · MP Police · व्यापम",
      badge: isHindi ? "शीघ्र आ रहा है" : "Upcoming",
    },
    {
      id: "up-gk",
      title: isHindi ? "उत्तर प्रदेश सामान्य ज्ञान (UP GK)" : "Uttar Pradesh GK (UP GK)",
      subtitle: isHindi ? "75 जिले, नदियां, कला-संस्कृति, अर्थव्यवस्था व भूगोल" : "75 Districts, Rivers, Culture & UPPSC/UPSSSC",
      cover: "/images/gk-book/up-gk-cover.jpg",
      exams: "UPPSC · UPSSSC · RO/ARO",
      badge: isHindi ? "शीघ्र आ रहा है" : "Upcoming",
    },
  ];

  return (
    <section className="mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between my-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">📚</span>
          <div>
            <h2
              className="text-base sm:text-lg font-bold leading-tight"
              style={{ color: "var(--ink, #14162b)" }}
            >
              {isHindi ? "मेरी डिजिटल पुस्तकें (My Books)" : "Digital Books (My Books)"}
            </h2>
            <p className="text-[11px] sm:text-xs" style={{ color: "var(--mute, #6b7190)" }}>
              {isHindi
                ? "अध्याय दर अध्याय संरचित डिजिटल बुक + हर पृष्ठ पर क्विज़"
                : "Structured chapter-by-chapter book with page-end quizzes"}
            </p>
          </div>
        </div>

        <Link
          href="/gk-book"
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0"
        >
          <span>{isHindi ? "सभी पुस्तकें देखें" : "View Shelf"}</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* Featured Book Card: India GK */}
      <div
        className="p-4 sm:p-5 rounded-2xl mb-3 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
          boxShadow: "0 8px 24px rgba(49, 46, 129, 0.25)",
          border: "1px solid rgba(129, 140, 248, 0.3)",
        }}
      >
        {/* Glow ambient background */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-4 relative z-10">
          {/* Book Cover Thumbnail */}
          <Link
            href="/gk-book/sindhu-ghati"
            className="w-28 sm:w-32 aspect-[3/4] rounded-xl overflow-hidden shadow-xl border border-white/20 shrink-0 transform hover:scale-105 transition-transform bg-slate-900 group relative block"
          >
            <img
              src="/images/gk-book/india-gk-cover.jpg"
              alt="India GK Book Cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                {isHindi ? "पढ़ें" : "Read"}
              </span>
            </div>
          </Link>

          {/* Book Info & Quick Actions */}
          <div className="flex-1 flex flex-col justify-between text-center sm:text-left">
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mb-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  ✓ {isHindi ? "लाइव उपलब्ध" : "Live Available"}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-indigo-100">
                  5+ {isHindi ? "अध्याय" : "Chapters"} · 25+ {isHindi ? "पृष्ठ" : "Pages"}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-black text-white leading-tight mb-1">
                {isHindi ? "भारत सामान्य ज्ञान (India GK)" : "India General Knowledge (India GK)"}
              </h3>
              <p className="text-xs text-indigo-200/90 leading-snug mb-3">
                {isHindi
                  ? "सिंधु घाटी सभ्यता, वैदिक काल, मौर्य साम्राज्य, नदियां, भूगोल एवं भारतीय संविधान का सम्पूर्ण डिजिटल अध्ययन।"
                  : "Indus Valley Civilization, Vedic Era, Maurya Empire, Rivers, Geography & Indian Constitution."}
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3 text-[10.5px] text-indigo-200">
                <span className="flex items-center gap-1">
                  <span>⚡</span> {isHindi ? "संक्षिप्त व विस्तृत मोड" : "Short & Full Modes"}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <span>🎯</span> {isHindi ? "हर पृष्ठ पर क्विज़" : "Page Quiz Cards"}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 text-emerald-300 font-bold">
                  <span>✓</span> {isHindi ? "100% मुफ्त" : "100% Free"}
                </span>
              </div>
            </div>

            {/* CTA Buttons & Jump to Chapter Dropdown */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Link
                href="/gk-book/sindhu-ghati"
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <span>{isHindi ? "किताब पढ़ना शुरू करें" : "Start Reading"}</span>
                <ArrowRight size={14} />
              </Link>

              {/* Chapter Jump Dropdown */}
              <div className="relative flex-1">
                <select
                  value={selectedChapter}
                  onChange={handleChapterChange}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-semibold outline-none cursor-pointer backdrop-blur-xs transition-colors"
                >
                  <option value="" disabled className="bg-slate-900 text-slate-400">
                    {isHindi ? "▼ सीधे अध्याय पर जाएं..." : "▼ Jump to Chapter..."}
                  </option>
                  <option value="/gk-book/sindhu-ghati" className="bg-slate-900 text-white">
                    1. सिंधु घाटी सभ्यता — विस्तार व नगर नियोजन (Live)
                  </option>
                  <option value="/gk-book" className="bg-slate-900 text-white">
                    2. वैदिक काल एवं महाजनपद (Upcoming)
                  </option>
                  <option value="/gk-book" className="bg-slate-900 text-white">
                    3. मौर्य साम्राज्य एवं चाणक्य (Upcoming)
                  </option>
                  <option value="/gk-book" className="bg-slate-900 text-white">
                    📚 {isHindi ? "पूरी अनुक्रमणिका देखें" : "View Complete Shelf"}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Books Grid: MP GK, UP GK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {UPCOMING_BOOKS.map((book) => (
          <div
            key={book.id}
            className="p-3.5 rounded-2xl border transition-all flex items-center gap-3.5 bg-white dark:bg-slate-900"
            style={{
              borderColor: "var(--line, #e8eaf5)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            {/* Book Cover Thumbnail */}
            <div className="w-16 sm:w-20 aspect-[3/4] rounded-lg overflow-hidden shadow-md border border-slate-200 dark:border-slate-800 shrink-0 bg-slate-100 dark:bg-slate-800 relative">
              <img
                src={book.cover}
                alt={book.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                <span className="text-[9px] font-black uppercase px-1 py-0.5 rounded bg-amber-400/90 text-slate-950">
                  {book.badge}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  ⏳ {book.badge}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  {book.exams}
                </span>
              </div>

              <h4
                className="text-sm font-bold truncate leading-snug mb-0.5"
                style={{ color: "var(--ink, #14162b)" }}
              >
                {book.title}
              </h4>
              <p
                className="text-xs line-clamp-2 leading-relaxed mb-2"
                style={{ color: "var(--mute, #6b7190)" }}
              >
                {book.subtitle}
              </p>

              <button
                type="button"
                disabled
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed inline-flex items-center gap-1"
              >
                <Clock size={11} />
                <span>{isHindi ? "जल्द उपलब्ध होगा" : "Coming Soon"}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
