"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "@/styles/SchoolStudy.module.css";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

function fmtTime(totalSeconds) {
  const s = Math.max(0, Number(totalSeconds) || 0);
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m <= 0) return `${r}s`;
  return `${m}m ${r}s`;
}

function pct(correct, total) {
  if (!total) return 0;
  return Math.round((correct / total) * 100);
}

export default function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/school-study/dashboard");
        const json = await res.json();
        if (mounted) setData(json);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const completed = data?.totals?.completedChapters ?? 0;
  const pending = data?.totals?.pendingChapters ?? 0;
  const avgScorePct = data?.avgScorePct ?? 0;
  const totalTimeSeconds = data?.totalTimeSeconds ?? 0;

  const quizTypeRows = useMemo(() => {
    const obj = data?.quizTypePerf && typeof data.quizTypePerf === "object" ? data.quizTypePerf : {};
    return Object.entries(obj).map(([type, row]) => ({
      type,
      correct: Number(row?.correct || 0),
      total: Number(row?.total || 0),
      pct: pct(Number(row?.correct || 0), Number(row?.total || 0)),
    }));
  }, [data]);

  const charts = data?.charts || {};
  const completionPie = Array.isArray(charts?.completionPie) ? charts.completionPie : [];
  const typePie = Array.isArray(charts?.typePie) ? charts.typePie : [];
  const subjectBar = Array.isArray(charts?.subjectBar) ? charts.subjectBar : [];
  const trend = Array.isArray(charts?.trend) ? charts.trend : [];

  const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Learning Dashboard</h1>
            <p className={styles.subtitle}>Loading your progress…</p>
          </div>
        </div>
        <div className={styles.empty}>Please wait…</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Learning Dashboard</h1>
          <p className={styles.subtitle}>Track your revision progress and performance.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {data?.resume?.href ? (
            <Link href={data.resume.href} className="btn-primary">
              Resume: {data.resume.title} →
            </Link>
          ) : null}
          <Link href="/school-study" className="btn-secondary">
            Browse Chapters
          </Link>
        </div>
      </div>

      <div className={styles.grid}>
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 700 }}>COMPLETED</div>
          <div style={{ fontSize: "2.5rem", fontWeight: 900, margin: "10px 0" }}>{completed}</div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Chapters attempted</div>
        </div>
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 700 }}>PENDING</div>
          <div style={{ fontSize: "2.5rem", fontWeight: 900, margin: "10px 0" }}>{pending}</div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Chapters left</div>
        </div>
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 700 }}>AVERAGE SCORE</div>
          <div style={{ fontSize: "2.5rem", fontWeight: 900, margin: "10px 0" }}>{avgScorePct}%</div>
          <div style={{ fontSize: "0.85rem", color: avgScorePct >= 70 ? "#16a34a" : "#f59e0b" }}>
            {avgScorePct >= 70 ? "Excellent mastery" : "Requires more revision"}
          </div>
        </div>
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 700 }}>TOTAL TIME</div>
          <div style={{ fontSize: "2.5rem", fontWeight: 900, margin: "10px 0" }}>{fmtTime(totalTimeSeconds)}</div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Time focused</div>
        </div>
      </div>

      <div style={{ marginTop: 40, display: "grid", gap: 22 }}>
        <section className="glass-card" style={{ padding: 20 }}>
          <h2 className={styles.title} style={{ fontSize: "1.2rem", marginBottom: 12 }}>
            Visual progress
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "stretch" }}>
            <div className="glass-card" style={{ padding: 14 }}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Completed vs Pending</div>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={completionPie} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={2}>
                      {completionPie.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 14 }}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Attempts trend (14 days)</div>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="avgPct" stroke="#3b82f6" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            <div className="glass-card" style={{ padding: 14 }}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Quiz type distribution</div>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={typePie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                      {typePie.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 14 }}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Top subjects</div>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectBar}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" hide />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="pct" fill="#22c55e" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                {subjectBar.slice(0, 5).map((s) => (
                  <div key={s.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-secondary)" }}>
                    <span style={{ fontWeight: 800 }}>{s.name}</span>
                    <span>{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card" style={{ padding: 20 }}>
          <h2 className={styles.title} style={{ fontSize: "1.2rem", marginBottom: 12 }}>
            Quiz type performance
          </h2>
          {quizTypeRows.length === 0 ? (
            <div className={styles.empty}>No attempts yet.</div>
          ) : (
            <div className={styles.list}>
              {quizTypeRows.map((r) => (
                <div key={r.type} className={`${styles.row} glass-card`} style={{ background: "transparent" }}>
                  <div className={styles.rowInfo}>
                    <span className={styles.emoji}>🧩</span>
                    <div>
                      <span className={styles.name}>{String(r.type).replaceAll("_", " ").toUpperCase()}</span>
                      <span className={styles.desc}>
                        {r.correct}/{r.total} correct
                      </span>
                    </div>
                  </div>
                  <div className={styles.rowMeta}>
                    <span className={styles.pill}>{r.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="glass-card" style={{ padding: 20 }}>
          <h2 className={styles.title} style={{ fontSize: "1.2rem", marginBottom: 12 }}>
            Strengths & Weaknesses
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Strengths (≥ 80%)</div>
              {(data?.strengths || []).length === 0 ? (
                <div className={styles.empty}>Not enough data yet.</div>
              ) : (
                <div className={styles.list}>
                  {data.strengths.map((s) => (
                    <div key={`${s.boardSlug}-${s.classNumber}-${s.subjectSlug}`} className={`${styles.row} glass-card`} style={{ background: "transparent" }}>
                      <div className={styles.rowInfo}>
                        <span className={styles.emoji}>✅</span>
                        <div>
                          <span className={styles.name}>{s.subjectName}</span>
                          <span className={styles.desc}>
                            {s.boardName} • Class {s.classNumber}
                          </span>
                        </div>
                      </div>
                      <div className={styles.rowMeta}>
                        <span className={styles.pill}>{s.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Weaknesses (≤ 50%)</div>
              {(data?.weaknesses || []).length === 0 ? (
                <div className={styles.empty}>Not enough data yet.</div>
              ) : (
                <div className={styles.list}>
                  {data.weaknesses.map((s) => (
                    <div key={`${s.boardSlug}-${s.classNumber}-${s.subjectSlug}`} className={`${styles.row} glass-card`} style={{ background: "transparent" }}>
                      <div className={styles.rowInfo}>
                        <span className={styles.emoji}>⚠️</span>
                        <div>
                          <span className={styles.name}>{s.subjectName}</span>
                          <span className={styles.desc}>
                            {s.boardName} • Class {s.classNumber}
                          </span>
                        </div>
                      </div>
                      <div className={styles.rowMeta}>
                        <span className={styles.pill}>{s.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="glass-card" style={{ padding: 20 }}>
          <h2 className={styles.title} style={{ fontSize: "1.2rem", marginBottom: 12 }}>
            Recent activity
          </h2>
          {(data?.recentAttempts || []).length === 0 ? (
            <div className={styles.empty}>No practice sessions recorded yet.</div>
          ) : (
            <div className={styles.list}>
              {data.recentAttempts.map((a) => (
                <Link
                  key={a.id}
                  href={a.href}
                  className={`${styles.row} glass-card`}
                  style={{ textDecoration: "none" }}
                >
                  <div className={styles.rowInfo}>
                    <span className={styles.emoji}>📅</span>
                    <div>
                      <span className={styles.name}>
                        {a.chapter?.title || "Chapter"} — {a.score}/{a.maxScore}
                      </span>
                      <span className={styles.desc}>
                        {new Date(a.createdAt).toLocaleDateString()} • {fmtTime(a.timeSpent)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.rowMeta}>
                    <span className={styles.pill}>{pct(a.score, a.maxScore)}%</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

