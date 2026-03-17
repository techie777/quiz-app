"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminAccounts.module.css";

export default function AdminAccountsPage() {
  const { adminUser } = useAdmin();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") === "user" ? "user" : "admin";

  const [accounts, setAccounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [viewType, setViewType] = useState(initialType); // "admin" or "user"
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", displayName: "" });
  const [msg, setMsg] = useState("");

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
  };

  const handleResetPassword = async (id) => {
    const newPw = prompt("Enter new password:");
    if (!newPw) return;
    await fetch(`/api/admin/accounts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: newPw }),
    });
    alert("Password reset successfully");
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this admin account?")) return;
    await fetch(`/api/admin/accounts/${id}`, { method: "DELETE" });
    fetchAccounts();
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

    if (res.ok) fetchUsers();
    else alert("Failed to update user");
  };

  const handleDeleteUser = async (id) => {
    if (!confirm("Delete this user account permanently?")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) fetchUsers();
    else alert("Failed to delete user");
  };

  if (adminUser?.role !== "master") {
    return <div className={styles.page}><p>Access denied. Master admin only.</p></div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Account Management</h1>
          <p className={styles.subtitle}>Manage Admins and Users</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${viewType === "admin" ? styles.activeTab : ""}`}
              onClick={() => setViewType("admin")}
            >
              Admins
            </button>
            <button 
              className={`${styles.tab} ${viewType === "user" ? styles.activeTab : ""}`}
              onClick={() => setViewType("user")}
            >
              Users
            </button>
          </div>
          {viewType === "admin" && (
            <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>
              + Create Jr Admin
            </button>
          )}
        </div>
      </div>

      {viewType === "admin" ? (
        <>
          {showCreate && (
            <div className={`${styles.createForm} glass-card`}>
              <h3>Create Jr Admin</h3>
              {msg && <div className={styles.error}>{msg}</div>}
              <div className={styles.formRow}>
                <input className={styles.input} placeholder="Username" value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })} />
                <input className={styles.input} placeholder="Password" type="password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <input className={styles.input} placeholder="Display Name" value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
              </div>
              <button className="btn-primary" onClick={handleCreate}>Create Account</button>
            </div>
          )}

          <div className={styles.list}>
            {accounts.map((acc) => (
              <div key={acc.id} className={`${styles.row} glass-card`}>
                <div className={styles.rowInfo}>
                  <span className={styles.name}>{acc.displayName || acc.username}</span>
                  <span className={styles.username}>@{acc.username}</span>
                  <span className={`${styles.roleBadge} ${styles[acc.role]}`}>{acc.role}</span>
                  <span className={`${styles.statusBadge} ${styles[acc.status]}`}>{acc.status}</span>
                </div>
                {acc.role !== "master" && (
                  <div className={styles.actions}>
                    {acc.status === "active" && (
                      <button className={styles.actionBtn} onClick={() => handleStatusChange(acc.id, "paused")}>⏸ Pause</button>
                    )}
                    {acc.status === "paused" && (
                      <button className={styles.actionBtn} onClick={() => handleStatusChange(acc.id, "active")}>▶ Activate</button>
                    )}
                    {acc.status !== "disabled" && (
                      <button className={styles.actionBtn} onClick={() => handleStatusChange(acc.id, "disabled")}>🚫 Disable</button>
                    )}
                    {acc.status === "disabled" && (
                      <button className={styles.actionBtn} onClick={() => handleStatusChange(acc.id, "active")}>▶ Re-enable</button>
                    )}
                    <button className={styles.actionBtn} onClick={() => handleResetPassword(acc.id)}>🔑 Reset PW</button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(acc.id)}>🗑️ Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className={styles.list}>
          {users.map((u) => (
            <div key={u.id} className={`${styles.row} glass-card`}>
              <div className={styles.rowInfo}>
                <span className={styles.name}>{u.name || "No Name"}</span>
                <span className={styles.username}>{u.email}</span>
              </div>
              <div className={styles.rowActions}>
                <div className={styles.pinDisplay}>
                  <span className={styles.pinLabel}>Login PIN:</span>
                  <span className={styles.pinValue}>{u.pin || "Not set"}</span>
                </div>
                <div className={styles.actions}>
                  <button className={styles.actionBtn} onClick={() => handleEditUser(u)}>✏️ Edit</button>
                  <button className={styles.deleteBtn} onClick={() => handleDeleteUser(u.id)}>🗑️ Delete</button>
                </div>
              </div>
            </div>
          ))}
          {users.length === 0 && <p className={styles.empty}>No standard users found.</p>}
        </div>
      )}
    </div>
  );
}
