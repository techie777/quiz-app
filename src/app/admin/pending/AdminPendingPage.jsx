"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminPending.module.css";
import toast from "react-hot-toast";

export default function AdminPendingPage() {
  const { adminUser } = useAdmin();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [rejectingTaskId, setRejectingTaskId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pending?status=${filter}`);
      if (res.ok) {
        setTasks(await res.json());
      } else {
        toast.error("Failed to load approval queue");
      }
    } catch {
      toast.error("Network error fetching approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const handleAction = async (taskId, action, reason = null) => {
    try {
      const res = await fetch(`/api/admin/pending/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      if (res.ok) {
        toast.success(`Task ${action === "approve" ? "approved" : "rejected"} successfully!`);
        setRejectingTaskId(null);
        setRejectReason("");
        fetchTasks();
      } else {
        const data = await res.json();
        toast.error(data.error || `Failed to ${action} task`);
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  if (adminUser?.role !== "master") {
    return (
      <div className={styles.page}>
        <p>Access denied. Master admin only.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Approval Queue</h1>
      <p className={styles.subtitle}>Review and manage pending changes submitted by Junior Admins</p>

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
        <p className={styles.empty}>No {filter} tasks in queue.</p>
      ) : (
        <div className={styles.list}>
          {tasks.map((task) => (
            <div key={task.id} className={`${styles.card} glass-card`}>
              <div className={styles.cardTop}>
                <span className={`${styles.typeBadge} ${styles[task.actionType?.split("_")[0]] || ""}`}>
                  {task.actionType?.replace(/_/g, " ")}
                </span>
                <span className={`${styles.statusBadge} ${styles[task.status] || ""}`}>
                  ● {task.status}
                </span>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.detail}>
                  <strong>Entity:</strong> {task.entityType} {task.entityId ? `(${task.entityId})` : ""}
                </p>
                <p className={styles.detail}>
                  <strong>Submitted By:</strong> {task.admin?.displayName || task.admin?.username || "Unknown"}
                </p>
                <p className={styles.detail}>
                  <strong>Date:</strong> {new Date(task.createdAt).toLocaleString()}
                </p>

                {/* Formatted Payload Inspection */}
                <div style={{ marginTop: "12px", background: "var(--bg-secondary, #f8fafc)", padding: "12px", borderRadius: "10px", border: "1px solid var(--card-border, #e2e8f0)" }}>
                  <div style={{ fontWeight: 700, fontSize: "12px", color: "var(--text-secondary, #64748b)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Proposed Updates
                  </div>
                  {task.payload && typeof task.payload === "object" ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
                      {Object.entries(task.payload).map(([k, v]) => (
                        <div key={k} style={{ fontSize: "12px", background: "var(--card-bg, #fff)", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--card-border, #e2e8f0)" }}>
                          <span style={{ fontWeight: 700, color: "var(--text-secondary, #64748b)" }}>{k}: </span>
                          <span style={{ fontWeight: 600, color: "var(--text-primary, #0f172a)" }}>
                            {typeof v === "object" ? JSON.stringify(v) : String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <details className={styles.payloadDetails} style={{ marginTop: "8px" }}>
                    <summary style={{ cursor: "pointer", fontSize: "11px", color: "var(--accent, #6366f1)" }}>View raw JSON</summary>
                    <pre className={styles.payload} style={{ marginTop: "6px" }}>{JSON.stringify(task.payload, null, 2)}</pre>
                  </details>
                </div>

                {task.reason && (
                  <p style={{ marginTop: "8px", fontSize: "13px", color: "#e11d48", fontWeight: 600 }}>
                    Rejection note: {task.reason}
                  </p>
                )}
              </div>

              {task.status === "pending" && (
                <div className={styles.actions}>
                  <button className={styles.approveBtn} onClick={() => handleAction(task.id, "approve")}>
                    ✅ Approve
                  </button>
                  <button
                    className={styles.rejectBtn}
                    onClick={() => {
                      setRejectingTaskId(task.id);
                      setRejectReason("");
                    }}
                  >
                    ❌ Reject...
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

      {/* Reject Reason In-App Modal Dialog */}
      {rejectingTaskId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
          <div style={{ background: "var(--card-bg, #fff)", maxWidth: "460px", width: "100%", borderRadius: "16px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)", border: "1px solid var(--card-border, #e2e8f0)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 8px 0", color: "var(--text-primary, #0f172a)" }}>
              Reject Task
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary, #64748b)", margin: "0 0 16px 0" }}>
              Provide feedback or a reason so the Junior Admin knows what to fix.
            </p>
            <textarea
              style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--card-border, #cbd5e1)", background: "var(--bg-primary, #fff)", color: "var(--text-primary, #0f172a)", fontSize: "14px", resize: "vertical", minHeight: "80px" }}
              placeholder="e.g. Please verify the question text and re-submit with Hindi translation."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
              <button
                type="button"
                onClick={() => setRejectingTaskId(null)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--card-border, #e2e8f0)", background: "transparent", color: "var(--text-primary, #0f172a)", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction(rejectingTaskId, "reject", rejectReason)}
                style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#ef4444", color: "#fff", fontWeight: 700, cursor: "pointer" }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
