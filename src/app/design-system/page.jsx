"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useTier, TIERS } from "@/context/TierContext";
import { 
  Sparkles, 
  ArrowLeft, 
  Moon, 
  Sun, 
  Check, 
  AlertCircle, 
  HelpCircle, 
  Clock, 
  Flame, 
  Zap, 
  Award,
  Layers,
  Palette,
  Type,
  MousePointer,
  Box
} from "lucide-react";

export default function DesignSystemPage() {
  const { theme, setTheme } = useTheme();
  const { tier, setTier } = useTier();
  const [lang, setLang] = useState("en");
  const [animState, setAnimState] = useState(null);

  const isDark = theme === "dark";
  const isHindi = lang === "hi";

  const triggerAnim = (type) => {
    setAnimState(type);
    setTimeout(() => setAnimState(null), 800);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-[var(--bg-primary)]/90 backdrop-blur-md border-b border-[var(--border-subtle)] px-4 py-3.5 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--brand-primary)]"
              aria-label="Back to App"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-primary)] bg-[var(--brand-primary-light)] px-2 py-0.5 rounded-full">
                  Step 1 Preview
                </span>
                <h1 className="text-lg font-bold">QuizWeb Design System</h1>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Poppins Only • 4 Tiers • Strict Rem Type Scale • WCAG AA
              </p>
            </div>
          </div>

          {/* Quick Controls Toolbar */}
          <div className="flex items-center gap-2">
            {/* Language Switch */}
            <div className="flex items-center bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] p-1">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  lang === "en"
                    ? "bg-[var(--brand-primary)] text-white"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("hi")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  lang === "hi"
                    ? "bg-[var(--brand-primary)] text-white"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                हिन्दी
              </button>
            </div>

            {/* Dark / Light Toggle */}
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-all"
              title="Toggle theme"
            >
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-8 space-y-12">
        {/* Tier Selector Bar */}
        <section className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--radius-card)] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Layers size={14} /> Active Experience Tier
            </span>
            <span className="text-xs font-semibold text-[var(--tier-accent)]">
              Current: {tier.toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: TIERS.KIDS, label: "Kids", labelHi: "बच्चे", accent: "#f59e0b", desc: "Amber / Orange" },
              { id: TIERS.STUDENTS, label: "Students", labelHi: "विद्यार्थी", accent: "#0d9488", desc: "Teal" },
              { id: TIERS.ADULTS, label: "Explorer", labelHi: "एक्सप्लोरर", accent: "#6366f1", desc: "Indigo" },
              { id: TIERS.ARENA, label: "Quiz Arena", labelHi: "क्विज़ एरीना", accent: "#8b5cf6", desc: "Violet/Pink" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTier(t.id)}
                className={`p-3 rounded-[var(--radius-sm)] border text-left transition-all ${
                  tier === t.id
                    ? "border-[var(--tier-accent)] bg-[var(--tier-accent-light)] ring-2 ring-[var(--tier-accent)]/30 font-bold"
                    : "border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-[var(--border-medium)] font-medium"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-[var(--text-primary)]">
                    {isHindi ? t.labelHi : t.label}
                  </span>
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ background: t.accent }}
                  />
                </div>
                <div className="text-[11px] text-[var(--text-muted)] truncate">
                  {t.desc}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 1. Typography Hierarchy */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-subtle)]">
            <Type size={20} className="text-[var(--brand-primary)]" />
            <h2 className="text-xl font-bold">1. Typography Hierarchy (Poppins Only)</h2>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Strict scale in rem (base 16px). All sizes obey min 12px and max weight 700. Metric-matched Noto Sans Devanagari fallback ensures no matra clipping in Hindi.
          </p>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--radius-card)] p-5 space-y-5 shadow-[var(--shadow-sm)]">
            {/* Display */}
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-bold text-[var(--brand-primary)]">Display · 1.75rem / 28px · Line-Height 36px · Weight 700</span>
                <span className="text-xs text-[var(--text-muted)]">.text-display</span>
              </div>
              <div className="text-display">
                {isHindi ? "ज्ञान का महासंग्राम शुरू करें" : "Unleash Your Ultimate Trivia Mind"}
              </div>
            </div>

            {/* H1 */}
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-bold text-[var(--brand-primary)]">H1 · 1.5rem / 24px · Line-Height 32px · Weight 700</span>
                <span className="text-xs text-[var(--text-muted)]">h1, .text-h1</span>
              </div>
              <h1 className="text-h1">
                {isHindi ? "दैनिक क्विज़ और परीक्षा तैयारी" : "Daily Quiz & Exam Preparation Hub"}
              </h1>
            </div>

            {/* H2 */}
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-bold text-[var(--brand-primary)]">H2 · 1.25rem / 20px · Line-Height 28px · Weight 600</span>
                <span className="text-xs text-[var(--text-muted)]">h2, .text-h2</span>
              </div>
              <h2 className="text-h2">
                {isHindi ? "सामान्य विज्ञान व आधुनिक इतिहास" : "General Science & Modern Indian History"}
              </h2>
            </div>

            {/* H3 */}
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-bold text-[var(--brand-primary)]">H3 · 1.0625rem / 17px · Line-Height 24px · Weight 600</span>
                <span className="text-xs text-[var(--text-muted)]">h3, .text-h3</span>
              </div>
              <h3 className="text-h3">
                {isHindi ? "सेट 1 · 20 बहुविकल्पीय प्रश्न" : "Set 1 · 20 Multiple Choice Questions"}
              </h3>
            </div>

            {/* Question */}
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-bold text-[var(--brand-primary)]">Question · 1.1875rem / 19px · Line-Height 30px · Weight 600</span>
                <span className="text-xs text-[var(--text-muted)]">.text-question</span>
              </div>
              <div className="text-question font-semibold">
                {isHindi 
                  ? "प्रश्न: भारतीय संविधान के किस अनुच्छेद के तहत मौलिक अधिकारों की गारंटी दी गई है?" 
                  : "Which atmospheric layer contains the ozone shield protecting Earth from UV radiation?"}
              </div>
            </div>

            {/* Body */}
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-bold text-[var(--brand-primary)]">Body · 1rem / 16px · Line-Height 24px · Weight 400</span>
                <span className="text-xs text-[var(--text-muted)]">body, p, .text-body</span>
              </div>
              <p className="text-body text-[var(--text-primary)]">
                {isHindi
                  ? "प्रत्येक सही उत्तर पर आपको 10 ज्ञान अंक प्राप्त होंगे। गलत उत्तर पर कोई नकारात्मक अंकन नहीं होगा।"
                  : "Every correct answer earns you 10 points. Complete all sets to unlock the next difficulty tier."}
              </p>
            </div>

            {/* Meta */}
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-bold text-[var(--brand-primary)]">Meta · 0.875rem / 14px · Line-Height 20px · Weight 500</span>
                <span className="text-xs text-[var(--text-muted)]">.text-meta</span>
              </div>
              <div className="text-meta text-[var(--text-secondary)]">
                {isHindi ? "समय: 30 सेकंड प्रति प्रश्न · 80% सटीकता आवश्यक" : "Time limit: 30s per question · 80% accuracy required"}
              </div>
            </div>

            {/* Badge */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-bold text-[var(--brand-primary)]">Badge · 0.75rem / 12px · Line-Height 16px · Weight 600</span>
                <span className="text-xs text-[var(--text-muted)]">.text-badge</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-badge px-2.5 py-1 rounded-[var(--radius-pill)] bg-[var(--tier-accent-light)] text-[var(--tier-accent)] border border-[var(--tier-accent-border)] font-semibold">
                  {isHindi ? "नया सेट" : "NEW SET"}
                </span>
                <span className="text-badge px-2.5 py-1 rounded-[var(--radius-pill)] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold">
                  {isHindi ? "पूर्ण" : "COMPLETED"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Color Palette & 4 Tiers */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-subtle)]">
            <Palette size={20} className="text-[var(--brand-primary)]" />
            <h2 className="text-xl font-bold">2. Colours & Tier Accents</h2>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Brand primary (Indigo) for core actions. Tier accents used strictly for chips, progress, icons, and highlights.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tier Accents Card */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--radius-card)] p-4 shadow-[var(--shadow-sm)] space-y-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">4 Tier Accents</h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-[var(--radius-sm)] bg-[#f59e0b]/10 border border-[#f59e0b]/30">
                  <span className="text-sm font-bold text-[#f59e0b]">Kids · Amber/Orange</span>
                  <span className="text-xs font-mono font-bold text-[#b45309] dark:text-[#fbbf24]">#f59e0b</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-[var(--radius-sm)] bg-[#0d9488]/10 border border-[#0d9488]/30">
                  <span className="text-sm font-bold text-[#0d9488] dark:text-[#14b8a6]">Students · Teal</span>
                  <span className="text-xs font-mono font-bold text-[#0f766e] dark:text-[#2dd4bf]">#0d9488</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-[var(--radius-sm)] bg-[#6366f1]/10 border border-[#6366f1]/30">
                  <span className="text-sm font-bold text-[#6366f1] dark:text-[#818cf8]">Explorer · Indigo</span>
                  <span className="text-xs font-mono font-bold text-[#4f46e5] dark:text-[#a5b4fc]">#6366f1</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-[var(--radius-sm)] bg-[#8b5cf6]/10 border border-[#8b5cf6]/30">
                  <span className="text-sm font-bold text-[#8b5cf6] dark:text-[#a855f7]">Quiz Arena · Violet-Pink</span>
                  <span className="text-xs font-mono font-bold text-[#7c3aed] dark:text-[#c084fc]">#8b5cf6</span>
                </div>
              </div>
            </div>

            {/* Semantic Palette */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--radius-card)] p-4 shadow-[var(--shadow-sm)] space-y-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Semantic Colours (Uniform Everywhere)</h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-[var(--radius-sm)] bg-[var(--success-bg)] border border-[var(--success-border)]">
                  <span className="text-sm font-bold text-[var(--success)] flex items-center gap-1.5">
                    <Check size={16} /> Success Green
                  </span>
                  <span className="text-xs font-mono font-bold text-[var(--success-text)]">#10b981</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-[var(--radius-sm)] bg-[var(--error-bg)] border border-[var(--error-border)]">
                  <span className="text-sm font-bold text-[var(--error)] flex items-center gap-1.5">
                    <AlertCircle size={16} /> Error Red
                  </span>
                  <span className="text-xs font-mono font-bold text-[var(--error-text)]">#ef4444</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-[var(--radius-sm)] bg-[var(--warning-bg)] border border-[var(--warning-border)]">
                  <span className="text-sm font-bold text-[var(--warning)] flex items-center gap-1.5">
                    <Clock size={16} /> Warning Amber
                  </span>
                  <span className="text-xs font-mono font-bold text-[var(--warning-text)]">#f59e0b</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Button System */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-subtle)]">
            <MousePointer size={20} className="text-[var(--brand-primary)]" />
            <h2 className="text-xl font-bold">3. Button System (One Shape, Min 44px)</h2>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Radius 12px, minimum height 44px. Three variants: Primary (solid brand), Secondary (tonal), Ghost.
          </p>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--radius-card)] p-5 shadow-[var(--shadow-sm)]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Primary */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase">Primary</span>
                <button type="button" className="btn-primary w-full">
                  {isHindi ? "शुरू करें" : "Start Quiz"}
                </button>
                <button type="button" className="btn-primary w-full" disabled>
                  {isHindi ? "अक्षम (Disabled)" : "Disabled"}
                </button>
              </div>

              {/* Secondary */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase">Secondary (Tonal)</span>
                <button type="button" className="btn-secondary w-full">
                  {isHindi ? "रद्द करें" : "Dismiss"}
                </button>
                <button type="button" className="btn-secondary w-full" disabled>
                  {isHindi ? "अक्षम (Disabled)" : "Disabled"}
                </button>
              </div>

              {/* Ghost */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase">Ghost</span>
                <button type="button" className="btn-ghost w-full">
                  {isHindi ? "और देखें →" : "View Details →"}
                </button>
                <button type="button" className="btn-ghost w-full" disabled>
                  {isHindi ? "अक्षम (Disabled)" : "Disabled"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Difficulty Chips & Tabular Numerals */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-subtle)]">
            <Award size={20} className="text-[var(--brand-primary)]" />
            <h2 className="text-xl font-bold">4. Difficulty Chips & Tabular Numerals</h2>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--radius-card)] p-5 shadow-[var(--shadow-sm)] space-y-6">
            <div>
              <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase mb-3">Difficulty Chips (Dot + Text)</h3>
              <div className="flex flex-wrap items-center gap-3">
                <span className="chip-difficulty" data-level="easy">
                  <span className="chip-dot" />
                  <span>{isHindi ? "सरल" : "Easy"}</span>
                </span>
                <span className="chip-difficulty" data-level="medium">
                  <span className="chip-dot" />
                  <span>{isHindi ? "मध्यम" : "Medium"}</span>
                </span>
                <span className="chip-difficulty" data-level="hard">
                  <span className="chip-dot" />
                  <span>{isHindi ? "कठिन" : "Hard"}</span>
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase mb-3">Tabular Numerals (Timers, XP, Scores)</h3>
              <div className="flex flex-wrap items-center gap-4">
                <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] flex items-center gap-2">
                  <Clock size={16} className="text-[var(--brand-primary)]" />
                  <span className="tabular-nums font-bold text-sm tracking-wider">00:29.4</span>
                </div>
                <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] flex items-center gap-2">
                  <Zap size={16} className="text-amber-500" />
                  <span className="tabular-nums font-bold text-sm">1,450 XP</span>
                </div>
                <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] flex items-center gap-2">
                  <Flame size={16} className="text-orange-500" />
                  <span className="tabular-nums font-bold text-sm">🔥 7 Days</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Card Radii & Elevation Levels */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-subtle)]">
            <Box size={20} className="text-[var(--brand-primary)]" />
            <h2 className="text-xl font-bold">5. Card Radii (16px) & 2 Elevation Levels</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Level 1 Elevation */}
            <div className="p-5 rounded-[var(--radius-card)] bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--elevation-1)]">
              <span className="text-xs font-bold text-[var(--brand-primary)] uppercase">Elevation 1 (Default)</span>
              <h3 className="text-base font-bold text-[var(--text-primary)] mt-1">Standard Card Surface</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Subtle border with smooth 16px radius for high visual clarity on both mobile and desktop.
              </p>
            </div>

            {/* Level 2 Elevation */}
            <div className="p-5 rounded-[var(--radius-card)] bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--elevation-2)]">
              <span className="text-xs font-bold text-[var(--tier-accent)] uppercase">Elevation 2 (Floating)</span>
              <h3 className="text-base font-bold text-[var(--text-primary)] mt-1">Interactive Hover Surface</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Used for modal popups, active cards, and hover elevation states across all tiers.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Motion Tokens & Interactive States */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-subtle)]">
            <Sparkles size={20} className="text-[var(--brand-primary)]" />
            <h2 className="text-xl font-bold">6. Motion Tokens & Answer Feedback</h2>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--radius-card)] p-5 shadow-[var(--shadow-sm)] space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Short bounce on correct answer, short shake on wrong answer, 150-250ms ease-out transitions.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => triggerAnim("correct")}
                className={`btn-primary bg-emerald-600 hover:bg-emerald-500 border-emerald-600 ${animState === "correct" ? "animate-correct" : ""}`}
              >
                ✓ Test Correct Bounce
              </button>

              <button
                type="button"
                onClick={() => triggerAnim("wrong")}
                className={`btn-primary bg-rose-600 hover:bg-rose-500 border-rose-600 ${animState === "wrong" ? "animate-wrong" : ""}`}
              >
                ✕ Test Wrong Shake
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
