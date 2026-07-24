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

export default function AdminNotificationsPage() {
  const { adminUser } = useAdmin();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("unread");
  const [loading, setLoading] = useState(true);

  const allowed = adminUser?.role === "master" || adminUser?.permissions?.notifications !== false;
  const query = filter === "unread" ? "?unread=1" : "";

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/notifications${query}`, { cache: "no-store" });
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!allowed) return;
    load();
  }, [allowed, query]);

  const counts = useMemo(() => {
    const unread = items.filter((n) => !n.readAt).length;
    return { unread };
  }, [items]);

  const markAllRead = async () => {
    await fetch("/api/admin/notifications/mark-all-read", { method: "POST" });
    toast.success("All notifications marked as read!");
    await load();
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
            <span>🔔 REAL-TIME SYSTEM NOTIFICATIONS</span>
          </div>
          <h1 className={styles.title}>Admin Notifications</h1>
          <p className={styles.subtitle}>
            Review system notifications, approval requests, and user activity alerts.
          </p>
        </div>

        <div className={styles.actionButtonsGroup}>
          <button className={styles.secondaryBtn} onClick={markAllRead}>
            <span>✓ Mark All Read</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(244, 63, 94, 0.12)", color: "#f43f5e" }}>🔴</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>{counts.unread}</div>
            <div className={styles.kpiLabel}>Unread Alerts</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(99, 102, 241, 0.12)", color: "#6366f1" }}>🔔</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>{items.length}</div>
            <div className={styles.kpiLabel}>Total Notifications</div>
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

        <button className={styles.secondaryBtn} onClick={load}>
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
            You are all caught up! No unread notifications found.
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
    </div>
  );
}
