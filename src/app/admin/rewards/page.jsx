"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminRewards.module.css";
import toast, { Toaster } from "react-hot-toast";

export default function AdminRewardsPage() {
  const { adminUser } = useAdmin();
  const isMaster = adminUser?.role === "master";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ transactions: [], stats: {}, settings: {} });

  // Form State for Manual Grant
  const [grantUserInput, setGrantUserInput] = useState("");
  const [grantAmount, setGrantAmount] = useState("100");
  const [grantType, setGrantType] = useState("BONUS");
  const [grantDesc, setGrantDesc] = useState("");
  const [granting, setGranting] = useState(false);

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    correctAnswerCoins: 5,
    dailyLoginCoins: 20,
    quizCompletionCoins: 50,
    referralCoins: 100
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/rewards");
      if (res.ok) {
        const result = await res.json();
        setData(result);
        if (result.settings) {
          setSettingsForm(result.settings);
        }
      }
    } catch (err) {
      console.error("Fetch rewards error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMaster) {
      fetchData();
    }
  }, [isMaster]);

  const handleManualGrant = async (e) => {
    e.preventDefault();
    if (!grantUserInput || !grantAmount) {
      toast.error("User ID and Coin Amount are required");
      return;
    }

    setGranting(true);
    try {
      const res = await fetch("/api/admin/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "manual_grant",
          userId: grantUserInput.trim(),
          amount: parseInt(grantAmount, 10),
          type: grantType,
          description: grantDesc.trim() || `Manual ${grantType} Adjustment`
        })
      });

      const result = await res.json();
      if (res.ok) {
        toast.success(result.message || "Coins updated!");
        setGrantUserInput("");
        setGrantDesc("");
        await fetchData();
      } else {
        toast.error(result.error || "Failed to update coins");
      }
    } catch (err) {
      toast.error("Error granting coins");
    } finally {
      setGranting(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_settings",
          settings: settingsForm
        })
      });

      if (res.ok) {
        toast.success("Coin Economy Rules Saved!");
        await fetchData();
      } else {
        toast.error("Failed to save rules");
      }
    } catch (err) {
      toast.error("Error saving settings");
    }
  };

  if (!isMaster) {
    return <div className={styles.page}><p>Access denied. Master Admin access required.</p></div>;
  }

  return (
    <div className={styles.page}>
      <Toaster position="top-right" />

      {/* Header Banner */}
      <div className={styles.headerRow}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.badgeHeader}>
            <span>🪙 COIN ECONOMY & REWARDS HUB</span>
          </div>
          <h1 className={styles.title}>Rewards & Coins Tracking</h1>
          <p className={styles.subtitle}>
            Monitor coin transactions, adjust coin economy rules, and manually grant rewards to users.
          </p>
        </div>

        <button className={styles.secondaryBtn} onClick={fetchData}>
          <span>🔄 Refresh Data</span>
        </button>
      </div>

      {/* KPI Overview Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>🪙</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>{(data.stats.totalCoinBalance || 0).toLocaleString()}</div>
            <div className={styles.kpiLabel}>Total Coins in Circulation</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>🏆</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>{(data.stats.totalCoinsEarned || 0).toLocaleString()}</div>
            <div className={styles.kpiLabel}>Lifetime Coins Earned</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(99, 102, 241, 0.12)", color: "#6366f1" }}>👥</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>{data.stats.totalUsers || 0}</div>
            <div className={styles.kpiLabel}>Registered Coin Accounts</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(168, 85, 247, 0.12)", color: "#a855f7" }}>📜</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>{data.stats.totalTransactions || 0}</div>
            <div className={styles.kpiLabel}>Total Reward Logged</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className={styles.mainGrid}>
        {/* LEFT COLUMN: MANUAL GRANT & SETTINGS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Manual Coin Grant Tool */}
          <div className={styles.cardSection}>
            <h3 className={styles.cardTitle}>
              <span>🎁 Grant or Adjust Coins</span>
            </h3>

            <form onSubmit={handleManualGrant} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>User ID / Unique ID / Email</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={grantUserInput}
                  onChange={(e) => setGrantUserInput(e.target.value)}
                  placeholder="e.g. USR-8F4A21 or user@example.com"
                  required
                />
              </div>

              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Coins (+ for Gift, - to Deduct)</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={grantAmount}
                    onChange={(e) => setGrantAmount(e.target.value)}
                    placeholder="e.g. 500 or -50"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Type</label>
                  <select
                    className={styles.formInput}
                    value={grantType}
                    onChange={(e) => setGrantType(e.target.value)}
                  >
                    <option value="BONUS">🎁 Bonus Reward</option>
                    <option value="CONTEST_PRIZE">🏆 Contest Winner</option>
                    <option value="ADMIN_ADJUSTMENT">⚙️ Admin Adjustment</option>
                    <option value="REDEMPTION">🛍️ Redemption</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Reason / Note</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={grantDesc}
                  onChange={(e) => setGrantDesc(e.target.value)}
                  placeholder="e.g. Weekly Quiz Winner Bonus..."
                />
              </div>

              <button type="submit" className={styles.primaryBtn} disabled={granting} style={{ width: "100%" }}>
                <span>{granting ? "Processing..." : "🚀 Submit Coin Adjustment"}</span>
              </button>
            </form>
          </div>

          {/* Coin Economy Rules Settings */}
          <div className={styles.cardSection}>
            <h3 className={styles.cardTitle}>
              <span>⚙️ Coin Earning Rules</span>
            </h3>

            <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Per Correct Answer</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={settingsForm.correctAnswerCoins}
                    onChange={(e) => setSettingsForm({ ...settingsForm, correctAnswerCoins: parseInt(e.target.value, 10) })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Daily Login Bonus</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={settingsForm.dailyLoginCoins}
                    onChange={(e) => setSettingsForm({ ...settingsForm, dailyLoginCoins: parseInt(e.target.value, 10) })}
                  />
                </div>
              </div>

              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Quiz Completion</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={settingsForm.quizCompletionCoins}
                    onChange={(e) => setSettingsForm({ ...settingsForm, quizCompletionCoins: parseInt(e.target.value, 10) })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Referral Bonus</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={settingsForm.referralCoins}
                    onChange={(e) => setSettingsForm({ ...settingsForm, referralCoins: parseInt(e.target.value, 10) })}
                  />
                </div>
              </div>

              <button type="submit" className={styles.secondaryBtn} style={{ justifyContent: "center" }}>
                <span>💾 Save Coin Rules</span>
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: RECENT TRANSACTIONS LOG */}
        <div className={styles.cardSection}>
          <h3 className={styles.cardTitle}>
            <span>📜 Recent Coin Activity Log ({data.transactions.length})</span>
          </h3>

          <div className={styles.txList}>
            {data.transactions.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", fontStyle: "italic" }}>
                No coin activity logged yet.
              </p>
            ) : (
              data.transactions.map((tx) => {
                const isPositive = tx.amount >= 0;
                return (
                  <div key={tx.id} className={styles.txRow}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className={styles.userBadge}>{tx.displayUserId}</span>
                        <strong style={{ fontSize: "0.88rem", color: "var(--text-primary)" }}>
                          {tx.user?.name || tx.user?.email || "User"}
                        </strong>
                      </div>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                        {tx.description || tx.type} • {new Date(tx.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className={isPositive ? styles.txAmountPositive : styles.txAmountNegative}>
                      {isPositive ? `+${tx.amount}` : tx.amount} 🪙
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
