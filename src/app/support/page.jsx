"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, CheckCircle2, ShieldHeart, QrCode } from "lucide-react";
import { DONATION_PRESETS, DEFAULT_APPEAL_TEXT } from "@/lib/monetizationConfig";
import { useTier } from "@/context/TierContext";
import toast from "react-hot-toast";

export default function SupportUsPage() {
  const router = useRouter();
  const { tier } = useTier();

  const [selectedAmount, setSelectedAmount] = useState(49);
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [thankYou, setThankYou] = useState(false);

  const effectiveAmount = isCustom ? Number(customAmount) || 0 : selectedAmount;

  const handleSelectPreset = (amount) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmount("");
  };

  const handleCustomFocus = () => {
    setIsCustom(true);
  };

  const handleDonate = async () => {
    if (effectiveAmount < 1) {
      toast.error("Please enter a valid contribution amount");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/checkout/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "donation",
          customAmount: effectiveAmount,
          donorName,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to initialize payment");
      }

      if (typeof window !== "undefined" && window.Razorpay) {
        const options = {
          key: data.key,
          amount: data.order.amount,
          currency: data.order.currency,
          name: "QuizWeb Contribution",
          description: "Voluntary Education Support",
          order_id: data.order.id,
          handler: async function (response) {
            await recordDonation(response.razorpay_payment_id);
          },
          prefill: {
            name: donorName || "QuizWeb Supporter",
          },
          theme: { color: "#E11D48" },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Simulated UPI / Razorpay payment
        const confirmed = window.confirm(
          `Simulate contribution of ₹${effectiveAmount} via UPI/Card?`
        );
        if (confirmed) {
          await recordDonation(`sim_don_${Date.now()}`);
        }
      }
    } catch (err) {
      toast.error(err.message || "Contribution error");
    } finally {
      setLoading(false);
    }
  };

  const recordDonation = async (paymentId) => {
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: effectiveAmount,
          donorName,
          paymentId,
          tier,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setThankYou(true);
      }
    } catch (e) {
      toast.error("Failed to record contribution");
    }
  };

  if (thankYou) {
    return (
      <div style={{ minHeight: "100vh", background: "#FFFFFF", padding: "24px 16px", textAlign: "center" }}>
        <div style={{ maxWidth: "400px", margin: "60px auto 0" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "#FEE2E2",
              color: "#E11D48",
              fontSize: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            ❤️
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#1E293B", marginBottom: "8px" }}>
            Thank You for Your Support!
          </h2>
          <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.6, marginBottom: "24px" }}>
            Your voluntary contribution of <strong>₹{effectiveAmount}</strong> keeps QuizWeb ad-free for students and helps us build top-tier learning quizzes for everyone.
          </p>
          <button
            onClick={() => router.push("/")}
            style={{
              padding: "14px 28px",
              background: "#4F46E5",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "14px",
              fontWeight: 700,
              fontSize: "15px",
              cursor: "pointer",
              minHeight: "44px",
            }}
          >
            Return to Quizzes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: "60px" }}>
      {/* Top Bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #E2E8F0",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "none",
            padding: "8px",
            minWidth: "44px",
            minHeight: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#475569",
          }}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#1E293B" }}>Support Us</h1>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: "440px", margin: "0 auto", padding: "20px 16px" }}>
        {/* Appeal Card */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "24px",
            padding: "24px 20px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "#FFE4E6",
              color: "#E11D48",
              fontSize: "26px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            💝
          </div>

          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#1E293B", marginBottom: "8px" }}>
            {DEFAULT_APPEAL_TEXT.titleEn}
          </h2>
          <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.6, marginBottom: "8px" }}>
            {DEFAULT_APPEAL_TEXT.subtitleEn}
          </p>
          <p style={{ fontSize: "12px", color: "#94A3B8", fontStyle: "italic", marginBottom: "20px" }}>
            "{DEFAULT_APPEAL_TEXT.subtitleHi}"
          </p>

          {/* Preset Buttons */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "8px",
              marginBottom: "14px",
            }}
          >
            {DONATION_PRESETS.map((p) => {
              const isSelected = !isCustom && selectedAmount === p.amount;
              return (
                <button
                  key={p.amount}
                  type="button"
                  onClick={() => handleSelectPreset(p.amount)}
                  style={{
                    padding: "12px 6px",
                    borderRadius: "14px",
                    border: isSelected ? "2px solid #E11D48" : "1px solid #E2E8F0",
                    background: isSelected ? "#FFF1F2" : "#FFFFFF",
                    color: isSelected ? "#E11D48" : "#1E293B",
                    fontWeight: 700,
                    fontSize: "15px",
                    cursor: "pointer",
                    minHeight: "44px",
                    transition: "all 0.15s ease",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Custom Amount Input */}
          <div style={{ marginBottom: "16px" }}>
            <input
              type="number"
              placeholder="Or enter custom amount (₹)"
              value={customAmount}
              onFocus={handleCustomFocus}
              onChange={(e) => {
                setIsCustom(true);
                setCustomAmount(e.target.value);
              }}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "12px",
                border: isCustom ? "2px solid #E11D48" : "1px solid #CBD5E1",
                fontSize: "14px",
                textAlign: "center",
                background: isCustom ? "#FFF1F2" : "#FFFFFF",
              }}
            />
          </div>

          {/* Optional Donor Name */}
          <div style={{ marginBottom: "20px" }}>
            <input
              type="text"
              placeholder="Your Name (Optional)"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "12px",
                border: "1px solid #CBD5E1",
                fontSize: "14px",
              }}
            />
          </div>

          {/* Donate CTA */}
          <button
            type="button"
            onClick={handleDonate}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: "#E11D48",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "14px",
              fontWeight: 700,
              fontSize: "16px",
              cursor: "pointer",
              boxShadow: "0 10px 15px -3px rgba(225, 29, 72, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              minHeight: "50px",
            }}
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <span>Contribute ₹{effectiveAmount} via UPI</span>
            )}
          </button>
        </div>

        {/* Note on Transparency */}
        <div style={{ textAlign: "center", fontSize: "12px", color: "#94A3B8", lineHeight: 1.5 }}>
          <span>🔒 100% Secure UPI Transaction • QuizWeb is community supported</span>
        </div>
      </div>
    </div>
  );
}
