"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function RewardedAdModal() {
  const [activeAd, setActiveAd] = useState(null);
  const [timeLeft, setTimeLeft] = useState(5);
  const [rewardGranted, setRewardGranted] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const handleOpen = (e) => {
      setActiveAd(e.detail);
      setTimeLeft(5);
      setRewardGranted(false);
    };

    window.addEventListener("quizweb_show_rewarded_sim", handleOpen);
    return () => {
      window.removeEventListener("quizweb_show_rewarded_sim", handleOpen);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!activeAd) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setRewardGranted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeAd]);

  if (!activeAd) return null;

  const handleClaimReward = () => {
    if (activeAd?.onReward) {
      activeAd.onReward();
    }
    setActiveAd(null);
  };

  const handleDismiss = () => {
    if (rewardGranted) {
      handleClaimReward();
      return;
    }
    if (window.confirm("Close ad now? You will not receive the reward to continue.")) {
      if (activeAd?.onDismiss) {
        activeAd.onDismiss();
      }
      setActiveAd(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(6px)",
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
          maxWidth: "380px",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Ad Header */}
        <div
          style={{
            padding: "12px 16px",
            background: "#F8FAFC",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                background: "#EEF2FF",
                color: "#4F46E5",
                padding: "2px 8px",
                borderRadius: "6px",
                letterSpacing: "0.5px",
              }}
            >
              REWARDED AD
            </span>
            <span style={{ fontSize: "12px", color: "#64748B" }}>
              {rewardGranted ? "Completed" : `Reward in ${timeLeft}s`}
            </span>
          </div>

          <button
            onClick={handleDismiss}
            style={{
              background: "none",
              border: "none",
              color: "#94A3B8",
              fontSize: "18px",
              cursor: "pointer",
              padding: "4px 8px",
              minWidth: "44px",
              minHeight: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Close Ad"
          >
            ✕
          </button>
        </div>

        {/* Sponsor Content Frame */}
        <div
          style={{
            padding: "24px 20px",
            textAlign: "center",
            background: "linear-gradient(135deg, #EEF2FF 0%, #FAF5FF 100%)",
            borderBottom: "1px solid #E2E8F0",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "#4F46E5",
              color: "#FFFFFF",
              fontSize: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.3)",
            }}
          >
            ✨
          </div>

          <h3
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#1E293B",
              marginBottom: "6px",
            }}
          >
            Upgrade to QuizWeb Pro
          </h3>
          <p
            style={{
              fontSize: "13px",
              color: "#64748B",
              lineHeight: 1.5,
              marginBottom: "16px",
            }}
          >
            Enjoy all 4 modules (School, Exams, Explorer, Arena) completely ad-free with unlimited quiz sets!
          </p>

          {/* Progress Bar */}
          <div
            style={{
              width: "100%",
              height: "6px",
              background: "#E2E8F0",
              borderRadius: "999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: rewardGranted ? "100%" : `${((5 - timeLeft) / 5) * 100}%`,
                height: "100%",
                background: rewardGranted ? "#10B981" : "#6366F1",
                transition: "width 1s linear, background-color 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Action Bottom */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {rewardGranted ? (
            <button
              onClick={handleClaimReward}
              style={{
                width: "100%",
                padding: "12px",
                background: "#10B981",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "12px",
                fontWeight: 600,
                fontSize: "15px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                minHeight: "44px",
              }}
            >
              <span>✓ Reward Granted! Continue</span>
            </button>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                fontSize: "13px",
                color: "#64748B",
                minHeight: "44px",
              }}
            >
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  border: "2px solid #6366F1",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              <span>Watching sponsor ad ({timeLeft}s remaining)...</span>
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "4px",
            }}
          >
            <Link
              href="/pro"
              onClick={() => setActiveAd(null)}
              style={{
                fontSize: "12px",
                color: "#4F46E5",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Go Pro (No Ads) →
            </Link>

            <button
              onClick={handleDismiss}
              style={{
                background: "none",
                border: "none",
                fontSize: "12px",
                color: "#94A3B8",
                cursor: "pointer",
                padding: "4px 8px",
              }}
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
