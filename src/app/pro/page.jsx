"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Sparkles, Shield, Zap, Lock, CreditCard } from "lucide-react";
import { PRO_PLANS } from "@/lib/monetizationConfig";
import { useTier } from "@/context/TierContext";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function ProPricingPage() {
  const router = useRouter();
  const { tier } = useTier();
  const { data: session } = useSession();

  const [selectedPlanId, setSelectedPlanId] = useState("plan_1y");
  const [loading, setLoading] = useState(false);
  const [showParentGate, setShowParentGate] = useState(false);
  const [parentMathAnswer, setParentMathAnswer] = useState("");
  const [mathProblem, setMathProblem] = useState({ q: "8 × 7", a: 56 });

  const isKidsOrStudents = tier === "kids" || tier === "students";

  const handleSelectPlan = (planId) => {
    setSelectedPlanId(planId);
  };

  const startCheckout = async () => {
    if (isKidsOrStudents && !showParentGate) {
      // Generate a new random math question
      const num1 = Math.floor(Math.random() * 6) + 4;
      const num2 = Math.floor(Math.random() * 7) + 3;
      setMathProblem({ q: `${num1} × ${num2}`, a: num1 * num2 });
      setParentMathAnswer("");
      setShowParentGate(true);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/checkout/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlanId, type: "subscription" }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to initialize payment");
      }

      // Check if window.Razorpay is loaded
      if (typeof window !== "undefined" && window.Razorpay) {
        const options = {
          key: data.key,
          amount: data.order.amount,
          currency: data.order.currency,
          name: "QuizWeb Pro",
          description: `Subscription Pass (${data.order.planId})`,
          order_id: data.order.id,
          handler: async function (response) {
            await activateSubscription(response.razorpay_payment_id, data.order.id);
          },
          prefill: {
            name: data.user.name,
            email: data.user.email,
          },
          theme: { color: "#4F46E5" },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Simulated UPI / Razorpay test modal
        await simulatePaymentActivation(data.order.id);
      }
    } catch (err) {
      toast.error(err.message || "Payment initialization failed");
    } finally {
      setLoading(false);
    }
  };

  const activateSubscription = async (paymentId, orderId) => {
    try {
      const devId = localStorage.getItem("quiz_device_id") || "guest";
      const res = await fetch("/api/subscriptions/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlanId,
          paymentId,
          orderId,
          deviceId: devId,
        }),
      });
      const result = await res.json();
      if (result.success) {
        localStorage.setItem("user_is_pro", "true");
        toast.success("Welcome to QuizWeb Pro! 🎉");
        router.push("/");
      } else {
        toast.error(result.error || "Activation failed");
      }
    } catch (e) {
      toast.error("Error activating subscription");
    }
  };

  const simulatePaymentActivation = async (orderId) => {
    const confirmPayment = window.confirm(
      "Simulate UPI / Card payment of ₹" +
        PRO_PLANS.find((p) => p.id === selectedPlanId)?.price +
        "?"
    );
    if (confirmPayment) {
      await activateSubscription(`sim_pay_${Date.now()}`, orderId);
    }
  };

  const handleParentGateSubmit = (e) => {
    e.preventDefault();
    if (parseInt(parentMathAnswer, 10) === mathProblem.a) {
      setShowParentGate(false);
      startCheckout();
    } else {
      toast.error("Incorrect answer. Please ask a parent or guardian to assist.");
      setParentMathAnswer("");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: "60px" }}>
      {/* Top Header */}
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
        <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#1E293B" }}>QuizWeb Pro</h1>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "20px 16px" }}>
        {/* Hero Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
            borderRadius: "24px",
            padding: "28px 20px",
            color: "#FFFFFF",
            textAlign: "center",
            marginBottom: "24px",
            boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.3)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255, 255, 255, 0.2)",
              padding: "4px 12px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.5px",
              marginBottom: "12px",
            }}
          >
            <Sparkles size={14} />
            <span>UNLIMITED PASS</span>
          </div>

          <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px", lineHeight: 1.2 }}>
            Master Any Topic Faster
          </h2>
          <p style={{ fontSize: "14px", opacity: 0.9, lineHeight: 1.5, margin: "0 auto", maxWidth: "340px" }}>
            One plan for all 4 modules. No limits, no ads.
          </p>

          {/* Features Checkpoints */}
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              textAlign: "left",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              padding: "14px 16px",
            }}
          >
            {[
              "Unlimited daily quiz sets across all tiers",
              "100% ad-free experience with zero interruptions",
              "Full question explanations unlocked instantly",
              "Unlimited share card downloads & duel stats",
            ].map((feature, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "#10B981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Check size={12} color="#FFF" strokeWidth={3} />
                </span>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Plan Selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
          {PRO_PLANS.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => handleSelectPlan(plan.id)}
                style={{
                  position: "relative",
                  background: isSelected ? "#FFFFFF" : "#FFFFFF",
                  border: isSelected ? "2px solid #4F46E5" : "1px solid #E2E8F0",
                  borderRadius: "18px",
                  padding: "16px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: isSelected
                    ? "0 10px 15px -3px rgba(79, 70, 229, 0.12)"
                    : "0 1px 3px rgba(0, 0, 0, 0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                {plan.isBestValue && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-10px",
                      right: "16px",
                      background: "#10B981",
                      color: "#FFFFFF",
                      fontSize: "11px",
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: "6px",
                      letterSpacing: "0.5px",
                    }}
                  >
                    BEST VALUE
                  </span>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      border: isSelected ? "6px solid #4F46E5" : "2px solid #CBD5E1",
                      background: "#FFFFFF",
                    }}
                  />
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1E293B", margin: 0 }}>
                      {plan.name}
                    </h3>
                    <p style={{ fontSize: "12px", color: "#64748B", margin: "2px 0 0" }}>
                      {plan.tagline}
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "20px", fontWeight: 800, color: "#1E293B" }}>
                    ₹{plan.price}
                  </span>
                  <span style={{ fontSize: "11px", color: "#94A3B8", display: "block" }}>
                    one-time
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* UPI-first notice */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            justifyContent: "center",
            fontSize: "12px",
            color: "#64748B",
            marginBottom: "20px",
          }}
        >
          <CreditCard size={15} />
          <span>Pay via UPI (GPay, PhonePe, Paytm) or Card. No auto-renew.</span>
        </div>

        {/* Checkout Button */}
        <button
          onClick={startCheckout}
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px",
            background: "#4F46E5",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "16px",
            fontWeight: 700,
            fontSize: "16px",
            cursor: "pointer",
            boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            minHeight: "52px",
          }}
        >
          {loading ? (
            <span>Processing...</span>
          ) : (
            <span>
              Get Pro Now • ₹{PRO_PLANS.find((p) => p.id === selectedPlanId)?.price}
            </span>
          )}
        </button>

        {/* Security & Support Footer */}
        <div style={{ textAlign: "center", marginTop: "16px", fontSize: "12px", color: "#94A3B8" }}>
          <span>🔒 256-bit Secure Checkout • 100% money-back guarantee if unsatisfied</span>
        </div>
      </div>

      {/* Parental Gate Modal for Kids/Students */}
      {showParentGate && (
        <div
          role="dialog"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(15, 23, 42, 0.8)",
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
              padding: "24px",
              maxWidth: "360px",
              width: "100%",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "#FEF3C7",
                color: "#D97706",
                fontSize: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              👨‍👩‍👧
            </div>
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#1E293B", marginBottom: "6px" }}>
              Parent or Guardian Verification
            </h3>
            <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "16px" }}>
              Ask a parent or guardian to pay. Please solve this problem to proceed:
            </p>

            <form onSubmit={handleParentGateSubmit}>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "#4F46E5",
                  marginBottom: "12px",
                }}
              >
                {mathProblem.q} = ?
              </div>
              <input
                type="number"
                value={parentMathAnswer}
                onChange={(e) => setParentMathAnswer(e.target.value)}
                placeholder="Enter answer"
                autoFocus
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid #CBD5E1",
                  fontSize: "16px",
                  textAlign: "center",
                  marginBottom: "16px",
                }}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowParentGate(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#F1F5F9",
                    color: "#475569",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    minHeight: "44px",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#4F46E5",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    minHeight: "44px",
                  }}
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
