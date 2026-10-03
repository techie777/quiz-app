"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  ShieldAlert,
  Sliders,
  Download,
  Save,
  CheckCircle2,
  RefreshCw,
  Users,
  CreditCard,
  Heart,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminMonetizationPage() {
  const [config, setConfig] = useState({
    start: true,
    mid: true,
    result: true,
    review: true,
    share: true,
    midQuizMinQuestions: 10,
    freeSetsPerWindow: 2,
  });

  const [appealText, setAppealText] = useState({
    titleEn: "",
    titleHi: "",
    subtitleEn: "",
    subtitleHi: "",
  });

  const [adStats, setAdStats] = useState(null);
  const [proStats, setProStats] = useState(null);
  const [donations, setDonations] = useState([]);
  const [donationTotal, setDonationTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingAppeal, setSavingAppeal] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Load config & Pro stats
      const configRes = await fetch("/api/admin/monetization-config");
      const configData = await configRes.json();
      if (configData.success) {
        setConfig((prev) => ({ ...prev, ...(configData.config || {}) }));
        setProStats(configData.stats || null);
      }

      // 2. Load ad events stats
      const adRes = await fetch("/api/admin/ad-events");
      const adData = await adRes.json();
      if (adData.success) {
        setAdStats(adData.stats || null);
      }

      // 3. Load donations
      const donRes = await fetch("/api/admin/donations");
      const donData = await donRes.json();
      if (donData.success) {
        setDonations(donData.donations || []);
        setDonationTotal(donData.totalAmount || 0);
        if (donData.appealText) {
          setAppealText(donData.appealText);
        }
      }
    } catch (e) {
      toast.error("Failed to load monetization data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch("/api/admin/monetization-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Monetization toggles saved live!");
      } else {
        toast.error(data.error || "Save failed");
      }
    } catch (e) {
      toast.error("Error saving config");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSaveAppeal = async () => {
    setSavingAppeal(true);
    try {
      const res = await fetch("/api/admin/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appealText }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Donation appeal text updated!");
      } else {
        toast.error(data.error || "Save failed");
      }
    } catch (e) {
      toast.error("Error saving appeal text");
    } finally {
      setSavingAppeal(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "32px", textAlign: "center", color: "#64748B" }}>
        <RefreshCw className="animate-spin" size={24} style={{ margin: "0 auto 12px" }} />
        <p>Loading monetization dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#1E293B", margin: 0 }}>
            Monetization & Ad Gates Dashboard
          </h1>
          <p style={{ fontSize: "14px", color: "#64748B", margin: "4px 0 0" }}>
            Control live rewarded ad gates, Pro membership conversions, and voluntary donations.
          </p>
        </div>
        <button
          onClick={loadAllData}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            borderRadius: "10px",
            background: "#F1F5F9",
            border: "1px solid #CBD5E1",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "13px",
          }}
        >
          <RefreshCw size={14} />
          <span>Refresh Stats</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <div style={{ background: "#FFFFFF", padding: "20px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#6366F1", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 700 }}>REWARDED AD IMPRESSIONS</span>
            <Eye size={18} />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#1E293B" }}>
            {adStats?.completedCount || 0}
          </div>
          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
            Completion rate: <strong>{adStats?.completionRate || 0}%</strong> ({adStats?.totalEvents || 0} requested)
          </div>
        </div>

        <div style={{ background: "#FFFFFF", padding: "20px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#10B981", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 700 }}>ACTIVE PRO MEMBERS</span>
            <Users size={18} />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#1E293B" }}>
            {proStats?.activeSubscriptions || 0}
          </div>
          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
            Total subscriptions: <strong>{proStats?.totalSubscriptions || 0}</strong>
          </div>
        </div>

        <div style={{ background: "#FFFFFF", padding: "20px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#E11D48", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 700 }}>TOTAL DONATIONS</span>
            <Heart size={18} />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#1E293B" }}>
            ₹{donationTotal}
          </div>
          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
            Total contributions: <strong>{donations.length}</strong>
          </div>
        </div>

        <div style={{ background: "#FFFFFF", padding: "20px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#D97706", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 700 }}>AD-BLOCKER DETECTIONS</span>
            <ShieldAlert size={18} />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#1E293B" }}>
            {adStats?.blockedCount || 0}
          </div>
          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
            Ad-blocker prompts shown
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "28px" }}>
        {/* Live Ad Moments Toggles */}
        <div style={{ background: "#FFFFFF", padding: "24px", borderRadius: "18px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Sliders size={20} color="#4F46E5" />
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#1E293B", margin: 0 }}>
              Live Ad Moments Configuration
            </h2>
          </div>
          <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "20px" }}>
            Toggle any ad moment or free quota live across Explorer and Arena without requiring a code deploy.
          </p>

            {/* Master System Switches */}
            <div style={{ background: "#EEF2FF", border: "1.5px solid #C7D2FE", borderRadius: "14px", padding: "14px", marginBottom: "8px" }}>
              <div style={{ fontWeight: 800, fontSize: "14px", color: "#3730A3", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🛡️</span>
                <span>Master System Controls</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "13px", color: "#1E1B4B" }}>Ads On Quiz Sets</div>
                    <div style={{ fontSize: "11px", color: "#4338CA" }}>Show ad gates (AD button & lock) on sets beyond quota (Currently DISABLED)</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(config.quizSetsAdsEnabled)}
                    onChange={(e) => setConfig({ ...config, quizSetsAdsEnabled: e.target.checked })}
                    style={{ width: "20px", height: "20px", accentColor: "#4F46E5", cursor: "pointer" }}
                  />
                </label>

                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", borderTop: "1px solid #E0E7FF", paddingTop: "8px" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "13px", color: "#1E1B4B" }}>Global Ads Master Switch</div>
                    <div style={{ fontSize: "11px", color: "#4338CA" }}>Master switch to enable/disable all ads everywhere</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(config.adsEnabled)}
                    onChange={(e) => setConfig({ ...config, adsEnabled: e.target.checked })}
                    style={{ width: "20px", height: "20px", accentColor: "#4F46E5", cursor: "pointer" }}
                  />
                </label>

                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", borderTop: "1px solid #E0E7FF", paddingTop: "8px" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "13px", color: "#1E1B4B" }}>Pro Features & Membership System</div>
                    <div style={{ fontSize: "11px", color: "#4338CA" }}>Toggle Pro paywalls, Pro badges, and subscription gates across entire app</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(config.proFeaturesEnabled ?? true)}
                    onChange={(e) => setConfig({ ...config, proFeaturesEnabled: e.target.checked })}
                    style={{ width: "20px", height: "20px", accentColor: "#4F46E5", cursor: "pointer" }}
                  />
                </label>
              </div>
            </div>

            {[
              { key: "start", label: "Moment 1: Start Gate", desc: "Watch ad to start locked sets beyond free quota" },
              { key: "mid", label: "Moment 2: Mid-Quiz Gate", desc: "Show halfway ad prompt when questions >= 10" },
              { key: "result", label: "Moment 3: Result Gate", desc: "Watch ad to reveal full score and answer analysis" },
              { key: "review", label: "Moment 4: Review Explanations", desc: "Lock full explanations behind a short ad" },
              { key: "share", label: "Moment 5: Share Card Gate", desc: "Watch ad before downloading custom share card" },
            ].map((gate) => (
              <label
                key={gate.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px",
                  borderRadius: "12px",
                  background: "#F8FAFC",
                  cursor: "pointer",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#1E293B" }}>{gate.label}</div>
                  <div style={{ fontSize: "12px", color: "#64748B" }}>{gate.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(config[gate.key])}
                  onChange={(e) => setConfig({ ...config, [gate.key]: e.target.checked })}
                  style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "#4F46E5" }}
                />
              </label>
            ))}

            <div style={{ display: "flex", gap: "16px", marginTop: "6px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                  Free Sets Per 24h Window
                </label>
                <input
                  type="number"
                  value={config.freeSetsPerWindow || 2}
                  onChange={(e) => setConfig({ ...config, freeSetsPerWindow: parseInt(e.target.value, 10) || 1 })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    border: "1px solid #CBD5E1",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                  Min Questions For Mid-Quiz Ad
                </label>
                <input
                  type="number"
                  value={config.midQuizMinQuestions || 10}
                  onChange={(e) => setConfig({ ...config, midQuizMinQuestions: parseInt(e.target.value, 10) || 5 })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    border: "1px solid #CBD5E1",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>

            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              style={{
                marginTop: "12px",
                padding: "12px",
                background: "#4F46E5",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <Save size={16} />
              <span>{savingConfig ? "Saving..." : "Save Live Config"}</span>
            </button>
          </div>

        {/* Pro Plan Conversions Breakdown */}
        <div style={{ background: "#FFFFFF", padding: "24px", borderRadius: "18px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <CreditCard size={20} color="#10B981" />
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#1E293B", margin: 0 }}>
              Pro Conversions by Plan
            </h2>
          </div>
          <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "20px" }}>
            Breakdown of paid subscriptions across the 4 prepaid tiers.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { id: "plan_1m", name: "1 Month (₹49)", price: 49 },
              { id: "plan_3m", name: "3 Months (₹99)", price: 99 },
              { id: "plan_6m", name: "6 Months (₹149)", price: 149 },
              { id: "plan_1y", name: "1 Year (₹249) ⭐", price: 249 },
            ].map((p) => {
              const stat = (proStats?.conversionsByPlan || []).find((c) => c._id === p.id);
              const count = stat?.count || 0;
              const revenue = stat?.totalRevenue || count * p.price;
              return (
                <div
                  key={p.id}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "12px",
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, fontSize: "14px", color: "#1E293B" }}>{p.name}</span>
                    <span style={{ fontSize: "12px", color: "#64748B", display: "block" }}>{count} subscribers</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontWeight: 800, fontSize: "16px", color: "#10B981" }}>₹{revenue}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Privacy Rules Reminder */}
          <div
            style={{
              marginTop: "20px",
              padding: "12px 14px",
              borderRadius: "12px",
              background: "#EEF2FF",
              border: "1px solid #C7D2FE",
              fontSize: "12px",
              color: "#3730A3",
              lineHeight: 1.5,
            }}
          >
            🛡️ <strong>COPPA & Privacy Enforcement:</strong> Kids and Students modules operate with 0 third-party ad scripts and 0 ad moments. Daily Quiz and Learn are permanently exempt from free quotas.
          </div>
        </div>
      </div>

      {/* Donation Appeal Editor & Recent Contributions */}
      <div style={{ background: "#FFFFFF", padding: "24px", borderRadius: "18px", border: "1px solid #E2E8F0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Heart size={20} color="#E11D48" />
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#1E293B", margin: 0 }}>
              Donations & Appeal Page Editor
            </h2>
          </div>
          <a
            href="/api/admin/donations?export=csv"
            download="quizweb_donations.csv"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "10px",
              background: "#FFF1F2",
              color: "#E11D48",
              border: "1px solid #FECDD3",
              fontWeight: 700,
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </a>
        </div>

        {/* Appeal Text Form */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
              Appeal Title (English)
            </label>
            <input
              type="text"
              value={appealText.titleEn}
              onChange={(e) => setAppealText({ ...appealText, titleEn: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "10px", border: "1px solid #CBD5E1" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
              Appeal Title (Hindi)
            </label>
            <input
              type="text"
              value={appealText.titleHi}
              onChange={(e) => setAppealText({ ...appealText, titleHi: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "10px", border: "1px solid #CBD5E1" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
              Subtitle (English)
            </label>
            <textarea
              rows={2}
              value={appealText.subtitleEn}
              onChange={(e) => setAppealText({ ...appealText, subtitleEn: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "13px" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
              Subtitle (Hindi)
            </label>
            <textarea
              rows={2}
              value={appealText.subtitleHi}
              onChange={(e) => setAppealText({ ...appealText, subtitleHi: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "13px" }}
            />
          </div>
        </div>

        <button
          onClick={handleSaveAppeal}
          disabled={savingAppeal}
          style={{
            padding: "10px 18px",
            background: "#E11D48",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            marginBottom: "24px",
          }}
        >
          {savingAppeal ? "Saving Appeal Text..." : "Update Donation Appeal Text"}
        </button>

        {/* Recent Contributions Table */}
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1E293B", marginBottom: "12px" }}>
          Recent Voluntary Contributions
        </h3>
        {donations.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#94A3B8" }}>No voluntary donations recorded yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", textAlign: "left" }}>
                  <th style={{ padding: "10px" }}>Donor</th>
                  <th style={{ padding: "10px" }}>Amount</th>
                  <th style={{ padding: "10px" }}>Tier</th>
                  <th style={{ padding: "10px" }}>Date</th>
                  <th style={{ padding: "10px" }}>Payment Ref</th>
                </tr>
              </thead>
              <tbody>
                {donations.slice(0, 10).map((d) => (
                  <tr key={d._id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px", fontWeight: 600 }}>{d.donorName || "Anonymous Supporter"}</td>
                    <td style={{ padding: "10px", fontWeight: 700, color: "#E11D48" }}>₹{d.amount}</td>
                    <td style={{ padding: "10px", textTransform: "capitalize" }}>{d.tier || "all"}</td>
                    <td style={{ padding: "10px", color: "#64748B" }}>
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "10px", color: "#94A3B8", fontFamily: "monospace", fontSize: "11px" }}>
                      {String(d.paymentId || d._id).slice(0, 16)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
