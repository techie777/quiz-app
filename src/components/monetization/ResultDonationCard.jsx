"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, X } from "lucide-react";
import { useTier } from "@/context/TierContext";

export default function ResultDonationCard() {
  const { tier } = useTier();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 1. Strictly NEVER show in Kids
    if (tier === "kids") return;

    // 2. Check if shown today (at most once a day)
    const today = new Date().toISOString().split("T")[0];
    const lastShown = localStorage.getItem("quizweb_last_donation_appeal_date");
    if (lastShown === today) return;

    setVisible(true);
  }, [tier]);

  const handleDismiss = () => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem("quizweb_last_donation_appeal_date", today);
    setVisible(false);
  };

  if (!visible) return null;

  const isStudents = tier === "students";

  return (
    <div
      style={{
        margin: "16px 0",
        padding: "14px 16px",
        background: "linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)",
        border: "1px solid #FECDD3",
        borderRadius: "18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#E11D48",
            color: "#FFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Heart size={18} fill="#FFF" />
        </div>
        <div>
          <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#9F1239", margin: 0 }}>
            Help keep QuizWeb independent
          </h4>
          <p style={{ fontSize: "11px", color: "#BE123C", margin: "2px 0 0", lineHeight: 1.4 }}>
            {isStudents
              ? "Your support powers free education (Ask a parent or guardian)."
              : "A small ₹49 contribution keeps quizzes free for all learners."}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <Link
          href="/support"
          onClick={handleDismiss}
          style={{
            padding: "8px 14px",
            background: "#E11D48",
            color: "#FFFFFF",
            borderRadius: "10px",
            fontSize: "12px",
            fontWeight: 700,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Support
        </Link>
        <button
          onClick={handleDismiss}
          style={{
            background: "none",
            border: "none",
            color: "#9F1239",
            cursor: "pointer",
            padding: "6px",
            minWidth: "36px",
            minHeight: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Dismiss donation card"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
