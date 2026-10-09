"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CATEGORY_SLUG_TO_FILE, getCategoryCardImageUrl, getCategoryGradientHue } from "@/lib/categoryCardImages";

export default function CategoryCard({ category, isHindi = false }) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (!category) return null;

  const slug = category.slug || "";
  const isLive = category.status === "live" || (category.questionCount && category.questionCount > 0);
  
  // English name and Hindi name
  const enTitle = category.name || category.topic || "";
  const hiSubtitle = category.nameHi || category.topicHi || "";
  const shortDesc = category.example || category.description || "";
  
  // Questions count or short description
  const qCount = Number(
    category.questionCount ??
    category.questionsCount ??
    category.count ??
    category._count?.questions ??
    0
  );
  const metaText = qCount > 0
    ? (isHindi ? `${qCount.toLocaleString("en-IN")} प्रश्न` : `${qCount.toLocaleString("en-IN")} Questions`)
    : (isHindi && category.descriptionHi ? category.descriptionHi : shortDesc);

  // Background hue for soft gradient fallback tile
  const hue = getCategoryGradientHue(slug);
  const fallbackBg = `linear-gradient(145deg, hsl(${hue} 85% 90%), hsl(${(hue + 40) % 360} 80% 80%))`;
  const fallbackBgDark = `linear-gradient(145deg, hsl(${hue} 45% 22%), hsl(${(hue + 40) % 360} 40% 16%))`;

  const emoji = category.icon || category.emoji || "📚";
  const imageSrc = getCategoryCardImageUrl(category);

  const handleComingSoonClick = (e) => {
    e.preventDefault();
    toast("Coming soon — we'll notify you", {
      icon: "⏳",
      style: {
        borderRadius: "99px",
        background: "var(--card, #181b33)",
        color: "var(--ink, #f1f2ff)",
        border: "1px solid var(--line, #262a4a)",
        fontSize: "13px",
        fontWeight: 600,
      },
    });
  };

  const cardBaseClasses = "c-card relative rounded-2xl overflow-hidden flex flex-col no-underline select-none transition-all duration-200 bg-white dark:bg-[#0f1424] border border-slate-200/90 dark:border-slate-800/80 hover:border-indigo-500/60 dark:hover:border-indigo-400/50 hover:shadow-lg hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/5 hover:-translate-y-1 active:scale-[0.98]";

  const CardInner = (
    <>
      {/* 1. Square thumbnail */}
      <div
        className="c-thumbnail w-full aspect-square relative grid place-items-center text-5xl overflow-hidden"
        style={{
          background: fallbackBg,
        }}
      >
        <span className="c-emoji select-none" aria-hidden="true">{emoji}</span>
        
        {!imgError && imageSrc && (
          <>
            <img
              src={imageSrc}
              alt={enTitle}
              width={300}
              height={300}
              loading="lazy"
              onError={() => setImgError(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 ${
                !isLive ? "saturate-[0.55] opacity-85" : "group-hover:scale-105"
              } ${isHovered ? "scale-105" : "scale-100"}`}
            />
            {/* Subtle bottom vignette for depth */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none"
            />
          </>
        )}

        {/* 2. Status pill overlaid at top-left */}
        <span
          className={`c-status-pill absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide backdrop-blur-md shadow-md z-10 ${
            isLive
              ? "bg-emerald-600/95 text-white shadow-emerald-950/20"
              : "bg-slate-900/85 text-slate-200 border border-white/10"
          }`}
        >
          {isLive ? (isHindi ? "● लाइव" : "● Live") : (isHindi ? "जल्द आ रहा है" : "Coming soon")}
        </span>
      </div>

      {/* Card Body */}
      <div className="c-body p-2.5 sm:p-3 flex flex-col flex-1 justify-between gap-1">
        <div>
          {/* 3. Title */}
          <h3 className="text-[13.5px] sm:text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight m-0">
            {enTitle}
          </h3>

          {/* 4. Hindi subtitle on ONE line with ellipsis */}
          {hiSubtitle && (
            <div
              className="text-[11.5px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate leading-tight font-medium"
              style={{ fontFamily: "'Noto Sans Devanagari', Poppins, sans-serif" }}
            >
              {hiSubtitle}
            </div>
          )}
        </div>

        {/* 5. Meta line */}
        {metaText && (
          <div className="text-[10.5px] sm:text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-1 truncate">
            {metaText}
          </div>
        )}
      </div>
    </>
  );

  if (!isLive) {
    return (
      <div
        onClick={handleComingSoonClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleComingSoonClick(e);
        }}
        className={`${cardBaseClasses} is-soon cursor-pointer opacity-90`}
      >
        {CardInner}
      </div>
    );
  }

  const destinationUrl = category.href || `/category/${slug}`;

  return (
    <Link
      href={destinationUrl}
      prefetch={true}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onPointerDown={() => {
        try {
          router.prefetch(destinationUrl);
        } catch {}
      }}
      className={`${cardBaseClasses} is-live group`}
    >
      {CardInner}
    </Link>
  );
}
