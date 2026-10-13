"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/Admin.module.css";
import toast from "react-hot-toast";
import { useAdmin } from "@/context/AdminContext";

export default function AdminForumPage() {
  const { adminUser } = useAdmin();
  const [activeTab, setActiveTab] = useState("groups");
  
  const [groups, setGroups] = useState([]);
  const [newGroup, setNewGroup] = useState({ name: "", slug: "", description: "", icon: "💬" });
  const [banEmail, setBanEmail] = useState("");
  const [banDays, setBanDays] = useState(7);
  
  // Moderation state
  const [pendingTopics, setPendingTopics] = useState([]);
  const [deletedTopics, setDeletedTopics] = useState([]);
  
  const fetchGroups = async () => {
    const res = await fetch("/api/forum/groups");
    if (res.ok) setGroups(await res.json());
  };
  
  const fetchModerationQueues = async () => {
    // We will reuse the public API but maybe bypass it. 
    // Actually, we don't have an admin GET route for pending topics.
    // I should create one, or just add a flag to the public route.
    // For now, I'll assume we can fetch them via a new dedicated admin endpoint or just create it next.
    const res = await fetch("/api/admin/forum/moderation/queue");
    if (res.ok) {
      const data = await res.json();
      setPendingTopics(data.pending);
      setDeletedTopics(data.deleted);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchModerationQueues();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/admin/forum/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newGroup)
    });
    
    if (res.ok) {
      toast.success("Group created");
      setNewGroup({ name: "", slug: "", description: "", icon: "💬" });
      fetchGroups();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to create group");
    }
  };

  const handleToggleGroup = async (id, isActive) => {
    await fetch("/api/admin/forum/groups", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive })
    });
    fetchGroups();
  };

  const handleBanUser = async (e) => {
    e.preventDefault();
    if (!banEmail) return;
    
    const res = await fetch("/api/admin/forum/moderation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "BAN_USER", targetId: banEmail, days: parseInt(banDays) })
    });
    
    if (res.ok) {
      toast.success(`User ${banEmail} banned for ${banDays} days`);
      setBanEmail("");
    } else {
      toast.error("User not found or error occurred");
    }
  };

  // Rejection modal state
  const [rejectingTopicId, setRejectingTopicId] = useState(null);
  const [forumRejectReason, setForumRejectReason] = useState("");

  const handleModerateTopic = async (action, targetId, customReason = null) => {
    let reason = customReason;
    if (action === "REJECT_TOPIC" && !reason) {
      setRejectingTopicId(targetId);
      setForumRejectReason("");
      return;
    }
    
    const res = await fetch("/api/admin/forum/moderation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, targetId, reason })
    });
    
    if (res.ok) {
      toast.success(action === "APPROVE_TOPIC" ? "Topic approved live!" : "Action applied");
      setRejectingTopicId(null);
      setForumRejectReason("");
      fetchModerationQueues();
    } else {
      toast.error("Failed to apply action");
    }
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>Forum Management</h1>
      
      <div className={styles.tabs} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className={activeTab === 'groups' ? styles.btnPrimary : styles.btnSecondary} onClick={() => setActiveTab('groups')}>Groups & Users</button>
        <button className={activeTab === 'pending' ? styles.btnPrimary : styles.btnSecondary} onClick={() => setActiveTab('pending')}>Approval Queue ({pendingTopics.length})</button>
        <button className={activeTab === 'deleted' ? styles.btnPrimary : styles.btnSecondary} onClick={() => setActiveTab('deleted')}>Deleted Logs</button>
      </div>
      
      {activeTab === 'groups' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Groups Manager */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Forum Groups</h2>
            
            <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
              <input type="text" placeholder="Name (e.g. SSC)" value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})} required className={styles.input} />
              <input type="text" placeholder="Slug (e.g. ssc-exams)" value={newGroup.slug} onChange={e => setNewGroup({...newGroup, slug: e.target.value})} required className={styles.input} />
              <input type="text" placeholder="Description" value={newGroup.description} onChange={e => setNewGroup({...newGroup, description: e.target.value})} className={styles.input} style={{ width: '100%' }} />
              <input type="text" placeholder="Emoji Icon" value={newGroup.icon} onChange={e => setNewGroup({...newGroup, icon: e.target.value})} className={styles.input} style={{ width: '80px' }} />
              <button type="submit" className={styles.btnPrimary}>Create Group</button>
            </form>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Icon</th>
                  <th>Name</th>
                  <th>Topics</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(g => (
                  <tr key={g.id}>
                    <td>{g.icon}</td>
                    <td>{g.name}<br/><small>{g.slug}</small></td>
                    <td>{g._count?.topics || 0}</td>
                    <td>{g.isActive ? "Active" : "Disabled"}</td>
                    <td>
                      <button 
                        className={styles.btnSecondary} 
                        onClick={() => handleToggleGroup(g.id, !g.isActive)}
                      >
                        {g.isActive ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* User Moderation */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>User Moderation</h2>
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Suspend a user from posting or commenting in the forum.
            </p>
            <form onSubmit={handleBanUser} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input 
                type="email" 
                placeholder="User Email Address" 
                value={banEmail} 
                onChange={e => setBanEmail(e.target.value)} 
                required 
                className={styles.input}
                style={{ flex: 1 }}
              />
              <select value={banDays} onChange={e => setBanDays(e.target.value)} className={styles.input} style={{ width: '120px' }}>
                <option value={1}>1 Day</option>
                <option value={3}>3 Days</option>
                <option value={7}>7 Days</option>
                <option value={30}>30 Days</option>
                <option value={3650}>Permanent</option>
              </select>
              <button type="submit" className={styles.btnDanger}>Ban User</button>
            </form>
          </section>
        </div>
      )}

      {activeTab === 'pending' && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Pending Topics</h2>
          {pendingTopics.length === 0 && <p>No pending topics require approval.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendingTopics.map(t => (
              <div key={t.id} style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>{t.title}</strong>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>by {t.author?.name} ({t.author?.email})</span>
                </div>
                <p style={{ whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>{t.content}</p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className={styles.btnPrimary} onClick={() => handleModerateTopic("APPROVE_TOPIC", t.id)}>Approve</button>
                  <button className={styles.btnDanger} onClick={() => handleModerateTopic("REJECT_TOPIC", t.id)}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'deleted' && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Deleted Logs (Soft Deleted)</h2>
          {deletedTopics.length === 0 && <p>No deleted topics.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {deletedTopics.map(t => (
              <div key={t.id} style={{ border: '1px solid red', padding: '1rem', borderRadius: '8px', opacity: 0.8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>{t.title}</strong>
                  <span style={{ fontSize: '0.9rem', color: 'red' }}>Deleted by {t.author?.name}</span>
                </div>
                <p style={{ whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>{t.content}</p>
                <button className={styles.btnSecondary} onClick={() => handleModerateTopic("RESTORE_TOPIC", t.id)}>Restore Post</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* In-App Rejection Modal */}
      {rejectingTopicId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
          <div style={{ background: "var(--card-bg, #fff)", maxWidth: "460px", width: "100%", borderRadius: "16px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)", border: "1px solid var(--card-border, #e2e8f0)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 8px 0", color: "var(--text-primary, #0f172a)" }}>
              Reject Forum Topic
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary, #64748b)", margin: "0 0 16px 0" }}>
              Please provide a reason or select a template to explain why this post was declined.
            </p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
              {["Off-topic discussion", "Contains offensive language", "Promotional / Spam content", "Duplicate question"].map((reasonPreset) => (
                <button
                  key={reasonPreset}
                  type="button"
                  onClick={() => setForumRejectReason(reasonPreset)}
                  style={{ fontSize: "11px", fontWeight: 600, padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--card-border, #cbd5e1)", background: "var(--bg-secondary, #f8fafc)", cursor: "pointer", color: "var(--text-secondary, #475569)" }}
                >
                  + {reasonPreset}
                </button>
              ))}
            </div>
            <textarea
              style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--card-border, #cbd5e1)", background: "var(--bg-primary, #fff)", color: "var(--text-primary, #0f172a)", fontSize: "14px", resize: "vertical", minHeight: "80px" }}
              placeholder="Enter rejection reason..."
              value={forumRejectReason}
              onChange={(e) => setForumRejectReason(e.target.value)}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
              <button
                type="button"
                onClick={() => setRejectingTopicId(null)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--card-border, #e2e8f0)", background: "transparent", color: "var(--text-primary, #0f172a)", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleModerateTopic("REJECT_TOPIC", rejectingTopicId, forumRejectReason || "Declined by moderator")}
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
