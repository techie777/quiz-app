"use client";

import React from "react";
import "@/styles/FlashDeck.css";

/**
 * CardDecorations:
 * Ambient whimsical decorative accents for flashcards:
 * - Twinkling 4-point sparkle stars
 * - Blinking mini stars
 * - Subtle drifting soft cloud shapes in the background
 */
export default function CardDecorations({ showCloud = true, showSparkles = true }) {
  return (
    <div className="fd-decorations" aria-hidden="true">
      {/* Soft drifting background cloud */}
      {showCloud && (
        <svg
          className="fd-decor-cloud fd-decor-cloud-1"
          width="74"
          height="42"
          viewBox="0 0 74 42"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M58 36H16C10.4772 36 6 31.5228 6 26C6 20.9167 9.80376 16.7198 14.7381 16.0827C16.4851 9.20815 22.7099 4 30.1667 4C38.0772 4 44.5779 9.85199 45.6983 17.3828C46.8532 17.1324 48.0537 17 49.2857 17C55.7551 17 61 22.2449 61 28.7143C61 29.3512 60.949 29.9763 60.8507 30.5849C64.4444 31.3976 67.1429 34.6074 67.1429 38.4286"
            fill="#EEF2F6"
            opacity="0.75"
          />
        </svg>
      )}

      {showCloud && (
        <svg
          className="fd-decor-cloud fd-decor-cloud-2"
          width="52"
          height="30"
          viewBox="0 0 52 30"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M42 26H12C7.58172 26 4 22.4183 4 18C4 13.9334 7.043 10.5758 10.9905 10.0662C12.3881 4.56652 17.3679 0.4 23.3333 0.4C29.6618 0.4 34.8623 5.08159 35.7586 11.1062C36.6826 10.9059 37.643 10.8 38.6286 10.8C43.8041 10.8 48 14.9959 48 20.1714C48 20.681 47.9592 21.181 47.8806 21.6679C50.7556 22.3181 52.9143 24.8859 52.9143 27.9429"
            fill="#F3F0FF"
            opacity="0.65"
          />
        </svg>
      )}

      {/* Sparkling 4-point stars */}
      {showSparkles && (
        <>
          {/* Top-right sparkle (warm amber/gold) */}
          <svg
            className="fd-sparkle fd-sparkle-1"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"
              fill="#F59E0B"
            />
          </svg>

          {/* Mid-left sparkle (indigo/lavender) */}
          <svg
            className="fd-sparkle fd-sparkle-2"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"
              fill="#818CF8"
            />
          </svg>

          {/* Bottom-right sparkle (soft teal/mint) */}
          <svg
            className="fd-sparkle fd-sparkle-3"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"
              fill="#10B981"
            />
          </svg>

          {/* Tiny blinking star dots */}
          <span className="fd-blink-dot fd-blink-dot-1" />
          <span className="fd-blink-dot fd-blink-dot-2" />
          <span className="fd-blink-dot fd-blink-dot-3" />
        </>
      )}
    </div>
  );
}
