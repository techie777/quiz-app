"use client";

import React from "react";
import { Languages } from "lucide-react";

export default function LanguageConfirmModal({ isOpen, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(3, 7, 18, 0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
        padding: "16px",
        animation: "langFadeIn 0.2s ease-out",
      }}
    >
      <style jsx>{`
        @keyframes langFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes langCardSlide {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .langOptionBtn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px 24px;
          min-height: 56px;
          border-radius: var(--radius-sm, 12px);
          font-family: var(--font-family-base);
          font-size: 1.15rem;
          font-weight: 700;
          cursor: pointer;
          border: 1.5px solid var(--border-medium, #cbd5e1);
          background: var(--bg-secondary, #ffffff);
          color: var(--text-primary, #0f172a);
          transition: all 0.2s ease-out;
          box-shadow: var(--elevation-1);
          width: 100%;
        }
        @media (hover: hover) {
          .langOptionBtn:hover {
            border-color: var(--brand-primary, #6366f1);
            background: var(--brand-primary-light, rgba(99, 102, 241, 0.1));
            color: var(--brand-primary, #6366f1);
            transform: translateY(-1px);
          }
        }
        .langOptionBtn:active {
          transform: scale(0.985);
        }
        .langOptionBtn:focus-visible {
          outline: 2px solid var(--brand-primary, #6366f1);
          outline-offset: 2px;
        }
      `}</style>

      <div
        style={{
          background: "var(--card-bg, #ffffff)",
          border: "1.5px solid var(--card-border, #e2e8f0)",
          borderRadius: "var(--radius-card, 16px)",
          padding: "32px 24px",
          maxWidth: "380px",
          width: "100%",
          boxShadow: "var(--elevation-2)",
          textAlign: "center",
          animation: "langCardSlide 0.25s ease-out",
        }}
      >
        <div
          style={{
            width: "52px",
            height: "52px",
            margin: "0 auto 16px",
            background: "var(--brand-primary-light, rgba(99, 102, 241, 0.12))",
            border: "1px solid var(--border-subtle, #e2e8f0)",
            borderRadius: "var(--radius-sm, 12px)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Languages size={24} className="text-[var(--brand-primary)]" />
        </div>

        <h2
          style={{
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--text-h2, 1.25rem)",
            fontWeight: "700",
            color: "var(--text-primary, #0f172a)",
            margin: "0 0 24px",
            lineHeight: "1.4",
          }}
        >
          भाषा चुनें / Language
        </h2>

        {/* Two Big Buttons: हिन्दी and English (No paragraphs) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            type="button"
            className="langOptionBtn"
            onClick={() => onConfirm("hi")}
            aria-label="Select Hindi language"
          >
            हिन्दी
          </button>

          <button
            type="button"
            className="langOptionBtn"
            onClick={() => onConfirm("en")}
            aria-label="Select English language"
          >
            English
          </button>
        </div>
      </div>
    </div>
  );
}
