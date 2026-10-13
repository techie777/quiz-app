"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminDaily.module.css";
import toast, { Toaster } from "react-hot-toast";

function formatTime(dt) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return "";
  }
}

const CATEGORY_COLORS = {
  general: { bg: "rgba(99, 102, 241, 0.12)", color: "#6366f1", label: "📢 ANNOUNCEMENT" },
  exam_alert: { bg: "rgba(239, 68, 68, 0.12)", color: "#ef4444", label: "⚡ EXAM ALERT" },
  reward: { bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", label: "🎁 REWARD / OFFER" },
  update: { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981", label: "🚀 NEW FEATURE" },
  system: { bg: "rgba(100, 116, 139, 0.12)", color: "#64748b", label: "🛠️ MAINTENANCE" },
};

const AUDIENCE_LABELS = {
  all: "👥 All Students",
  pro: "👑 Pro Members Only",
  free: "🏷️ Free Plan Students",
  exam: "🎯 Exam Aspirants",
};

export default function AdminNotificationsPage() {
  const { adminUser } = useAdmin();
  const [activeTab, setActiveTab] = useState("system"); // "system" | "broadcast"
  const [items, setItems] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [filter, setFilter] = useState("unread");
  const [loading, setLoading] = useState(true);
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  // Composer Modal State
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [composerForm, setComposerForm] = useState({
    title: "",
    message: "",
    audience: "all",
    category: "general",
    link: "",
  });

  const allowed = adminUser?.role === "master" || adminUser?.permissions?.notifications !== false;
  const query = filter === "unread" ? "?unread=1" : "";

  const loadSystem = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/notifications${query}`, { cache: "no-store" });
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const loadBroadcasts = async () => {
    setBroadcastLoading(true);
    try {
      const res = await fetch("/api/admin/notifications?type=broadcasts", { cache: "no-store" });
      if (res.ok) setBroadcasts(await res.json());
    } finally {
      setBroadcastLoading(false);
    }
  };

  useEffect(() => {
    if (!allowed) return;
    if (activeTab === "system") loadSystem();
    else loadBroadcasts();
  }, [allowed, activeTab, query]);

  const counts = useMemo(() => {
    const unread = items.filter((n) => !n.readAt).length;
    return { unread };
  }, [items]);

  const markAllRead = async () => {
    await fetch("/api/admin/notifications/mark-all-read", { method: "POST" });
    toast.success("All notifications marked as read!");
    await loadSystem();
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!composerForm.title.trim() || !composerForm.message.trim()) {
      toast.error("Please fill in both title and message body");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(composerForm),
      });

      if (res.ok) {
        toast.success("Broadcast sent to students!");
        setIsComposerOpen(false);
        setComposerForm({
          title: "",
          message: "",
          audience: "all",
          category: "general",
          link: "",
        });
        await loadBroadcasts();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to broadcast notification");
      }
    } catch {
      toast.error("Network error sending broadcast");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBroadcast = async (id) => {
    try {
      const res = await fetch(`/api/admin/notifications?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Broadcast deleted");
        await loadBroadcasts();
      } else {
        toast.error("Failed to delete broadcast");
      }
    } catch {
      toast.error("Network error");
    }
  };

  if (!allowed) {
    return (
      <div className={styles.page}>
        <p>Access denied.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Toaster position="top-right" />

      {/* Header Banner */}
      <div className={styles.headerRow}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.badgeHeader}>
            <span>🔔 NOTIFICATIONS & STUDENT BROADCAST HUB</span>
          </div>
          <h1 className={styles.title}>Communications Center</h1>
          <p className={styles.subtitle}>
            Review system notifications, manage task approvals, and broadcast live alerts to students.
          </p>
        </div>

        <div className={styles.actionButtonsGroup}>
          {activeTab === "system" ? (
            <button className={styles.secondaryBtn} onClick={markAllRead}>
              <span>✓ Mark All Read</span>
            </button>
          ) : (
            <button
              className={styles.primaryBtn}
              onClick={() => setIsComposerOpen(true)}
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", color: "#fff" }}
            >
              <span>📢 + Broadcast Announcement</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Mode Navigation Tabs */}
      <div style={{ display: "flex", gap: "8px", background: "var(--card-bg)", padding: "6px", borderRadius: "14px", border: "1px solid var(--card-border)", width: "fit-content" }}>
        <button
          type="button"
          onClick={() => setActiveTab("system")}
          style={{
            padding: "8px 18px",
            borderRadius: "10px",
            border: "none",
            background: activeTab === "system" ? "var(--accent, #6366f1)" : "transparent",
            color: activeTab === "system" ? "#fff" : "var(--text-secondary)",
            fontWeight: 800,
            fontSize: "0.88rem",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          🔔 System Tasks & Alerts {counts.unread > 0 && `(${counts.unread})`}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("broadcast")}
          style={{
            padding: "8px 18px",
            borderRadius: "10px",
            border: "none",
            background: activeTab === "broadcast" ? "var(--accent, #6366f1)" : "transparent",
            color: activeTab === "broadcast" ? "#fff" : "var(--text-secondary)",
            fontWeight: 800,
            fontSize: "0.88rem",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          📢 Broadcast to Students ({broadcasts.length})
        </button>
      </div>

      {activeTab === "system" ? (
        <>
          {/* KPI Overview Grid */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: "rgba(244, 63, 94, 0.12)", color: "#f43f5e" }}>🔴</div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiValue}>{counts.unread}</div>
                <div className={styles.kpiLabel}>Unread Tasks / Alerts</div>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: "rgba(99, 102, 241, 0.12)", color: "#6366f1" }}>🔔</div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiValue}>{items.length}</div>
                <div className={styles.kpiLabel}>Total System Notifications</div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className={styles.controlsBar}>
            <div className={styles.typeTabs}>
              <button
                className={`${styles.typeTab} ${filter === "unread" ? styles.typeTabActive : ""}`}
                onClick={() => setFilter("unread")}
              >
                <span>🔴 Unread ({counts.unread})</span>
              </button>
              <button
                className={`${styles.typeTab} ${filter === "all" ? styles.typeTabActive : ""}`}
                onClick={() => setFilter("all")}
              >
                <span>📋 All Notifications</span>
              </button>
            </div>

            <button className={styles.secondaryBtn} onClick={loadSystem}>
              <span>🔄 Refresh Feed</span>
            </button>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className={styles.cardSection}>
              <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>Loading notifications...</p>
            </div>
          ) : items.length === 0 ? (
            <div className={styles.cardSection} style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: "2.5rem" }}>🔔</div>
              <h3 style={{ margin: "10px 0 4px", fontSize: "1.1rem", fontWeight: 800 }}>No Notifications</h3>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                You are all caught up! No pending requests or unread notifications found.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {items.map((n) => {
                const isUnread = !n.readAt;
                return (
                  <div
                    key={n.id}
                    style={{
                      background: isUnread ? "rgba(99, 102, 241, 0.04)" : "var(--bg-primary)",
                      border: isUnread ? "1.5px solid rgba(99, 102, 241, 0.3)" : "1px solid var(--card-border)",
                      borderRadius: "16px",
                      padding: "16px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {isUnread && (
                          <span style={{ background: "#f43f5e", color: "#fff", fontSize: "0.65rem", fontWeight: 900, padding: "2px 6px", borderRadius: "10px", textTransform: "uppercase" }}>
                            NEW
                          </span>
                        )}
                        <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#6366f1", textTransform: "uppercase" }}>
                          {n.type || "SYSTEM"}
                        </span>
                        <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>{n.title}</strong>
                      </div>

                      <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                        {formatTime(n.createdAt)}
                      </span>
                    </div>

                    {n.message && (
                      <p style={{ margin: "2px 0 6px", fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                        {n.message}
                      </p>
                    )}

                    {n.link && (
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <Link href={n.link} className={styles.secondaryBtn} style={{ padding: "4px 12px", fontSize: "0.78rem" }}>
                          <span>👉 Open Details</span>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Broadcast to Students Tab */
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", padding: "18px 22px", background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "18px" }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: "1.1rem", fontWeight: 900 }}>
                📢 Student Announcement Broadcasts
              </h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Publish real-time announcements, urgent exam reminders, or promotional rewards to students.
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button className={styles.secondaryBtn} onClick={loadBroadcasts}>
                <span>🔄 Refresh</span>
              </button>
              <button
                className={styles.primaryBtn}
                onClick={() => setIsComposerOpen(true)}
              >
                <span>➕ New Announcement</span>
              </button>
            </div>
          </div>

          {/* Broadcasts Feed */}
          {broadcastLoading ? (
            <div className={styles.cardSection}>
              <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>Loading student broadcasts...</p>
            </div>
          ) : broadcasts.length === 0 ? (
            <div className={styles.cardSection} style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: "2.5rem" }}>📣</div>
              <h3 style={{ margin: "10px 0 4px", fontSize: "1.1rem", fontWeight: 800 }}>No Active Announcements</h3>
              <p style={{ margin: "0 0 16px", color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                Broadcast a new update or alert to engage students immediately!
              </p>
              <button
                className={styles.primaryBtn}
                onClick={() => setIsComposerOpen(true)}
              >
                Compose First Broadcast
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {broadcasts.map((b) => {
                const catInfo = CATEGORY_COLORS[b.category] || CATEGORY_COLORS.general;
                const audienceLabel = AUDIENCE_LABELS[b.audience] || b.audience;

                return (
                  <div
                    key={b.id}
                    style={{
                      background: "var(--card-bg)",
                      border: "1px solid var(--card-border)",
                      borderRadius: "18px",
                      padding: "20px 24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <span style={{ background: catInfo.bg, color: catInfo.color, fontSize: "0.72rem", fontWeight: 900, padding: "3px 10px", borderRadius: "8px" }}>
                          {catInfo.label}
                        </span>
                        <span style={{ background: "rgba(99, 102, 241, 0.08)", color: "#6366f1", fontSize: "0.75rem", fontWeight: 800, padding: "3px 10px", borderRadius: "8px" }}>
                          {audienceLabel}
                        </span>
                        <strong style={{ fontSize: "1.05rem", color: "var(--text-primary)" }}>{b.title}</strong>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                          {formatTime(b.createdAt)} • by {b.sender || "Admin"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteBroadcast(b.id)}
                          style={{
                            background: "rgba(239, 68, 68, 0.1)",
                            color: "#ef4444",
                            border: "none",
                            padding: "4px 8px",
                            borderRadius: "8px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>

                    <p style={{ margin: "2px 0 4px", fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      {b.message}
                    </p>

                    {b.link && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "var(--accent, #6366f1)", fontWeight: 700 }}>
                        <span>🔗 Target Action URL:</span>
                        <code style={{ background: "var(--bg-secondary)", padding: "2px 8px", borderRadius: "6px", fontSize: "0.8rem" }}>{b.link}</code>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Broadcast Composer Modal */}
      {isComposerOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
          <div style={{ background: "var(--card-bg, #fff)", maxWidth: "560px", width: "100%", borderRadius: "24px", padding: "28px", boxShadow: "0 25px 30px -5px rgba(0,0,0,0.35)", border: "1px solid var(--card-border, #e2e8f0)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 900, margin: 0, color: "var(--text-primary)" }}>
                  📢 Compose Student Broadcast
                </h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0" }}>
                  Broadcast will appear in the student app feed and notification center.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                style={{ background: "transparent", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "var(--text-secondary)" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Target Audience
                  </label>
                  <select
                    className={styles.filter}
                    style={{ width: "100%" }}
                    value={composerForm.audience}
                    onChange={(e) => setComposerForm({ ...composerForm, audience: e.target.value })}
                  >
                    <option value="all">👥 All Students</option>
                    <option value="pro">👑 Pro Members Only</option>
                    <option value="free">🏷️ Free Plan Students</option>
                    <option value="exam">🎯 Mock Exam Candidates</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Category Type
                  </label>
                  <select
                    className={styles.filter}
                    style={{ width: "100%" }}
                    value={composerForm.category}
                    onChange={(e) => setComposerForm({ ...composerForm, category: e.target.value })}
                  >
                    <option value="general">📢 General Announcement</option>
                    <option value="exam_alert">⚡ Exam / Test Alert</option>
                    <option value="reward">🎁 Coins / Bonus Offer</option>
                    <option value="update">🚀 New Feature Release</option>
                    <option value="system">🛠️ System Notice</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Announcement Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UPSC Prelims Mock Test Series Live Now!"
                  value={composerForm.title}
                  onChange={(e) => setComposerForm({ ...composerForm, title: e.target.value })}
                  className={styles.filter}
                  style={{ width: "100%", padding: "10px 14px", fontWeight: 700 }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>
                    Message Body
                  </label>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    {composerForm.message.length} chars
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide detailed instructions, important exam dates, or motivational words..."
                  value={composerForm.message}
                  onChange={(e) => setComposerForm({ ...composerForm, message: e.target.value })}
                  className={styles.filter}
                  style={{ width: "100%", padding: "10px 14px", resize: "vertical" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Action / Deep Link (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. /mock-tests or /daily-quiz"
                  value={composerForm.link}
                  onChange={(e) => setComposerForm({ ...composerForm, link: e.target.value })}
                  className={styles.filter}
                  style={{ width: "100%", padding: "10px 14px" }}
                />
              </div>

              {/* Live Preview Box */}
              <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--card-border)", borderRadius: "14px", padding: "14px" }}>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-secondary)", marginBottom: "8px", textTransform: "uppercase" }}>
                  📱 Student Preview
                </div>
                <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "12px", padding: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 900, color: CATEGORY_COLORS[composerForm.category]?.color }}>
                      {CATEGORY_COLORS[composerForm.category]?.label}
                    </span>
                    <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                      {composerForm.title || "Your Announcement Title"}
                    </strong>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                    {composerForm.message || "Your message preview will appear here..."}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className={styles.secondaryBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={styles.primaryBtn}
                  style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", color: "#fff" }}
                >
                  {isSubmitting ? "Broadcasting..." : "🚀 Send Broadcast"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
