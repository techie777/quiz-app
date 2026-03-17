"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminLogs.module.css";

export default function AdminLogsPage() {
  const { adminUser } = useAdmin();
  const [logs, setLogs] = useState([]);
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = async () => {
    const params = new URLSearchParams();
    if (actionFilter) params.set("action", actionFilter);
    const res = await fetch(`/api/admin/logs?${params}`);
    if (res.ok) setLogs(await res.json());
  };

  useEffect(() => { fetchLogs(); }, [actionFilter]);

  if (adminUser?.role !== "master") {
    return <div className={styles.page}><p>Access denied. Master admin only.</p></div>;
  }

  const actionTypes = [...new Set(logs.map((l) => l.action))];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Activity Logs</h1>
          <p className={styles.subtitle}>All admin activity across the platform</p>
        </div>
        <select className={styles.filter} value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
          <option value="">All Actions</option>
          {actionTypes.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className={styles.list}>
        {logs.length === 0 && <p className={styles.empty}>No activity logs found.</p>}
        {logs.map((log) => (
          <div key={log.id} className={`${styles.row} glass-card`}>
            <div className={styles.rowTop}>
              <span className={styles.action}>{log.action}</span>
              <span className={styles.admin}>{log.admin?.displayName || log.admin?.username || "System"}</span>
              <span className={styles.time}>{new Date(log.createdAt).toLocaleString()}</span>
            </div>
            {log.details && <div className={styles.details}>{log.details}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
