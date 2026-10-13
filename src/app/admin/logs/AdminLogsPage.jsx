"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminLogs.module.css";

export default function AdminLogsPage() {
  const { adminUser } = useAdmin();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [knownActions, setKnownActions] = useState([]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.set("action", actionFilter);
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      const res = await fetch(`/api/admin/logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setLogs(data);
          setTotal(data.length);
          setTotalPages(1);
        } else {
          setLogs(data.logs || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
        }

        // Keep track of observed actions for the filter dropdown
        if (data.logs || Array.isArray(data)) {
          const list = data.logs || data;
          setKnownActions((prev) => {
            const set = new Set([...prev, ...list.map((l) => l.action).filter(Boolean)]);
            return [...set];
          });
        }
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, page, limit]);

  if (adminUser?.role !== "master") {
    return <div className={styles.page}><p>Access denied. Master admin only.</p></div>;
  }

  const handleActionChange = (newAction) => {
    setActionFilter(newAction);
    setPage(1);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(Number(newLimit));
    setPage(1);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>📜 Platform Activity Logs</h1>
          <p className={styles.subtitle}>
            Audit trail of all administrative actions, permissions, and database operations.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <select
            className={styles.filter}
            value={actionFilter}
            onChange={(e) => handleActionChange(e.target.value)}
          >
            <option value="">All Action Types</option>
            {knownActions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <select
            className={styles.filter}
            value={limit}
            onChange={(e) => handleLimitChange(e.target.value)}
          >
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
            <option value={200}>200 per page</option>
          </select>
        </div>
      </div>

      {/* Summary Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "1rem", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
        <span>
          Showing <strong>{logs.length === 0 ? 0 : (page - 1) * limit + 1}</strong>–<strong>{Math.min(total, page * limit)}</strong> of <strong>{total}</strong> logged operations
        </span>
        {loading && <span style={{ color: "var(--accent-color, #6366f1)", fontWeight: 700 }}>Refreshing logs...</span>}
      </div>

      {/* Logs Table / List */}
      <div className={styles.list}>
        {!loading && logs.length === 0 && <p className={styles.empty}>No activity logs match the selected filter.</p>}
        {logs.map((log) => (
          <div key={log.id} className={`${styles.row} glass-card`}>
            <div className={styles.rowTop}>
              <span className={styles.action}>{log.action}</span>
              <span className={styles.admin}>👤 {log.admin?.displayName || log.admin?.username || "System"}</span>
              <span className={styles.time}>{new Date(log.createdAt).toLocaleString()}</span>
            </div>
            {log.details && <div className={styles.details}>{log.details}</div>}
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", padding: "14px 18px", background: "var(--card-bg)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "14px", marginTop: "1.5rem" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={page <= 1}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "transparent",
                color: "var(--text-primary)",
                fontSize: "0.82rem",
                fontWeight: 600,
                opacity: page <= 1 ? 0.4 : 1,
                cursor: page <= 1 ? "not-allowed" : "pointer"
              }}
            >
              ⏮ First
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "transparent",
                color: "var(--text-primary)",
                fontSize: "0.82rem",
                fontWeight: 600,
                opacity: page <= 1 ? 0.4 : 1,
                cursor: page <= 1 ? "not-allowed" : "pointer"
              }}
            >
              ◀ Previous
            </button>

            <span style={{ padding: "0 8px", fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-color, #6366f1)" }}>
              {page}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "transparent",
                color: "var(--text-primary)",
                fontSize: "0.82rem",
                fontWeight: 600,
                opacity: page >= totalPages ? 0.4 : 1,
                cursor: page >= totalPages ? "not-allowed" : "pointer"
              }}
            >
              Next ▶
            </button>
            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "transparent",
                color: "var(--text-primary)",
                fontSize: "0.82rem",
                fontWeight: 600,
                opacity: page >= totalPages ? 0.4 : 1,
                cursor: page >= totalPages ? "not-allowed" : "pointer"
              }}
            >
              Last ⏭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
