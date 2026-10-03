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
  Cpu,
  Compass,
  Shuffle,
  ListOrdered,
  Copy,
  ExternalLink,
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

  const copyToClipboard = (text, label) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
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
      {/* Route & API Details Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          padding: "12px 18px",
          borderRadius: "14px",
          background: "linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)",
          border: "1px solid #C7D2FE",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "#4338CA" }}>
            📍 System Endpoints:
          </span>
          <div
            onClick={() => copyToClipboard("/admin/dataset-rules", "Page path")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "8px",
              background: "#FFFFFF",
              border: "1px solid #CBD5E1",
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "monospace",
              color: "#334155",
              cursor: "pointer",
            }}
            title="Click to copy page route"
          >
            <span>🖥️ /admin/dataset-rules</span>
            <Copy size={12} color="#64748B" />
          </div>
          <div
            onClick={() => copyToClipboard("/api/admin/dataset-rules", "API path")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "8px",
              background: "#ECFDF5",
              border: "1px solid #A7F3D0",
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "monospace",
              color: "#065F46",
              cursor: "pointer",
            }}
            title="Click to copy API route"
          >
            <span>⚡ /api/admin/dataset-rules</span>
            <Copy size={12} color="#059669" />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#4338CA", background: "#E0E7FF", padding: "3px 8px", borderRadius: "6px" }}>
            LIVE SYNCED
          </span>
        </div>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "30px" }}>🎛️</span>
            <h1 style={{ fontSize: "26px", fontWeight: "900", color: "#0F172A", margin: 0 }}>
              Dataset Display Rules & Set Generation Engine
            </h1>
          </div>
          <p style={{ fontSize: "14px", color: "#64748B", marginTop: "6px" }}>
            Administer set creation formulas, 2,000-question mega pool round-robin algorithms, tag presentation, and ad policies.
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
              padding: "10px 22px",
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
        {/* MASTER MODE SELECTOR: Dynamic vs Static */}
        <div style={{ background: "#FFFFFF", borderRadius: "18px", border: "1px solid #E2E8F0", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>⚡</span>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0F172A", margin: 0 }}>
                  Master Set Generation Engine Mode
                </h3>
              </div>
              <p style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>
                Choose how quiz sets are constructed from the question pools across categories.
              </p>
            </div>

            <div style={{ display: "inline-flex", background: "#F1F5F9", padding: "4px", borderRadius: "12px", border: "1px solid #CBD5E1" }}>
              <button
                type="button"
                onClick={() => setRules({ ...rules, generationMode: "dynamic" })}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: 800,
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: rules.generationMode !== "static" ? "#4F46E5" : "transparent",
                  color: rules.generationMode !== "static" ? "#FFFFFF" : "#475569",
                  boxShadow: rules.generationMode !== "static" ? "0 2px 4px rgba(79, 70, 229, 0.2)" : "none",
                }}
              >
                <Cpu size={14} />
                <span>Dynamic Smart Balancing (Recommended)</span>
              </button>
              <button
                type="button"
                onClick={() => setRules({ ...rules, generationMode: "static" })}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: 800,
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: rules.generationMode === "static" ? "#4F46E5" : "transparent",
                  color: rules.generationMode === "static" ? "#FFFFFF" : "#475569",
                  boxShadow: rules.generationMode === "static" ? "0 2px 4px rgba(79, 70, 229, 0.2)" : "none",
                }}
              >
                <ListOrdered size={14} />
                <span>Static Sequential Order (As Prepared)</span>
              </button>
            </div>
          </div>

          <div style={{ background: "#F8FAFC", borderRadius: "12px", padding: "14px", border: "1px solid #E2E8F0", fontSize: "12px", color: "#475569", lineHeight: "1.6" }}>
            <strong>Active Policy:</strong>{" "}
            {rules.generationMode === "static"
              ? "Static Mode serves sets sequentially from uploaded index 1 to N as prepared in files, sorting each set purely Easy ➔ Medium ➔ Hard."
              : "Dynamic Smart Mode uses multi-algorithm balancing: 10 Easy (Q1-5 first), 5 Medium, 5 Hard, round-robin subcategory allocation for mega pools, and progressive ladders for single categories."}
          </div>
        </div>

        {/* POINT 4: PRESENTATION AND SHUFFLING RULES MATRIX TABLE */}
        <div style={{ background: "#FFFFFF", borderRadius: "18px", border: "1px solid #E2E8F0", padding: "22px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                📊
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0F172A", margin: 0 }}>
                  Presentation & Shuffling Rules Matrix
                </h3>
                <p style={{ fontSize: "12px", color: "#64748B", margin: "2px 0 0 0" }}>
                  Operational mapping of how question pools are standardized, shuffled, and presented to users.
                </p>
              </div>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#4338CA", background: "#E0E7FF", padding: "4px 10px", borderRadius: "8px" }}>
              Standard Set Size: 20 Qs
            </span>
          </div>

          <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 800, color: "#334155", width: "24%" }}>Browsing Context</th>
                  <th style={{ padding: "12px 16px", fontWeight: 800, color: "#334155", width: "22%" }}>Active Rule</th>
                  <th style={{ padding: "12px 16px", fontWeight: 800, color: "#334155", width: "40%" }}>Set Composition & Shuffling Formula</th>
                  <th style={{ padding: "12px 16px", fontWeight: 800, color: "#334155", width: "14%", textAlign: "center" }}>Engine Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Row 1: All Subcategories Active (Mega Pool) */}
                <tr style={{ borderBottom: "1px solid #F1F5F9", background: "#FFFFFF" }}>
                  <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                    <div style={{ fontWeight: 800, color: "#0F172A" }}>All Subcategories Active</div>
                    <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                      Mega Pool (e.g. India GK with 2,000 Questions across 10–12 Subcategories)
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                    <span style={{ display: "inline-block", background: "#DCFCE7", color: "#166534", padding: "3px 8px", borderRadius: "6px", fontWeight: 800, fontSize: "11px" }}>
                      Rule 1: Mega Pool Round-Robin
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", verticalAlign: "top", color: "#334155", lineHeight: 1.5 }}>
                    <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "3px" }}>
                      <li><strong>20 Qs Composition:</strong> 10 Easy, 5 Medium, 5 Hard/Expert</li>
                      <li><strong>Q1–5:</strong> Strictly Easy questions first to build immediate confidence</li>
                      <li><strong>Q6–20:</strong> Shuffled mix of remaining 5 Easy, 5 Medium, 5 Hard</li>
                      <li><strong>Subcategory Round-Robin:</strong> Each question belongs to unique subcategory (1 to 10/12) cycling before repeating</li>
                    </ul>
                  </td>
                  <td style={{ padding: "14px 16px", verticalAlign: "middle", textAlign: "center" }}>
                    <span style={{ background: "#F0FDF4", color: "#166534", border: "1px solid #BBF7D0", padding: "4px 8px", borderRadius: "8px", fontWeight: 700, fontSize: "11px" }}>
                      Active Live
                    </span>
                  </td>
                </tr>

                {/* Row 2: 1 Subcategory + Multiple Topics */}
                <tr style={{ borderBottom: "1px solid #F1F5F9", background: "#FAFAFA" }}>
                  <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                    <div style={{ fontWeight: 800, color: "#0F172A" }}>1 Subcategory + Multiple Topics</div>
                    <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                      e.g. Sports GK &gt; Cricket (200 questions across multiple topics)
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                    <span style={{ display: "inline-block", background: "#DBEAFE", color: "#1E40AF", padding: "3px 8px", borderRadius: "6px", fontWeight: 800, fontSize: "11px" }}>
                      Rule 2: Subcategory Mix
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", verticalAlign: "top", color: "#334155", lineHeight: 1.5 }}>
                    <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "3px" }}>
                      <li>Topics shuffled within subcategory for engagement</li>
                      <li><strong>Set 1:</strong> Starts with Easy questions, 10 Easy (Q1–5 easy first), 5 Medium, 5 Hard</li>
                      <li><strong>Set 2 onwards:</strong> 7 Easy, 7 Medium, 6 Hard/Expert</li>
                    </ul>
                  </td>
                  <td style={{ padding: "14px 16px", verticalAlign: "middle", textAlign: "center" }}>
                    <span style={{ background: "#EFF6FF", color: "#1E40AF", border: "1px solid #BFDBFE", padding: "4px 8px", borderRadius: "8px", fontWeight: 700, fontSize: "11px" }}>
                      Active Live
                    </span>
                  </td>
                </tr>

                {/* Row 3: Specific Topic Drill-Down */}
                <tr style={{ borderBottom: "1px solid #F1F5F9", background: "#FFFFFF" }}>
                  <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                    <div style={{ fontWeight: 800, color: "#0F172A" }}>Specific Topic Drill-Down</div>
                    <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                      e.g. Indian Geography &gt; Indian Rivers (Direct focus)
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                    <span style={{ display: "inline-block", background: "#F3E8FF", color: "#6B21A8", padding: "3px 8px", borderRadius: "6px", fontWeight: 800, fontSize: "11px" }}>
                      Rule 3: Curated Progressive
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", verticalAlign: "top", color: "#334155", lineHeight: 1.5 }}>
                    <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "3px" }}>
                      <li><strong>No category jumping</strong> — stays strictly in topic domain</li>
                      <li><strong>Strict sequential difficulty order:</strong></li>
                      <li style={{ listStyleType: "none", paddingLeft: "8px", color: "#64748B", fontSize: "12px" }}>
                        • Q1–7: Easy foundational concepts<br />
                        • Q8–14: Medium analytical concepts<br />
                        • Q15–20: Hard / Expert challenge
                      </li>
                    </ul>
                  </td>
                  <td style={{ padding: "14px 16px", verticalAlign: "middle", textAlign: "center" }}>
                    <span style={{ background: "#FAF5FF", color: "#6B21A8", border: "1px solid #E9D5FF", padding: "4px 8px", borderRadius: "8px", fontWeight: 700, fontSize: "11px" }}>
                      Active Live
                    </span>
                  </td>
                </tr>

                {/* Row 4: Single Category / Bulk Upload */}
                <tr style={{ borderBottom: "1px solid #F1F5F9", background: "#FAFAFA" }}>
                  <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                    <div style={{ fontWeight: 800, color: "#0F172A" }}>Single Category / Bulk Upload</div>
                    <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                      Accessed standalone from Home page or bulk uploaded
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                    <span style={{ display: "inline-block", background: "#FEF3C7", color: "#92400E", padding: "3px 8px", borderRadius: "6px", fontWeight: 800, fontSize: "11px" }}>
                      Rule 4: Bulk Category Ladder
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", verticalAlign: "top", color: "#334155", lineHeight: 1.5 }}>
                    <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "3px" }}>
                      <li><strong>1 Set Only:</strong> 10 Easy (first), 5 Medium, 5 Hard</li>
                      <li><strong>Multiple Sets Ladder:</strong></li>
                      <li style={{ listStyleType: "none", paddingLeft: "8px", color: "#64748B", fontSize: "12px" }}>
                        • <strong>Set 1:</strong> 20 All Easy (builds player mastery & retention)<br />
                        • <strong>Set 2:</strong> 10 Easy (Q1–5 first), 5 Medium, 5 Hard<br />
                        • <strong>Set 3+:</strong> 7 Easy, 7 Medium, 6 Hard/Expert
                      </li>
                    </ul>
                  </td>
                  <td style={{ padding: "14px 16px", verticalAlign: "middle", textAlign: "center" }}>
                    <span style={{ background: "#FFFBEB", color: "#92400E", border: "1px solid #FDE68A", padding: "4px 8px", borderRadius: "8px", fontWeight: 700, fontSize: "11px" }}>
                      Active Live
                    </span>
                  </td>
                </tr>

                {/* Row 5: Static Preparation Mode */}
                <tr style={{ background: "#FFFFFF" }}>
                  <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                    <div style={{ fontWeight: 800, color: "#0F172A" }}>Static Preparation Mode</div>
                    <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                      Admin toggleable fallback for static pre-built files
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                    <span style={{ display: "inline-block", background: "#F1F5F9", color: "#475569", padding: "3px 8px", borderRadius: "6px", fontWeight: 800, fontSize: "11px" }}>
                      Static Sequential Mode
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", verticalAlign: "top", color: "#334155", lineHeight: 1.5 }}>
                    <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "3px" }}>
                      <li>Preserves original uploaded file sequence from Set 1 to N exactly as prepared</li>
                      <li>Sorts each set purely by Easy ➔ Medium ➔ Hard without category shuffling</li>
                    </ul>
                  </td>
                  <td style={{ padding: "14px 16px", verticalAlign: "middle", textAlign: "center" }}>
                    <span style={{ background: rules.generationMode === "static" ? "#DCFCE7" : "#F1F5F9", color: rules.generationMode === "static" ? "#166534" : "#64748B", border: "1px solid #CBD5E1", padding: "4px 8px", borderRadius: "8px", fontWeight: 700, fontSize: "11px" }}>
                      {rules.generationMode === "static" ? "Active" : "Standby"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* RULE 1: Mega Pool Formula (2,000 Questions across 10-12 Subcategories) */}
        <div style={{ background: "#FFFFFF", borderRadius: "18px", border: "1px solid #E2E8F0", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>🇮🇳</span>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0F172A", margin: 0 }}>
                  Rule 1: Mega Pool Algorithm (e.g. India GK · 2,000 Questions · 10–12 Subcategories)
                </h3>
                <span style={{ fontSize: "11px", fontWeight: "800", background: "#DCFCE7", color: "#166534", padding: "2px 8px", borderRadius: "12px" }}>
                  Active Formula
                </span>
              </div>
              <p style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>
                When all subcategories are active under a master category, sets are generated from the combined 2,000-question pool.
              </p>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={Boolean(rules.megaPoolRoundRobin ?? true)}
                onChange={(e) => setRules({ ...rules, megaPoolRoundRobin: e.target.checked })}
                style={{ width: "20px", height: "20px", accentColor: "#4F46E5", cursor: "pointer" }}
              />
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#1E293B" }}>Enable Rule 1</span>
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px", marginBottom: "14px" }}>
            <div style={{ background: "#F0FDF4", padding: "14px", borderRadius: "12px", border: "1px solid #BBF7D0" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#166534" }}>🎯 20 Questions Standard</div>
              <div style={{ fontSize: "18px", fontWeight: 900, color: "#15803D", marginTop: "4px" }}>10 Easy · 5 Medium · 5 Hard</div>
              <div style={{ fontSize: "11px", color: "#4B5563", marginTop: "4px" }}>
                Standardized mix across the entire 20-question set to ensure engagement and progressive mastery.
              </div>
            </div>

            <div style={{ background: "#EFF6FF", padding: "14px", borderRadius: "12px", border: "1px solid #BFDBFE" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#1E40AF" }}>🟢 Questions 1 to 5 First</div>
              <div style={{ fontSize: "18px", fontWeight: 900, color: "#1D4ED8", marginTop: "4px" }}>Strictly Easy Questions</div>
              <div style={{ fontSize: "11px", color: "#4B5563", marginTop: "4px" }}>
                Questions 1 to 5 are strictly Easy questions first. Remaining 5 Easy, 5 Medium, and 5 Hard are shuffled for Q6–20.
              </div>
            </div>

            <div style={{ background: "#FAF5FF", padding: "14px", borderRadius: "12px", border: "1px solid #E9D5FF" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#6B21A8" }}>🔄 Subcategory Round-Robin</div>
              <div style={{ fontSize: "18px", fontWeight: 900, color: "#7E22CE", marginTop: "4px" }}>Unique Category / Question</div>
              <div style={{ fontSize: "11px", color: "#4B5563", marginTop: "4px" }}>
                Each question belongs to a unique subcategory cycling through 1 to 10/12, repeating only after completing counts.
              </div>
            </div>
          </div>
        </div>

        {/* RULE 2: Subcategory with Multiple Topics */}
        <div style={{ background: "#FFFFFF", borderRadius: "18px", border: "1px solid #E2E8F0", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>🏏</span>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0F172A", margin: 0 }}>
                  Rule 2: Subcategory with Multiple Topics (e.g. Sports GK &gt; Cricket · 200 Questions)
                </h3>
              </div>
              <p style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>
                Topics are shuffled and mixed within that subcategory to maximize user engagement.
              </p>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={Boolean(rules.subCategoryMixing ?? true)}
                onChange={(e) => setRules({ ...rules, subCategoryMixing: e.target.checked })}
                style={{ width: "20px", height: "20px", accentColor: "#4F46E5", cursor: "pointer" }}
              />
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#1E293B" }}>Enable Rule 2</span>
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
            <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#334155" }}>Set 1 Onboarding:</div>
              <div style={{ fontSize: "16px", fontWeight: 900, color: "#0F172A", marginTop: "2px" }}>10 Easy · 5 Medium · 5 Hard</div>
              <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>
                Starts with Easy questions first (Q1–5) to hook users and build immediate confidence.
              </div>
            </div>

            <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#334155" }}>Set 2 Onwards (Challenge Mode):</div>
              <div style={{ fontSize: "16px", fontWeight: 900, color: "#0F172A", marginTop: "2px" }}>7 Easy · 7 Medium · 6 Hard/Expert</div>
              <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>
                Balanced 7-7-6 formula with topic mixing across the entire subcategory.
              </div>
            </div>
          </div>
        </div>

        {/* RULE 3: Specific Topic Drill-Down */}
        <div style={{ background: "#FFFFFF", borderRadius: "18px", border: "1px solid #E2E8F0", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>🎯</span>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0F172A", margin: 0 }}>
                  Rule 3: Specific Topic Drill-Down (No Category Shuffling · Strict 7-7-6)
                </h3>
              </div>
              <p style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>
                When a user selects a specific topic (e.g. Indian Geography &gt; Indian Rivers), sets do NOT jump categories.
              </p>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={Boolean(rules.topicSequentialDifficulty ?? true)}
                onChange={(e) => setRules({ ...rules, topicSequentialDifficulty: e.target.checked })}
                style={{ width: "20px", height: "20px", accentColor: "#4F46E5", cursor: "pointer" }}
              />
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#1E293B" }}>Enable Rule 3</span>
            </label>
          </div>

          <div style={{ background: "#F8FAFC", borderRadius: "12px", padding: "14px", border: "1px solid #E2E8F0", fontSize: "12px", color: "#475569" }}>
            <strong>Sequential Difficulty:</strong> Q1–7: Easy foundational concepts ➔ Q8–14: Medium conceptual applications ➔ Q15–20: Hard/Expert questions. No random category jumps.
          </div>
        </div>

        {/* RULE 4: Single / Bulk Category Selected from Home */}
        <div style={{ background: "#FFFFFF", borderRadius: "18px", border: "1px solid #E2E8F0", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>📦</span>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0F172A", margin: 0 }}>
                  Rule 4: Single Quiz Category / Bulk Upload Ladder
                </h3>
              </div>
              <p style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>
                Applies when a category is accessed standalone or uploaded via bulk with 1 or multiple sets.
              </p>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={Boolean(rules.bulkCategoryLadder ?? true)}
                onChange={(e) => setRules({ ...rules, bulkCategoryLadder: e.target.checked })}
                style={{ width: "20px", height: "20px", accentColor: "#4F46E5", cursor: "pointer" }}
              />
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#1E293B" }}>Enable Rule 4</span>
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
            <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#334155" }}>If 1 Set Only:</div>
              <div style={{ fontSize: "16px", fontWeight: 900, color: "#0F172A", marginTop: "2px" }}>10 Easy · 5 Medium · 5 Hard</div>
              <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>Easy questions placed first in order.</div>
            </div>

            <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#334155" }}>If Multiple Sets · Set 1:</div>
              <div style={{ fontSize: "16px", fontWeight: 900, color: "#15803D", marginTop: "2px" }}>ALL Easy Questions (20 Easy)</div>
              <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>Builds mastery and player retention.</div>
            </div>

            <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#334155" }}>If Multiple Sets · Set 2+:</div>
              <div style={{ fontSize: "16px", fontWeight: 900, color: "#0F172A", marginTop: "2px" }}>Set 2: 10/5/5 ➔ Set 3+: 7/7/6</div>
              <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>Progressive escalation to expert tiers.</div>
            </div>
          </div>
        </div>

        {/* RULE 5: Strict Admin-Only Tagging Policy */}
        <div style={{ background: "#FFFFFF", borderRadius: "18px", border: "1px solid #E2E8F0", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>🏷️</span>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0F172A", margin: 0 }}>
                  Rule 5: Strict Reference Tags Display Policy
                </h3>
              </div>
              <p style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>
                Do NOT display reference tags until specifically entered or tagged by admin for that category, subcategory, or topic.
              </p>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={Boolean(rules.strictAdminTagsOnly ?? true)}
                onChange={(e) => setRules({ ...rules, strictAdminTagsOnly: e.target.checked })}
                style={{ width: "20px", height: "20px", accentColor: "#4F46E5", cursor: "pointer" }}
              />
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#1E293B" }}>Strict Tags Only</span>
            </label>
          </div>

          <div style={{ background: "#FEF2F2", borderRadius: "12px", padding: "14px", border: "1px solid #FECACA", fontSize: "12px", color: "#991B1B", lineHeight: "1.5" }}>
            <strong>Bug Fix Applied:</strong> Hardcoded river tags (Ganga, Yamuna, Brahmaputra) previously displayed on non-geography topics (e.g. Entertainment) have been completely removed. Tags now remain 100% hidden unless an admin explicitly adds tags to that topic in Taxonomy Manager or question tags exist.
          </div>
        </div>

        {/* RULE 6: Ads on Quiz Sets & Pro Features Control */}
        <div style={{ background: "#FFFFFF", borderRadius: "18px", border: "1px solid #E2E8F0", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{ fontSize: "20px" }}>🛡️</span>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0F172A", margin: 0 }}>
              Rule 6: Ads on Quiz Sets & Pro Feature Master Toggles
            </h3>
          </div>
          <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "16px" }}>
            As per user instruction, ads on quiz sets are currently <strong>disabled</strong>, ensuring zero set gating for users.
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
                    : "Currently DISABLED (Active Policy): All sets show direct Play button (▶). No '🔒 AD' button or paywall gate is shown."}
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

        {/* RULE 7: Set Sizing, Timers & Pass Threshold */}
        <div style={{ background: "#FFFFFF", borderRadius: "18px", border: "1px solid #E2E8F0", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{ fontSize: "20px" }}>⚙️</span>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0F172A", margin: 0 }}>
              Rule 7: Set Sizing, Timers & Passing Threshold
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
      </div>
    </div>
  );
}
