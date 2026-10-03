"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Layers,
  Clock,
  Sparkles,
  Save,
  RefreshCw,
  Tag,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminDatasetRulesPage() {
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dataset-rules");
      const json = await res.json();
      if (json.success) {
        setRules(json.rules);
      } else {
        toast.error("Failed to load dataset rules");
      }
    } catch {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleSave = async () => {
    if (!rules) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/dataset-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Dataset & display rules updated live!");
      } else {
        toast.error("Save failed: " + json.error);
      }
    } catch (err) {
      toast.error("Error saving rules: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !rules) {
    return (
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 16px", textAlign: "center" }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px auto", color: "#4F46E5" }} />
        <p style={{ fontWeight: 700, color: "#475569" }}>Loading dataset display rules...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "28px" }}>🎛️</span>
            <h1 style={{ fontSize: "26px", fontWeight: "900", color: "#0F172A", margin: 0 }}>
              Dataset Display Rules & System Policies
            </h1>
          </div>
          <p style={{ fontSize: "14px", color: "#64748B", marginTop: "6px" }}>
            Administer progressive difficulty curves, set sizing, ad gates, and reference tag behavior across customer web.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Link
            href="/admin/taxonomy"
            style={{
              padding: "10px 16px",
              borderRadius: "12px",
              background: "#F1F5F9",
              color: "#334155",
              fontWeight: 700,
              fontSize: "13px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🗂️</span>
            <span>Taxonomy Manager</span>
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "10px 20px",
              borderRadius: "12px",
              background: "#4F46E5",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "13px",
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)",
            }}
          >
            <Save size={16} />
            <span>{saving ? "Saving Changes..." : "Save All Rules"}</span>
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* RULE 1: Progressive Difficulty Ordering */}
        <div style={{ background: "#FFFFFF", borderRadius: "18px", border: "1px solid #E2E8F0", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "18px" }}>📈</span>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0F172A", margin: 0 }}>
                  Rule 1: Progressive Difficulty Curve
                </h3>
                <span style={{ fontSize: "11px", fontWeight: "800", background: "#DCFCE7", color: "#166534", padding: "2px 8px", borderRadius: "12px" }}>
                  Active Engine
                </span>
              </div>
              <p style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>
                Each 20-question quiz set is strictly arranged from easy foundations to challenging expert questions.
              </p>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={Boolean(rules.progressiveDifficultyEnabled)}
                onChange={(e) => setRules({ ...rules, progressiveDifficultyEnabled: e.target.checked })}
                style={{ width: "20px", height: "20px", accentColor: "#4F46E5", cursor: "pointer" }}
              />
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#1E293B" }}>Enable Progressive Curve</span>
            </label>
          </div>

          {/* Visual Step Breakdown */}
          <div style={{ background: "#F8FAFC", borderRadius: "14px", padding: "16px", border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "10px" }}>
              Standard 20-Question Tier Progression:
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
              <div style={{ background: "#FFFFFF", padding: "12px", borderRadius: "12px", border: "1px solid #BBF7D0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534", fontWeight: "800", fontSize: "13px" }}>
                  <span>🟢 Tier 1: Easy</span>
                </div>
                <div style={{ fontSize: "20px", fontWeight: "900", color: "#166534", marginTop: "4px" }}>
                  Questions 1 to 7
                </div>
                <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                  Foundational questions to build confidence & momentum.
                </div>
              </div>

              <div style={{ background: "#FFFFFF", padding: "12px", borderRadius: "12px", border: "1px solid #FEF08A" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#854D0E", fontWeight: "800", fontSize: "13px" }}>
                  <span>🟡 Tier 2: Medium</span>
                </div>
                <div style={{ fontSize: "20px", fontWeight: "900", color: "#854D0E", marginTop: "4px" }}>
                  Questions 8 to 14
                </div>
                <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                  Analytical, conceptual, and multi-faceted questions.
                </div>
              </div>

              <div style={{ background: "#FFFFFF", padding: "12px", borderRadius: "12px", border: "1px solid #FECACA" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#991B1B", fontWeight: "800", fontSize: "13px" }}>
                  <span>🔴 Tier 3: Hard & Expert</span>
                </div>
                <div style={{ fontSize: "20px", fontWeight: "900", color: "#991B1B", marginTop: "4px" }}>
                  Questions 15 to 20
                </div>
                <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                  High-level exam and competitive trivia tier.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RULE 2: Ads on Quiz Sets & Pro Features Control */}
        <div style={{ background: "#FFFFFF", borderRadius: "18px", border: "1px solid #E2E8F0", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{ fontSize: "18px" }}>🛡️</span>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0F172A", margin: 0 }}>
              Rule 2: Ad on Quiz Sets & Pro Feature Master Toggles
            </h3>
          </div>
          <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "16px" }}>
            As per administrative request, ads on quiz sets are currently <strong>disabled</strong>, ensuring zero set gating for users.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Ads on Quiz Sets */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", borderRadius: "12px", background: rules.quizSetsAdsEnabled ? "#FEF3C7" : "#F8FAFC", border: rules.quizSetsAdsEnabled ? "1.5px solid #F59E0B" : "1px solid #E2E8F0" }}>
              <div>
                <div style={{ fontWeight: "800", fontSize: "14px", color: "#0F172A" }}>
                  Ads on Quiz Sets Gate
                </div>
                <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                  {rules.quizSetsAdsEnabled
                    ? "Currently ENABLED: Sets beyond free quota show 🔒 AD buttons and require rewarded ads."
                    : "Currently DISABLED (Recommended): All sets show direct Play button (▶). No '🔒 AD' button or paywall gate is shown."}
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(rules.quizSetsAdsEnabled)}
                onChange={(e) => setRules({ ...rules, quizSetsAdsEnabled: e.target.checked })}
                style={{ width: "22px", height: "22px", accentColor: "#4F46E5", cursor: "pointer" }}
              />
            </div>

            {/* Global Ads Master Switch */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", borderRadius: "12px", background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <div>
                <div style={{ fontWeight: "800", fontSize: "14px", color: "#0F172A" }}>
                  Global Ads Master Switch
                </div>
                <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                  Master kill-switch for all banners, mid-quiz ads, and video rewards across the entire web application.
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(rules.adsMasterSwitch)}
                onChange={(e) => setRules({ ...rules, adsMasterSwitch: e.target.checked })}
                style={{ width: "22px", height: "22px", accentColor: "#4F46E5", cursor: "pointer" }}
              />
            </div>

            {/* Pro Features System */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", borderRadius: "12px", background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <div>
                <div style={{ fontWeight: "800", fontSize: "14px", color: "#0F172A" }}>
                  Pro Membership & Features System
                </div>
                <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                  Allows users to purchase Pro memberships, gain Gold badges, and unlock custom features.
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(rules.proFeaturesEnabled)}
                onChange={(e) => setRules({ ...rules, proFeaturesEnabled: e.target.checked })}
                style={{ width: "22px", height: "22px", accentColor: "#4F46E5", cursor: "pointer" }}
              />
            </div>
          </div>
        </div>

        {/* RULE 3: Set Sizing, Timers & Pass Threshold */}
        <div style={{ background: "#FFFFFF", borderRadius: "18px", border: "1px solid #E2E8F0", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{ fontSize: "18px" }}>⚙️</span>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0F172A", margin: 0 }}>
              Rule 3: Set Sizing, Timers & Passing Threshold
            </h3>
          </div>
          <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "16px" }}>
            Configure question capacities per set and challenge durations.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                Standard Set Size (Adults / Competitive)
              </label>
              <input
                type="number"
                value={rules.standardSetSize || 20}
                onChange={(e) => setRules({ ...rules, standardSetSize: parseInt(e.target.value, 10) || 20 })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "14px", fontWeight: 700 }}
              />
              <span style={{ fontSize: "11px", color: "#64748B" }}>Fixed standard is 20 questions.</span>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                Kids / School Set Size
              </label>
              <input
                type="number"
                value={rules.kidsSetSize || 10}
                onChange={(e) => setRules({ ...rules, kidsSetSize: parseInt(e.target.value, 10) || 10 })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "14px", fontWeight: 700 }}
              />
              <span style={{ fontSize: "11px", color: "#64748B" }}>Shorter attention span sets.</span>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                Passing Threshold (% Score)
              </label>
              <input
                type="number"
                value={rules.passThresholdPercent || 60}
                onChange={(e) => setRules({ ...rules, passThresholdPercent: parseInt(e.target.value, 10) || 60 })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "14px", fontWeight: 700 }}
              />
              <span style={{ fontSize: "11px", color: "#64748B" }}>Default: 60% (12 out of 20 correct).</span>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                Default Set Timer
              </label>
              <select
                value={rules.defaultTimerSeconds || 0}
                onChange={(e) => setRules({ ...rules, defaultTimerSeconds: parseInt(e.target.value, 10) || 0 })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "14px", fontWeight: 700 }}
              >
                <option value={0}>No Timer (Relaxed Mode)</option>
                <option value={30}>30 Seconds</option>
                <option value={60}>60 Seconds</option>
                <option value={90}>90 Seconds</option>
              </select>
              <span style={{ fontSize: "11px", color: "#64748B" }}>Initial timer setting on set load.</span>
            </div>
          </div>
        </div>

        {/* RULE 4: Breadcrumb Order & Reference Tags */}
        <div style={{ background: "#FFFFFF", borderRadius: "18px", border: "1px solid #E2E8F0", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{ fontSize: "18px" }}>🏷️</span>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0F172A", margin: 0 }}>
              Rule 4: Breadcrumbs & Keyword Reference Tags
            </h3>
          </div>
          <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "16px" }}>
            Data ordering in terms of customer web breadcrumbs and keyword reference tags.
          </p>

          <div style={{ background: "#F8FAFC", borderRadius: "12px", padding: "16px", border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: "13px", fontWeight: "800", color: "#1E293B", marginBottom: "8px" }}>
              Active Breadcrumb Hierarchy:
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "13px", fontWeight: "700" }}>
              <span style={{ background: "#EEF2FF", color: "#4338CA", padding: "4px 10px", borderRadius: "8px" }}>🏠 Home</span>
              <span style={{ color: "#94A3B8" }}>➔</span>
              <span style={{ background: "#EEF2FF", color: "#4338CA", padding: "4px 10px", borderRadius: "8px" }}>🇮🇳 Main Category</span>
              <span style={{ color: "#94A3B8" }}>➔</span>
              <span style={{ background: "#EEF2FF", color: "#4338CA", padding: "4px 10px", borderRadius: "8px" }}>📁 Sub Category</span>
              <span style={{ color: "#94A3B8" }}>➔</span>
              <span style={{ background: "#EEF2FF", color: "#4338CA", padding: "4px 10px", borderRadius: "8px" }}>🎯 Topic</span>
              <span style={{ color: "#94A3B8" }}>➔</span>
              <span style={{ background: "#FEF3C7", color: "#92400E", padding: "4px 10px", borderRadius: "8px" }}>🏷️ Covered Subject / Chapters as Tags</span>
            </div>

            <div style={{ marginTop: "12px", fontSize: "12px", color: "#64748B", lineHeight: "1.5" }}>
              <strong>Important Policy Note:</strong> Tags act as keyword references to find sets (e.g. typing &quot;Ganga&quot; matches Set 1 under Rivers & Lakes and deep-links directly to it). Tags do not create separate detached quiz set collections; instead, tags index the existing standard sets.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
