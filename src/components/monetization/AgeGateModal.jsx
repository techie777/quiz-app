"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getAgeConsent, setAgeConsent } from "@/lib/adProvider";

export default function AgeGateModal() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only ask on Explorer or Arena routes
    const isExplorerOrArena =
      pathname === "/" ||
      pathname.startsWith("/category") ||
      pathname.startsWith("/fun-quizzes") ||
      pathname.startsWith("/arena") ||
      pathname.startsWith("/quiz");

    if (!isExplorerOrArena) return;

    // Check if user already responded
    const consent = getAgeConsent();
    if (!consent.asked) {
      setIsOpen(true);
    }
  }, [pathname]);

  if (!isOpen) return null;

  const handleSelection = (is18Plus) => {
    setAgeConsent(is18Plus);
    setIsOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99998,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "360px",
          padding: "24px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            background: "#EEF2FF",
            color: "#4F46E5",
            fontSize: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          🛡️
        </div>

        <h3
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#1E293B",
            marginBottom: "8px",
          }}
        >
          Age Verification
        </h3>
        <p
          style={{
            fontSize: "13px",
            color: "#64748B",
            lineHeight: 1.5,
            marginBottom: "20px",
          }}
        >
          Are you 18 years or older? This helps us serve age-appropriate content and respect your privacy preferences.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            onClick={() => handleSelection(true)}
            style={{
              width: "100%",
              padding: "12px",
              background: "#4F46E5",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "12px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              minHeight: "44px",
            }}
          >
            Yes, I am 18 or older
          </button>

          <button
            onClick={() => handleSelection(false)}
            style={{
              width: "100%",
              padding: "12px",
              background: "#F1F5F9",
              color: "#475569",
              border: "1px solid #E2E8F0",
              borderRadius: "12px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              minHeight: "44px",
            }}
          >
            No, I am under 18
          </button>
        </div>
      </div>
    </div>
  );
}
