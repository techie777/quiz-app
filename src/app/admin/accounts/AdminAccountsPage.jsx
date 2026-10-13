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
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(25);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", displayName: "" });
  const [msg, setMsg] = useState("");
  const [permEditor, setPermEditor] = useState({ id: null, perms: {} });
  const [masterEditor, setMasterEditor] = useState({ id: null, username: "", currentPassword: "", password: "" });
  const [resetPwDialog, setResetPwDialog] = useState(null); // { id, username }
  const [newPasswordVal, setNewPasswordVal] = useState("");
  const [editUserDialog, setEditUserDialog] = useState({ isOpen: false, user: null, name: "", pin: "" });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", message: "", confirmText: "Confirm", isDanger: true, onConfirm: null });

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

  const totalUserPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredUsers.length / userPageSize));
  }, [filteredUsers.length, userPageSize]);

  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * userPageSize;
    return filteredUsers.slice(start, start + userPageSize);
  }, [filteredUsers, userPage, userPageSize]);

  // Reset to page 1 on search change
  const handleUserSearchChange = (val) => {
    setUserSearch(val);
    setUserPage(1);
  };

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

  const handleResetPassword = async (id, username) => {
    setResetPwDialog({ id, username });
    setNewPasswordVal("");
  };

  const submitResetPassword = async () => {
    if (!resetPwDialog?.id || !newPasswordVal.trim()) {
      toast.error("Please enter a new password");
      return;
    }
    try {
      const res = await fetch(`/api/admin/accounts/${resetPwDialog.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: newPasswordVal.trim() }),
      });
      if (res.ok) {
        toast.success("Password reset successfully!");
        setResetPwDialog(null);
        setNewPasswordVal("");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to reset password");
      }
    } catch {
      toast.error("Network error resetting password");
    }
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Admin Account",
      message: "Are you sure you want to delete this admin account permanently?",
      confirmText: "Delete Account",
      isDanger: true,
      onConfirm: async () => {
        const res = await fetch(`/api/admin/accounts/${id}`, { method: "DELETE" });
        if (res.ok) {
          fetchAccounts();
          toast.success("Account deleted!");
        } else {
          toast.error("Failed to delete account");
        }
      }
    });
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

  const handleEditUser = (user) => {
    setEditUserDialog({
      isOpen: true,
      user,
      name: user.name || "",
      pin: user.pin || ""
    });
  };

  const saveEditUser = async () => {
    const { user, name, pin } = editUserDialog;
    if (!user) return;
    if (pin && pin.length !== 4 && !/^\d{4}$/.test(pin)) {
      toast.error("PIN must be exactly 4 digits or left blank");
      return;
    }

    const updates = { name };
    if (pin) updates.pin = pin;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        setEditUserDialog({ isOpen: false, user: null, name: "", pin: "" });
        fetchUsers();
        toast.success("User profile updated!");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to update user");
      }
    } catch {
      toast.error("Network error updating user");
    }
  };

  const handleDeleteUser = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete User Permanently",
      message: "Are you sure you want to delete this student account permanently? All quiz attempts, coins, and analytics will be removed.",
      confirmText: "Delete Student",
      isDanger: true,
      onConfirm: async () => {
        const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
        if (res.ok) {
          fetchUsers();
          toast.success("User deleted successfully!");
        } else {
          toast.error("Failed to delete user");
        }
      }
    });
  };

  const handleTogglePro = (user) => {
    const action = user.isPro ? "REVOKE" : "GRANT";
    setConfirmDialog({
      isOpen: true,
      title: `${action === "GRANT" ? "Grant" : "Revoke"} Pro Membership`,
      message: `Are you sure you want to ${action.toLowerCase()} Pro access for ${user.email || user.name}?`,
      confirmText: `${action} Access`,
      isDanger: user.isPro,
      onConfirm: async () => {
        const res = await fetch(`/api/admin/users/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPro: !user.isPro }),
        });

        if (res.ok) {
          fetchUsers();
          toast.success(user.isPro ? "Pro access revoked" : "Pro access granted!");
        } else {
          toast.error("Failed to update Pro status");
        }
      }
    });
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
                      <button className={styles.actionBtn} onClick={() => handleResetPassword(acc.id, acc.displayName || acc.username)}>🔑 Reset PW</button>
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
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Search Filter & Pagination Header */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ flex: 1, minWidth: "260px" }}>
              <input
                type="text"
                className={styles.input}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "12px" }}
                placeholder="🔍 Search users by Unique User ID (e.g. USR-8F4A21), Name, or Email..."
                value={userSearch}
                onChange={(e) => handleUserSearchChange(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                Rows per page:
              </span>
              <select
                className={styles.input}
                value={userPageSize}
                onChange={(e) => {
                  setUserPageSize(Number(e.target.value));
                  setUserPage(1);
                }}
                style={{ padding: "8px 12px", borderRadius: "10px", fontWeight: 700, width: "auto" }}
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>

              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 700 }}>
                Showing {filteredUsers.length === 0 ? 0 : (userPage - 1) * userPageSize + 1}–{Math.min(filteredUsers.length, userPage * userPageSize)} of {filteredUsers.length}
              </span>
            </div>
          </div>

          <div className={styles.list}>
            {paginatedUsers.map((u) => {
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

          {/* Pagination Controls */}
          {filteredUsers.length > userPageSize && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", padding: "14px 18px", background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "16px", marginTop: "8px" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                Page <strong>{userPage}</strong> of <strong>{totalUserPages}</strong> ({filteredUsers.length} total users)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setUserPage(1)}
                  disabled={userPage <= 1}
                  className={styles.secondaryBtn}
                  style={{ padding: "6px 12px", fontSize: "0.82rem", opacity: userPage <= 1 ? 0.4 : 1, cursor: userPage <= 1 ? "not-allowed" : "pointer" }}
                >
                  ⏮ First
                </button>
                <button
                  type="button"
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  disabled={userPage <= 1}
                  className={styles.secondaryBtn}
                  style={{ padding: "6px 14px", fontSize: "0.82rem", opacity: userPage <= 1 ? 0.4 : 1, cursor: userPage <= 1 ? "not-allowed" : "pointer" }}
                >
                  ◀ Previous
                </button>
                <div style={{ display: "flex", gap: "4px" }}>
                  {Array.from({ length: Math.min(5, totalUserPages) }, (_, i) => {
                    let pageNum;
                    if (totalUserPages <= 5) pageNum = i + 1;
                    else if (userPage <= 3) pageNum = i + 1;
                    else if (userPage >= totalUserPages - 2) pageNum = totalUserPages - 4 + i;
                    else pageNum = userPage - 2 + i;

                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setUserPage(pageNum)}
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "8px",
                          border: userPage === pageNum ? "none" : "1px solid var(--card-border)",
                          background: userPage === pageNum ? "var(--accent, #6366f1)" : "transparent",
                          color: userPage === pageNum ? "#fff" : "var(--text-primary)",
                          fontWeight: 700,
                          fontSize: "0.82rem",
                          cursor: "pointer",
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                  disabled={userPage >= totalUserPages}
                  className={styles.secondaryBtn}
                  style={{ padding: "6px 14px", fontSize: "0.82rem", opacity: userPage >= totalUserPages ? 0.4 : 1, cursor: userPage >= totalUserPages ? "not-allowed" : "pointer" }}
                >
                  Next ▶
                </button>
                <button
                  type="button"
                  onClick={() => setUserPage(totalUserPages)}
                  disabled={userPage >= totalUserPages}
                  className={styles.secondaryBtn}
                  style={{ padding: "6px 12px", fontSize: "0.82rem", opacity: userPage >= totalUserPages ? 0.4 : 1, cursor: userPage >= totalUserPages ? "not-allowed" : "pointer" }}
                >
                  Last ⏭
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit User Modal */}
      {editUserDialog.isOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
          <div style={{ background: "var(--card-bg, #fff)", maxWidth: "460px", width: "100%", borderRadius: "20px", padding: "26px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)", border: "1px solid var(--card-border, #e2e8f0)" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 900, margin: "0 0 6px 0", color: "var(--text-primary)" }}>
              ✏️ Edit Student Account
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 18px 0" }}>
              Update profile details for <strong>{editUserDialog.user?.email}</strong>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>Full Name</label>
                <input
                  type="text"
                  value={editUserDialog.name}
                  onChange={(e) => setEditUserDialog((prev) => ({ ...prev, name: e.target.value }))}
                  className={styles.input}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px" }}
                  placeholder="Student name"
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>4-Digit Login PIN (leave blank to keep current)</label>
                <input
                  type="text"
                  maxLength={4}
                  value={editUserDialog.pin}
                  onChange={(e) => setEditUserDialog((prev) => ({ ...prev, pin: e.target.value.replace(/\D/g, "") }))}
                  className={styles.input}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", letterSpacing: "2px", fontWeight: 800 }}
                  placeholder="e.g. 1234"
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setEditUserDialog({ isOpen: false, user: null, name: "", pin: "" })}
                className={styles.secondaryBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEditUser}
                className={styles.primaryBtn}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {confirmDialog.isOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
          <div style={{ background: "var(--card-bg, #fff)", maxWidth: "440px", width: "100%", borderRadius: "20px", padding: "26px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)", border: "1px solid var(--card-border, #e2e8f0)" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 900, margin: "0 0 8px 0", color: confirmDialog.isDanger ? "#f43f5e" : "var(--text-primary)" }}>
              {confirmDialog.title}
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "0 0 20px 0", lineHeight: "1.5" }}>
              {confirmDialog.message}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setConfirmDialog({ isOpen: false, title: "", message: "", confirmText: "", isDanger: false, onConfirm: null })}
                className={styles.secondaryBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                  setConfirmDialog({ isOpen: false, title: "", message: "", confirmText: "", isDanger: false, onConfirm: null });
                }}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "none",
                  background: confirmDialog.isDanger ? "#ef4444" : "var(--accent, #6366f1)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                }}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Reset Password Modal */}
      {resetPwDialog && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
          <div style={{ background: "var(--card-bg, #fff)", maxWidth: "420px", width: "100%", borderRadius: "16px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)", border: "1px solid var(--card-border, #e2e8f0)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 6px 0", color: "var(--text-primary, #0f172a)" }}>
              Reset Password for {resetPwDialog.username}
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary, #64748b)", margin: "0 0 16px 0" }}>
              Enter a secure new password for this administrator account.
            </p>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPasswordVal}
              onChange={(e) => setNewPasswordVal(e.target.value)}
              className={styles.input}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", marginBottom: "16px" }}
              autoFocus
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setResetPwDialog(null)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--card-border, #e2e8f0)", background: "transparent", color: "var(--text-primary, #0f172a)", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitResetPassword}
                style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "var(--accent, #6366f1)", color: "#fff", fontWeight: 700, cursor: "pointer" }}
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
