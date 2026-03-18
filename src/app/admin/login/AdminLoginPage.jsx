"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminLogin.module.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAdmin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    router.replace("/admin");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(username, password);
    if (result.success) {
      router.push("/admin");
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={`${styles.card} glass-card`}>
        <div className={styles.header}>
          <span className={styles.icon}>🔐</span>
          <h1 className={styles.title}>Admin Panel</h1>
          <p className={styles.subtitle}>Sign in to manage your quizzes</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.label}>Username</label>
            <input
              type="text"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            className={`btn-primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

      </div>
    </div>
  );
}
