"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminLogs.module.css";

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
    await load();
  };

  if (!allowed) {
    return (
      <div className={styles.page}>
        <p className={styles.empty}>Access denied.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Notifications</h1>
          <p className={styles.subtitle}>Unread: {counts.unread}</p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          {adminUser?.role !== "master" && (
            <button className="btn-secondary" onClick={markAllRead}>
              Mark All Read
            </button>
          )}
          <select
            className={styles.filter}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="unread">Unread</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>No notifications.</p>
      ) : (
        <div className={styles.list}>
          {items.map((n) => (
            <div key={n.id} className={`${styles.row} glass-card`}>
              <div className={styles.rowTop}>
                <span className={styles.action}>{n.type}</span>
                <span className={styles.admin}>{n.title}</span>
                <span className={styles.time}>{formatTime(n.createdAt)}</span>
              </div>
              {n.message && <div className={styles.details}>{n.message}</div>}
              <div className={styles.rowTop} style={{ marginTop: "0.6rem" }}>
                {n.link ? (
                  <Link className="btn-secondary" href={n.link}>
                    Open
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
