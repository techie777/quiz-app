"use client";

import React, { useState } from "react";
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
  
  // Topics count or short description
  const topicsCount = category.topics_count || (category.questionCount ? Math.max(1, Math.min(100, Math.ceil(category.questionCount / 10) * 10)) : 0);
  const metaText = isLive && topicsCount > 0
    ? (isHindi ? `${topicsCount} विषय` : `${topicsCount} topics`)
    : (isHindi && category.descriptionHi ? category.descriptionHi : shortDesc);

  // Background hue for soft gradient fallback tile
  const hue = getCategoryGradientHue(slug);
  const fallbackBg = `linear-gradient(145deg, hsl(${hue} 85% 90%), hsl(${(hue + 40) % 360} 80% 80%))`;
  const fallbackBgDark = `linear-gradient(145deg, hsl(${hue} 45% 22%), hsl(${(hue + 40) % 360} 40% 16%))`;

  const emoji = category.icon || category.emoji || "📚";
  const imageSrc = getCategoryCardImageUrl(category);

  const handleClick = (e) => {
    e.preventDefault();
    if (!isLive) {
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
      return;
    }
    router.push(`/category/${slug}`);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick(e);
      }}
      className={`c-card ${!isLive ? "is-soon" : "is-live"}`}
      style={{
        background: "var(--card, #ffffff)",
        border: isHovered ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid var(--line, #e8eaf5)",
        borderRadius: "18px",
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        WebkitTapHighlightColor: "transparent",
        userSelect: "none",
        transform: isHovered ? "translateY(-4px)" : "none",
        boxShadow: isHovered
          ? "0 14px 28px -6px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(99, 102, 241, 0.25)"
          : "0 2px 6px rgba(0, 0, 0, 0.04)",
        transition: "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.22s ease",
      }}
    >
      {/* 1. Square 1:1 thumbnail */}
      <div
        className="c-thumbnail"
        style={{
          aspectRatio: "1/1",
          position: "relative",
          display: "grid",
          placeItems: "center",
          fontSize: "54px",
          overflow: "hidden",
          background: fallbackBg,
        }}
      >
        <span className="c-emoji" aria-hidden="true">{emoji}</span>
        
        {!imgError && imageSrc && (
          <>
            <img
              src={imageSrc}
              alt={enTitle}
              width={300}
              height={300}
              loading="lazy"
              onError={() => setImgError(true)}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: !isLive ? "saturate(0.55)" : "none",
                opacity: !isLive ? 0.85 : 1,
                transform: isHovered ? "scale(1.06)" : "scale(1)",
                transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
            {/* Subtle bottom vignette for depth */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(15, 23, 42, 0.35) 0%, rgba(15, 23, 42, 0) 45%)",
                pointerEvents: "none",
              }}
            />
          </>
        )}

        {/* 2. Status pill overlaid at top-left */}
        <span
          className={`c-status-pill ${isLive ? "live" : "soon"}`}
          style={{
            position: "absolute",
            top: "8px",
            left: "8px",
            background: isLive ? "#16a34a" : "rgba(20, 22, 43, 0.72)",
            color: "#ffffff",
            fontSize: "10.5px",
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: "99px",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            lineHeight: 1.2,
            zIndex: 2,
            maxWidth: "calc(100% - 16px)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {isLive ? (isHindi ? "● लाइव" : "● Live") : (isHindi ? "जल्द आ रहा है" : "Coming soon")}
        </span>
      </div>

      {/* Card Body */}
      <div
        className="c-body"
        style={{
          padding: "10px 12px 12px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "space-between",
        }}
      >
        <div>
          {/* 3. Title (14px, semibold, max 2 lines) */}
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 600,
              lineHeight: 1.25,
              color: "var(--ink, #14162b)",
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {enTitle}
          </h3>

          {/* 4. Hindi subtitle on ONE line with ellipsis */}
          {hiSubtitle && (
            <div
              className="hi"
              style={{
                fontFamily: "'Noto Sans Devanagari', Poppins, sans-serif",
                fontSize: "12px",
                color: "var(--mute, #6b7190)",
                marginTop: "2px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.3,
              }}
            >
              {hiSubtitle}
            </div>
          )}
        </div>

        {/* 5. Meta line (11px, muted) */}
        {metaText && (
          <div
            className="c-meta"
            style={{
              fontSize: "11px",
              color: "var(--mute, #6b7190)",
              marginTop: "7px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {metaText}
          </div>
        )}
      </div>
    </div>
  );
}
