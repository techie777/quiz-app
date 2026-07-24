"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminAccounts.module.css";
import toast, { Toaster } from "react-hot-toast";

function getUserDisplayId(user) {
  if (user.userCode) return user.userCode;
  const shortId = (user.id || "").slice(-6).toUpperCase();
  return `USR-${shortId}`;
}

export default function AdminAccountsPage() {
  const { adminUser } = useAdmin();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") === "user" ? "user" : "admin";

  const [accounts, setAccounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [viewType, setViewType] = useState(initialType);
  const [userSearch, setUserSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", displayName: "" });
  const [msg, setMsg] = useState("");
  const [permEditor, setPermEditor] = useState({ id: null, perms: {} });
  const [masterEditor, setMasterEditor] = useState({ id: null, username: "", currentPassword: "", password: "" });

  const PERMISSION_FIELDS = [
    { key: "categories", label: "Categories" },
    { key: "questions", label: "Questions" },
    { key: "daily", label: "Daily Quizzes" },
    { key: "currentAffairs", label: "Current Affairs" },
    { key: "govtExams", label: "Govt Exams" },
    { key: "mockTestsManager", label: "Mock Tests Engine" },
    { key: "rewards", label: "Rewards & Coins" },
    { key: "studyMaterial", label: "Study Materials" },
    { key: "sections", label: "Sections" },
    { key: "funFacts", label: "Fun Facts" },
    { key: "bookMyCourse", label: "Book My Course" },
    { key: "careerGuides", label: "Career Guides" },
    { key: "schoolStudy", label: "School Study" },
    { key: "upload", label: "Bulk Upload" },
    { key: "settings", label: "Settings" },
    { key: "notifications", label: "Notifications" },
  ];

  const parsePerms = (raw) => {
    if (raw && typeof raw === "object") return raw;
    if (typeof raw !== "string" || !raw.trim()) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  };

  useEffect(() => {
    const type = searchParams.get("type") === "user" ? "user" : "admin";
    setViewType(type);
  }, [searchParams]);

  const fetchAccounts = async () => {
    const res = await fetch("/api/admin/accounts?type=admin");
    if (res.ok) setAccounts(await res.json());
  };

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/accounts?type=user");
    if (res.ok) setUsers(await res.json());
  };

  useEffect(() => {
    if (viewType === "admin") fetchAccounts();
    else fetchUsers();
  }, [viewType]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter((u) => {
      const displayId = getUserDisplayId(u).toLowerCase();
      return (
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        displayId.includes(q)
      );
    });
  }, [users, userSearch]);

  const proUsersCount = useMemo(() => users.filter((u) => u.isPro).length, [users]);

  const handleCreate = async () => {
    setMsg("");
    if (!form.username || !form.password) { setMsg("Username and password required"); return; }
    const res = await fetch("/api/admin/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ username: "", password: "", displayName: "" });
      setShowCreate(false);
      fetchAccounts();
      toast.success("Jr Admin account created!");
    } else {
      const data = await res.json();
      setMsg(data.error || "Failed to create account");
    }
  };

  const handleStatusChange = async (id, status) => {
    await fetch(`/api/admin/accounts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchAccounts();
    toast.success(`Account status updated to ${status}`);
  };

  const handleResetPassword = async (id) => {
    const newPw = prompt("Enter new password:");
    if (!newPw) return;
    await fetch(`/api/admin/accounts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: newPw }),
    });
    toast.success("Password reset successfully!");
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this admin account?")) return;
    await fetch(`/api/admin/accounts/${id}`, { method: "DELETE" });
    fetchAccounts();
    toast.success("Account deleted!");
  };

  const openPermissions = (acc) => {
    setPermEditor({ id: acc.id, perms: parsePerms(acc.permissions) });
  };

  const savePermissions = async () => {
    if (!permEditor.id) return;
    await fetch(`/api/admin/accounts/${permEditor.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: JSON.stringify(permEditor.perms) }),
    });
    setPermEditor({ id: null, perms: {} });
    fetchAccounts();
    toast.success("Permissions updated!");
  };

  const handleEditUser = async (user) => {
    const newName = prompt("Enter new name:", user.name || "");
    const newPin = prompt("Enter new 4-digit PIN (optional):", user.pin || "");

    if (newName === null && newPin === null) return;

    const updates = {};
    if (newName !== null) updates.name = newName;
    if (newPin !== null && newPin.length === 4) updates.pin = newPin;

    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (res.ok) {
      fetchUsers();
      toast.success("User updated!");
    } else alert("Failed to update user");
  };

  const handleDeleteUser = async (id) => {
    if (!confirm("Delete this user account permanently?")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchUsers();
      toast.success("User deleted!");
    } else alert("Failed to delete user");
  };

  const handleTogglePro = async (user) => {
    const isConfirm = confirm(`Are you sure you want to ${user.isPro ? 'REVOKE' : 'GRANT'} Pro access for ${user.email}?`);
    if (!isConfirm) return;

    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPro: !user.isPro }),
    });

    if (res.ok) {
      fetchUsers();
      toast.success(user.isPro ? "Pro access revoked" : "Pro access granted!");
    } else alert("Failed to update Pro status");
  };

  if (adminUser?.role !== "master") {
    return <div className={styles.page}><p>Access denied. Master admin only.</p></div>;
  }

  return (
    <div className={styles.page}>
      <Toaster position="top-right" />

      {/* Header Banner */}
      <div className={styles.headerRow}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.badgeHeader}>
            <span>👥 ACCOUNTS & PERMISSIONS HUB</span>
          </div>
          <h1 className={styles.title}>Account Management</h1>
          <p className={styles.subtitle}>
            Manage Master/Jr Admin credentials, User Accounts, and Unique User IDs.
          </p>
        </div>

        <div className={styles.actionButtonsGroup}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${viewType === "admin" ? styles.activeTab : ""}`}
              onClick={() => setViewType("admin")}
            >
              🔐 Admins ({accounts.length})
            </button>
            <button
              className={`${styles.tab} ${viewType === "user" ? styles.activeTab : ""}`}
              onClick={() => setViewType("user")}
            >
              👤 Standard Users ({users.length})
            </button>
          </div>

          {viewType === "admin" && (
            <button className={styles.primaryBtn} onClick={() => setShowCreate(!showCreate)}>
              <span>⚡ + Create Jr Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* User Stats KPI Grid */}
      {viewType === "user" && (
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon} style={{ background: "rgba(99, 102, 241, 0.12)", color: "#6366f1" }}>👤</div>
            <div className={styles.kpiContent}>
              <div className={styles.kpiValue}>{users.length}</div>
              <div className={styles.kpiLabel}>Total Registered Users</div>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon} style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>👑</div>
            <div className={styles.kpiContent}>
              <div className={styles.kpiValue}>{proUsersCount}</div>
              <div className={styles.kpiLabel}>Premium Pro Members</div>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon} style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>🏷️</div>
            <div className={styles.kpiContent}>
              <div className={styles.kpiValue}>{users.length - proUsersCount}</div>
              <div className={styles.kpiLabel}>Free Plan Users</div>
            </div>
          </div>
        </div>
      )}

      {viewType === "admin" ? (
        <>
          {showCreate && (
            <div style={{ background: "var(--bg-primary)", border: "1px solid var(--card-border)", borderRadius: "16px", padding: "20px" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: "1.05rem", fontWeight: 800 }}>➕ Create Jr Admin Account</h3>
              {msg && <div style={{ color: "#f43f5e", marginBottom: "10px", fontSize: "0.85rem", fontWeight: 700 }}>⚠️ {msg}</div>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "10px", alignItems: "center" }}>
                <input className={styles.input} placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                <input className={styles.input} placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <input className={styles.input} placeholder="Display Name" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
                <button className={styles.primaryBtn} onClick={handleCreate}>Save Account</button>
              </div>
            </div>
          )}

          <div className={styles.list}>
            {accounts.map((acc) => (
              <div key={acc.id}>
                <div className={styles.row}>
                  <div className={styles.rowInfo}>
                    <span className={styles.name}>{acc.displayName || acc.username}</span>
                    <span className={styles.username}>@{acc.username}</span>
                    <span className={`${styles.roleBadge} ${styles[acc.role]}`}>{acc.role}</span>
                    <span className={`${styles.statusBadge} ${styles[acc.status]}`}>{acc.status}</span>
                  </div>
                  {acc.role === "master" ? (
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} onClick={() => setMasterEditor({ id: acc.id, username: acc.username || "", currentPassword: "", password: "" })}>✏️ Edit Login</button>
                    </div>
                  ) : (
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} onClick={() => openPermissions(acc)}>🔐 Access</button>
                      {acc.status === "active" && (
                        <button className={styles.actionBtn} onClick={() => handleStatusChange(acc.id, "paused")}>⏸ Pause</button>
                      )}
                      {acc.status === "paused" && (
                        <button className={styles.actionBtn} onClick={() => handleStatusChange(acc.id, "active")}>▶ Activate</button>
                      )}
                      <button className={styles.actionBtn} onClick={() => handleResetPassword(acc.id)}>🔑 Reset PW</button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(acc.id)}>🗑️ Delete</button>
                    </div>
                  )}
                </div>

                {permEditor.id === acc.id && (
                  <div style={{ background: "var(--bg-primary)", border: "1px solid var(--card-border)", borderRadius: "14px", padding: "16px", marginTop: "8px" }}>
                    <h4 style={{ margin: "0 0 10px", fontSize: "0.95rem", fontWeight: 800 }}>🔐 Jr Admin Access Permissions</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
                      {PERMISSION_FIELDS.map((f) => (
                        <label key={f.key} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={permEditor.perms?.[f.key] !== false}
                            onChange={(e) => {
                              const next = { ...(permEditor.perms || {}) };
                              next[f.key] = e.target.checked;
                              setPermEditor((prev) => ({ ...prev, perms: next }));
                            }}
                          />
                          <span>{f.label}</span>
                        </label>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                      <button className={styles.primaryBtn} onClick={savePermissions}>Save Access</button>
                      <button className={styles.secondaryBtn} onClick={() => setPermEditor({ id: null, perms: {} })}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Search Filter for User Accounts */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <input
              type="text"
              className={styles.input}
              style={{ width: "100%", padding: "12px 16px", borderRadius: "12px" }}
              placeholder="🔍 Search users by Unique User ID (e.g. USR-8F4A21), Name, or Email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>

          <div className={styles.list}>
            {filteredUsers.map((u) => {
              const displayId = getUserDisplayId(u);
              return (
                <div key={u.id} className={styles.row}>
                  <div className={styles.rowInfo}>
                    <span style={{ padding: "4px 10px", borderRadius: "8px", background: "rgba(99, 102, 241, 0.12)", color: "#6366f1", fontSize: "0.78rem", fontWeight: 800, letterSpacing: "0.5px" }}>
                      🆔 {displayId}
                    </span>
                    <div>
                      <div className={styles.name}>
                        {u.name || "No Name"}
                        {u.isPro && <span title="Premium Pro Member" style={{ marginLeft: "8px", fontSize: "0.7rem", background: "#6366f1", color: "#fff", padding: "2px 8px", borderRadius: "10px", fontWeight: 800 }}>👑 PRO</span>}
                      </div>
                      <div className={styles.username}>{u.email}</div>
                    </div>
                  </div>

                  <div className={styles.rowActions}>
                    <div className={styles.pinDisplay}>
                      <span className={styles.pinLabel}>Login PIN:</span>
                      <span className={styles.pinValue}>{u.pin || "Not set"}</span>
                    </div>
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} onClick={() => handleTogglePro(u)}>
                        {u.isPro ? "❌ Revoke Pro" : "👑 Grant Pro"}
                      </button>
                      <button className={styles.actionBtn} onClick={() => handleEditUser(u)}>✏️ Edit</button>
                      <button className={styles.deleteBtn} onClick={() => handleDeleteUser(u.id)}>🗑️ Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredUsers.length === 0 && <p className={styles.empty}>No matching users found.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
