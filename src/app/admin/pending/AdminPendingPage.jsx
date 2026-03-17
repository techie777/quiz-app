"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminPending.module.css";

export default function AdminPendingPage() {
  const { adminUser } = useAdmin();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/pending?status=${filter}`);
    if (res.ok) setTasks(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, [filter]);

  const handleAction = async (taskId, action) => {
    try {
      const res = await fetch(`/api/admin/pending/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchTasks();
      } else {
        const data = await res.json();
        alert(data.error || `Failed to ${action} task`);
      }
    } catch {
      alert("Network error. Please try again.");
    }
  };

  if (adminUser?.role !== "master") {
    return <div className={styles.page}><p>Access denied. Master admin only.</p></div>;
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Approval Queue</h1>
      <p className={styles.subtitle}>Review and manage pending admin actions</p>

      <div className={styles.filters}>
        {["pending", "approved", "rejected", "all"].map((s) => (
          <button
            key={s}
            className={`${styles.filterBtn} ${filter === s ? styles.filterActive : ""}`}
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : tasks.length === 0 ? (
        <p className={styles.empty}>No {filter} tasks.</p>
      ) : (
        <div className={styles.list}>
          {tasks.map((task) => (
            <div key={task.id} className={`${styles.card} glass-card`}>
              <div className={styles.cardTop}>
                <span className={`${styles.typeBadge} ${styles[task.actionType.split("_")[0]]}`}>
                  {task.actionType.replace(/_/g, " ")}
                </span>
                <span className={`${styles.statusBadge} ${styles[task.status]}`}>
                  {task.status}
                </span>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.detail}>
                  <strong>Entity:</strong> {task.entityType} {task.entityId ? `(${task.entityId})` : ""}
                </p>
                <p className={styles.detail}>
                  <strong>By:</strong> {task.admin?.displayName || task.admin?.username}
                </p>
                <p className={styles.detail}>
                  <strong>Date:</strong> {new Date(task.createdAt).toLocaleString()}
                </p>
                <details className={styles.payloadDetails}>
                  <summary>View payload</summary>
                  <pre className={styles.payload}>{JSON.stringify(task.payload, null, 2)}</pre>
                </details>
              </div>
              {task.status === "pending" && (
                <div className={styles.actions}>
                  <button className={styles.approveBtn} onClick={() => handleAction(task.id, "approve")}>
                    ✅ Approve
                  </button>
                  <button className={styles.rejectBtn} onClick={() => handleAction(task.id, "reject")}>
                    ❌ Reject
                  </button>
                </div>
              )}
              {task.reviewedBy && (
                <p className={styles.reviewInfo}>Reviewed by: {task.reviewedBy}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
