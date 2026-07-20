"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { BADGES, getUnlockedBadges, getBadgeStats } from "@/lib/badgeManager";
import { useLanguage } from "@/context/LanguageContext";

export default function BadgesModal({ isOpen, onClose }) {
  const { isHindi } = useLanguage();
  const [unlocked, setUnlocked] = useState([]);
  const [stats, setStats] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setUnlocked(getUnlockedBadges());
      setStats(getBadgeStats());
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const unlockedSet = new Set(unlocked);
  const totalBadges = BADGES.length;
  const unlockedCount = unlocked.length;
  const progressPercent = Math.round((unlockedCount / totalBadges) * 100);

  const modalContent = (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.75)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      zIndex: 999999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px"
    }}>
      <div style={{
        backgroundColor: "var(--bg-primary, #0f172a)",
        border: "1px solid rgba(99, 102, 241, 0.3)",
        borderRadius: "24px",
        width: "100%",
        maxWidth: "540px",
        maxHeight: "85vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
              🏆 {isHindi ? "उपलब्धियां और बैज" : "Achievements & Badges"}
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", opacity: 0.9 }}>
              {isHindi ? `आपने ${totalBadges} में से ${unlockedCount} बैज अनलॉक किए हैं` : `Unlocked ${unlockedCount} of ${totalBadges} badges`}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              color: "#ffffff",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: "1.1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ padding: "16px 24px 8px 24px", backgroundColor: "rgba(99, 102, 241, 0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: "700", marginBottom: "6px", color: "var(--text-secondary, #94a3b8)" }}>
            <span>{isHindi ? "कुल प्रगति" : "Total Progress"}</span>
            <span style={{ color: "#a855f7" }}>{progressPercent}%</span>
          </div>
          <div style={{ width: "100%", height: "10px", backgroundColor: "rgba(99, 102, 241, 0.2)", borderRadius: "999px", overflow: "hidden" }}>
            <div style={{ width: `${progressPercent}%`, height: "100%", background: "linear-gradient(90deg, #6366f1, #a855f7)", transition: "width 0.4s ease" }} />
          </div>
        </div>

        {/* Badges Grid */}
        <div style={{
          padding: "16px 24px 24px 24px",
          overflowY: "auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "14px"
        }}>
          {BADGES.map((b) => {
            const isUnlocked = unlockedSet.has(b.id);
            let val = 0;
            if (b.category === "uniqueCategories") {
              val = stats.uniqueCategories?.length || 0;
            } else {
              val = stats[b.category] || 0;
            }

            return (
              <div
                key={b.id}
                style={{
                  padding: "14px",
                  borderRadius: "16px",
                  border: isUnlocked ? "2px solid #f59e0b" : "1px solid var(--card-border, rgba(148, 163, 184, 0.2))",
                  background: isUnlocked ? "linear-gradient(135deg, rgba(254, 243, 199, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)" : "var(--bg-secondary, rgba(30, 41, 59, 0.5))",
                  opacity: isUnlocked ? 1 : 0.65,
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "2.2rem", filter: isUnlocked ? "drop-shadow(0 2px 8px rgba(245, 158, 11, 0.5))" : "grayscale(1)" }}>
                    {b.icon}
                  </span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700", color: "var(--text-primary, #f8fafc)" }}>
                      {isHindi ? b.titleHi : b.title}
                    </h4>
                    <span style={{ fontSize: "0.75rem", color: isUnlocked ? "#f59e0b" : "var(--text-muted, #64748b)", fontWeight: "700" }}>
                      {isUnlocked ? (isHindi ? "✓ अनलॉक्ड" : "✓ Unlocked") : `${val}/${b.req}`}
                    </span>
                  </div>
                </div>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "var(--text-secondary, #cbd5e1)", lineHeight: "1.3" }}>
                  {isHindi ? b.descHi : b.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
