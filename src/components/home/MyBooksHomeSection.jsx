"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock, BookOpen, Sparkles } from "lucide-react";

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

  const LIVE_BOOKS = [
    {
      id: "india-gk",
      title: isHindi ? "भारत सामान्य ज्ञान (India GK)" : "India General Knowledge (India GK)",
      subtitle: isHindi
        ? "सिंधु घाटी सभ्यता, वैदिक काल, मौर्य साम्राज्य, नदियां, भूगोल, राजव्यवस्था एवं भारतीय संविधान का सम्पूर्ण डिजिटल अध्ययन।"
        : "Indus Valley Civilization, Vedic Era, Maurya Empire, Rivers, Geography & Indian Constitution.",
      cover: "/images/gk-book/india-gk-cover.jpg",
      bgGradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
      glowColor: "rgba(245, 158, 11, 0.15)",
      badge: isHindi ? "लाइव उपलब्ध" : "Live Available",
      stats: isHindi ? "5 विषय · 15+ अध्याय · 25+ पृष्ठ" : "5 Topics · 15+ Chapters · 25+ Pages",
      bookUrl: "/gk-book?book=india-gk",
      readUrl: "/gk-book/sindhu-ghati",
      firstChapterTitle: isHindi ? "अध्याय 1: सिंधु घाटी सभ्यता" : "Ch 1: Indus Valley Civilization",
      features: [
        isHindi ? "⚡ संक्षिप्त व विस्तृत नोट्स" : "⚡ Short & Full Modes",
        isHindi ? "🎯 हर पृष्ठ पर क्विज़" : "🎯 Page Quiz Cards",
        isHindi ? "✓ 100% फ्री" : "✓ 100% Free",
      ],
    },
    {
      id: "world-gk",
      title: isHindi ? "विश्व सामान्य ज्ञान (World GK)" : "World General Knowledge (World GK)",
      subtitle: isHindi
        ? "ब्रह्मांड, सौरमंडल, विश्व के महाद्वीप व महासागर, अंतर्राष्ट्रीय सीमाएं तथा संयुक्त राष्ट्र (UN) व वैश्विक संगठन।"
        : "Universe, Solar System, World Continents, Oceans, International Boundaries & United Nations (UN).",
      cover: "/images/gk-book/world-gk-cover.jpg",
      bgGradient: "linear-gradient(135deg, #09203f 0%, #17365d 50%, #1e4a7a 100%)",
      glowColor: "rgba(56, 189, 248, 0.2)",
      badge: isHindi ? "लाइव उपलब्ध" : "Live Available",
      stats: isHindi ? "2 विषय · 4 अध्याय · 12+ पृष्ठ" : "2 Topics · 4 Chapters · 12+ Pages",
      bookUrl: "/gk-book?book=world-gk",
      readUrl: "/gk-book?book=world-gk&chapter=solar-system&page=1",
      firstChapterTitle: isHindi ? "अध्याय 1: सौरमंडल (Solar System)" : "Ch 1: The Solar System",
      features: [
        isHindi ? "🌍 विश्व भूगोल व खगोलिकी" : "🌍 World Geography & Astronomy",
        isHindi ? "🏛️ अंतर्राष्ट्रीय संगठन (UN/WTO)" : "🏛️ International Agencies",
        isHindi ? "🎯 हर पृष्ठ पर क्विज़" : "🎯 Page Quiz Cards",
      ],
    },
  ];

  const UPCOMING_BOOKS = [
    {
      id: "mp-gk",
      title: isHindi ? "मध्य प्रदेश सामान्य ज्ञान (MP GK)" : "Madhya Pradesh GK (MP GK)",
      subtitle: isHindi ? "इतिहास, नदियां, जनजातियां, राष्ट्रीय उद्यान, किले व कला-संस्कृति" : "History, Rivers, Tribes, Forests & MPPSC",
      cover: "/images/gk-book/mp-gk-cover.jpg",
      exams: "MPPSC · MP Police · व्यापम",
      badge: isHindi ? "शीघ्र आ रहा है" : "Upcoming",
    },
    {
      id: "up-gk",
      title: isHindi ? "उत्तर प्रदेश सामान्य ज्ञान (UP GK)" : "Uttar Pradesh GK (UP GK)",
      subtitle: isHindi ? "75 जिले, नदियां, ऐतिहासिक धरोहर, कला-संस्कृति, अर्थव्यवस्था व भूगोल" : "75 Districts, Rivers, Culture & UPPSC/UPSSSC",
      cover: "/images/gk-book/up-gk-cover.jpg",
      exams: "UPPSC · UPSSSC · RO/ARO",
      badge: isHindi ? "शीघ्र आ रहा है" : "Upcoming",
    },
    {
      id: "rajasthan-gk",
      title: isHindi ? "राजस्थान सामान्य ज्ञान (Rajasthan GK)" : "Rajasthan GK (Rajasthan GK)",
      subtitle: isHindi ? "गौरवशाली इतिहास, दुर्ग, थार मरुस्थल, लोक देवता व समृद्ध संस्कृति" : "History, Forts, Thar Desert, Folk Deities & Culture",
      cover: "/images/gk-book/rajasthan-gk-cover.jpg",
      exams: "RAS · REET · राजस्थान पुलिस",
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
                ? "अध्याय दर अध्याय संरचित डिजिटल बुक्स + प्रत्येक पृष्ठ पर स्व-मूल्यांकन क्विज़"
                : "Structured chapter-by-chapter books with page-end self-quizzes"}
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

      {/* Featured Live Books: India GK & World GK */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-3.5">
        {LIVE_BOOKS.map((book) => (
          <div
            key={book.id}
            className="p-4 sm:p-5 rounded-2xl text-white relative overflow-hidden flex flex-col justify-between"
            style={{
              background: book.bgGradient,
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.25)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
            }}
          >
            {/* Glow ambient background */}
            <div
              className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-2xl pointer-events-none"
              style={{ background: book.glowColor }}
            />

            <div>
              <div className="flex items-start gap-3.5 sm:gap-4 mb-3 relative z-10">
                {/* Book Cover Thumbnail */}
                <Link
                  href={book.bookUrl}
                  className="w-24 sm:w-28 aspect-[3/4] rounded-xl overflow-hidden shadow-xl border border-white/20 shrink-0 transform hover:scale-105 transition-transform bg-slate-900 group relative block"
                >
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                      {isHindi ? "पढ़ें" : "Read"}
                    </span>
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                      ✓ {book.badge}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-white/10 text-slate-200">
                      {book.stats}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-white leading-tight mb-1">
                    {book.title}
                  </h3>
                  <p className="text-[11.5px] text-slate-200/90 line-clamp-2 leading-snug mb-2">
                    {book.subtitle}
                  </p>

                  {/* Feature pills */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-200/80">
                    {book.features.map((feat, fIdx) => (
                      <span key={fIdx} className="bg-black/20 px-1.5 py-0.5 rounded">
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/10 relative z-10 mt-auto">
              <Link
                href={book.bookUrl}
                className="flex-1 px-3 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center gap-1 shadow-md transition-all active:scale-95"
              >
                <span>{isHindi ? "किताब खोलें" : "Open Book"}</span>
                <ArrowRight size={13} />
              </Link>

              <Link
                href={book.readUrl}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/20 text-white flex items-center justify-center gap-1 border border-white/20 transition-all active:scale-95"
                title={book.firstChapterTitle}
              >
                <span>⚡ {isHindi ? "शुरू करें" : "Start"}</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Books Grid: MP GK, UP GK, Rajasthan GK */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {UPCOMING_BOOKS.map((book) => (
          <div
            key={book.id}
            className="p-3 rounded-2xl border transition-all flex items-center gap-3 bg-white dark:bg-slate-900"
            style={{
              borderColor: "var(--line, #e8eaf5)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            {/* Book Cover Thumbnail */}
            <div className="w-14 sm:w-16 aspect-[3/4] rounded-lg overflow-hidden shadow-md border border-slate-200 dark:border-slate-800 shrink-0 bg-slate-100 dark:bg-slate-800 relative">
              <img
                src={book.cover}
                alt={book.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                <span className="text-[8.5px] font-black uppercase px-1 py-0.5 rounded bg-amber-400/90 text-slate-950">
                  {book.badge}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  ⏳ {book.badge}
                </span>
              </div>

              <h4
                className="text-xs font-bold truncate leading-snug mb-0.5"
                style={{ color: "var(--ink, #14162b)" }}
              >
                {book.title}
              </h4>
              <p
                className="text-[11px] line-clamp-1 leading-normal mb-1.5"
                style={{ color: "var(--mute, #6b7190)" }}
              >
                {book.subtitle}
              </p>

              <span className="text-[10px] text-slate-400 block truncate">
                🎯 {book.exams}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
