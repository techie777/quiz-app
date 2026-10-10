"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "@/styles/SchoolStudy.module.css";
import { useLanguage } from "@/context/LanguageContext";
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
import {
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  AlertTriangle,
  ArrowRight,
  Compass,
  Sparkles,
  RotateCcw,
} from "lucide-react";

function fmtTime(totalSeconds, isHindi = false) {
  const s = Math.max(0, Number(totalSeconds) || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) {
    return isHindi ? `${h}घं ${m}मि` : `${h}h ${m}m`;
  }
  if (m > 0) {
    return isHindi ? `${m}मि ${r}से` : `${m}m ${r}s`;
  }
  return isHindi ? `${r}से` : `${r}s`;
}

function pct(correct, total) {
  if (!total) return 0;
  return Math.round((correct / total) * 100);
}

export default function DashboardClient() {
  const { isHindi } = useLanguage();
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
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
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

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#06b6d4"];

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              {isHindi ? "लर्निंग व रिविज़न डैशबोर्ड" : "Learning & Revision Dashboard"}
            </h1>
            <p className={styles.subtitle}>
              {isHindi ? "आपकी अध्ययन प्रगति लोड हो रही है..." : "Loading your revision progress..."}
            </p>
          </div>
        </div>
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-400">
            {isHindi ? "डेटा तैयार किया जा रहा है..." : "Preparing learning analytics..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* 1. HEADER SECTION */}
      <div className={styles.header}>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-3">
            <Sparkles size={13} />
            <span>{isHindi ? "स्मार्ट रिविज़न एनालिटिक्स" : "Smart Revision Analytics"}</span>
          </div>
          <h1 className={styles.title}>
            {isHindi ? "लर्निंग व रिविज़न डैशबोर्ड" : "Learning & Revision Dashboard"}
          </h1>
          <p className={styles.subtitle}>
            {isHindi
              ? "अपनी अध्ययन प्रगति, स्कोर और कमजोर विषयों का विस्तृत विश्लेषण देखें।"
              : "Track your revision progress, scores & concept mastery across all subjects."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <Link href="/school-study" className="btn-secondary">
            <Compass size={16} />
            <span>{isHindi ? "सभी चैप्टर्स देखें" : "Browse All Chapters"}</span>
          </Link>
        </div>
      </div>

      {/* 2. RESUME LEARNING HERO CALLOUT (IF IN-PROGRESS CHAPTER EXISTS) */}
      {data?.resume?.href && (
        <div className={styles.resumeBanner}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
              📖
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {isHindi ? "जहाँ छोड़ा था, वहीं से जारी रखें" : "Continue Where You Left Off"}
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white line-clamp-1">
                {data.resume.title}
              </h3>
            </div>
          </div>
          <Link
            href={data.resume.href}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <span>{isHindi ? "अध्ययन जारी रखें" : "Resume Chapter"}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* 3. CORE METRICS GRID */}
      <div className={styles.grid}>
        <div className="glass-card" style={{ padding: 22 }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {isHindi ? "पूर्ण चैप्टर्स" : "COMPLETED"}
          </div>
          <div style={{ fontSize: "2.3rem", fontWeight: 900, margin: "8px 0", color: "#10b981" }}>
            {completed}
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            {isHindi ? "हल किए गए कुल चैप्टर्स" : "Chapters attempted"}
          </div>
        </div>

        <div className="glass-card" style={{ padding: 22 }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {isHindi ? "शेष चैप्टर्स" : "PENDING"}
          </div>
          <div style={{ fontSize: "2.3rem", fontWeight: 900, margin: "8px 0", color: "#6366f1" }}>
            {pending}
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            {isHindi ? "अभ्यास के लिए शेष चैप्टर्स" : "Chapters remaining"}
          </div>
        </div>

        <div className="glass-card" style={{ padding: 22 }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {isHindi ? "औसत स्कोर" : "AVERAGE SCORE"}
          </div>
          <div style={{ fontSize: "2.3rem", fontWeight: 900, margin: "8px 0", color: avgScorePct >= 70 ? "#10b981" : "#f59e0b" }}>
            {avgScorePct}%
          </div>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: avgScorePct >= 70 ? "#10b981" : "#f59e0b" }}>
            {avgScorePct >= 70
              ? (isHindi ? "उत्कृष्ट प्रदर्शन (शानदार)" : "Excellent mastery")
              : (isHindi ? "अधिक अभ्यास की आवश्यकता" : "Requires more revision")}
          </div>
        </div>

        <div className="glass-card" style={{ padding: 22 }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {isHindi ? "कुल अध्ययन समय" : "TOTAL FOCUS TIME"}
          </div>
          <div style={{ fontSize: "2.3rem", fontWeight: 900, margin: "8px 0", color: "var(--text-primary)" }}>
            {fmtTime(totalTimeSeconds, isHindi)}
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            {isHindi ? "सक्रिय रूप से पढ़ाई में बिताया समय" : "Time spent practicing"}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 36, display: "grid", gap: 24 }}>
        {/* 4. VISUAL PROGRESS CHARTS SECTION (FULLY RESPONSIVE) */}
        <section className="glass-card" style={{ padding: 20 }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-indigo-600 dark:text-indigo-400" />
            <h2 className={styles.title} style={{ fontSize: "1.2rem", margin: 0 }}>
              {isHindi ? "विज़ुअल एनालिटिक्स व प्रगति" : "Visual Progress & Analytics"}
            </h2>
          </div>

          {/* Row 1: Completion Pie + 14 Days Trend */}
          <div className={styles.chartsGrid}>
            <div className="glass-card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: "0.9rem", marginBottom: 12 }}>
                {isHindi ? "पूर्ण बनाम शेष चैप्टर्स" : "Completed vs Pending"}
              </div>
              <div style={{ height: 240 }}>
                {completionPie.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={completionPie}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                      >
                        {completionPie.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400">
                    {isHindi ? "डेटा उपलब्ध नहीं है" : "No completion data yet"}
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: "0.9rem", marginBottom: 12 }}>
                {isHindi ? "14 दिवसीय स्कोर ट्रेंड" : "Attempts Trend (Last 14 Days)"}
              </div>
              <div style={{ height: 240 }}>
                {trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="avgPct"
                        name={isHindi ? "औसत %" : "Avg Score %"}
                        stroke="#6366f1"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#6366f1" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400">
                    {isHindi ? "14 दिनों में कोई प्रयास नहीं" : "No recent trend data"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Quiz Type Distribution + Top Subjects */}
          <div className={`${styles.chartsGrid} mt-4`}>
            <div className="glass-card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: "0.9rem", marginBottom: 12 }}>
                {isHindi ? "क्विज़ प्रकार वितरण" : "Quiz Type Distribution"}
              </div>
              <div style={{ height: 240 }}>
                {typePie.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typePie}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                      >
                        {typePie.map((_, i) => (
                          <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400">
                    {isHindi ? "कोई क्विज़ प्रयास नहीं" : "No quiz type data yet"}
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: "0.9rem", marginBottom: 12 }}>
                {isHindi ? "शीर्ष प्रदर्शन वाले विषय" : "Top Subjects Performance"}
              </div>
              <div style={{ height: 240 }}>
                {subjectBar.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectBar} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" hide />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="pct" name={isHindi ? "प्रतिशत" : "Score %"} fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400">
                    {isHindi ? "विषय डेटा उपलब्ध नहीं है" : "No subject data yet"}
                  </div>
                )}
              </div>
              {/* Subject Badges */}
              {subjectBar.length > 0 && (
                <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
                  {subjectBar.slice(0, 5).map((s) => (
                    <div
                      key={s.name}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        color: "var(--text-secondary)",
                      }}
                    >
                      <span style={{ fontWeight: 800 }}>{s.name}</span>
                      <span style={{ fontWeight: 800, color: "#10b981" }}>{s.pct}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 5. QUIZ FORMAT PERFORMANCE */}
        <section className="glass-card" style={{ padding: 20 }}>
          <h2 className={styles.title} style={{ fontSize: "1.2rem", marginBottom: 14 }}>
            {isHindi ? "क्विज़ फॉर्मेट परफ़ॉर्मेंस" : "Quiz Type Performance"}
          </h2>
          {quizTypeRows.length === 0 ? (
            <div className={styles.empty}>
              {isHindi ? "अभी तक कोई क्विज़ हल नहीं किया गया है।" : "No quiz attempts recorded yet."}
            </div>
          ) : (
            <div className={styles.list}>
              {quizTypeRows.map((r) => (
                <div key={r.type} className={`${styles.row} glass-card`} style={{ background: "transparent" }}>
                  <div className={styles.rowInfo}>
                    <span className={styles.emoji}>🧩</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span className={styles.name}>{String(r.type).replaceAll("_", " ").toUpperCase()}</span>
                      <span className={styles.desc}>
                        {r.correct}/{r.total} {isHindi ? "सही उत्तर" : "correct"}
                      </span>
                      {/* Visual Mini Progress Bar */}
                      <div className={styles.progressBarWrapper}>
                        <div
                          className={styles.progressBarFill}
                          style={{
                            width: `${r.pct}%`,
                            background: r.pct >= 70 ? "#10b981" : r.pct >= 50 ? "#f59e0b" : "#ef4444",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className={styles.rowMeta}>
                    <span
                      className={`${styles.pill} ${
                        r.pct >= 70 ? styles.pillGood : r.pct >= 50 ? styles.pillWarn : styles.pillInfo
                      }`}
                    >
                      {r.pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 6. STRENGTHS & WEAKNESSES (SWOT ANALYSIS) */}
        <section className="glass-card" style={{ padding: 20 }}>
          <div className="flex items-center gap-2 mb-4">
            <Award size={18} className="text-amber-500" />
            <h2 className={styles.title} style={{ fontSize: "1.2rem", margin: 0 }}>
              {isHindi ? "मज़बूत व कमज़ोर विषय (SWOT)" : "Strengths & Weaknesses"}
            </h2>
          </div>

          <div className={styles.analysisGrid}>
            {/* Strengths Card */}
            <div>
              <div className="flex items-center gap-1.5 font-black text-sm text-emerald-600 dark:text-emerald-400 mb-3">
                <CheckCircle2 size={16} />
                <span>{isHindi ? "मज़बूत पकड़ (≥ 80%)" : "Strengths (≥ 80%)"}</span>
              </div>
              {(data?.strengths || []).length === 0 ? (
                <div className="p-6 text-center text-xs font-semibold text-slate-400 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
                  {isHindi ? "अभी पर्याप्त डेटा उपलब्ध नहीं है。" : "Not enough data recorded yet."}
                </div>
              ) : (
                <div className={styles.list}>
                  {data.strengths.map((s) => (
                    <div
                      key={`${s.boardSlug}-${s.classNumber}-${s.subjectSlug}`}
                      className={`${styles.row} glass-card`}
                      style={{ background: "transparent", padding: "14px 18px" }}
                    >
                      <div className={styles.rowInfo}>
                        <span className={styles.emoji} style={{ width: 40, height: 40, fontSize: "1.1rem" }}>
                          ✅
                        </span>
                        <div>
                          <span className={styles.name} style={{ fontSize: "1rem" }}>
                            {s.subjectName}
                          </span>
                          <span className={styles.desc} style={{ fontSize: "0.8rem" }}>
                            {s.boardName} • Class {s.classNumber}
                          </span>
                        </div>
                      </div>
                      <div className={styles.rowMeta}>
                        <span className={`${styles.pill} ${styles.pillGood}`}>{s.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weaknesses Card */}
            <div>
              <div className="flex items-center gap-1.5 font-black text-sm text-amber-600 dark:text-amber-400 mb-3">
                <AlertTriangle size={16} />
                <span>{isHindi ? "कमज़ोर विषय - सुधार ज़रूरी (≤ 50%)" : "Weaknesses (≤ 50%)"}</span>
              </div>
              {(data?.weaknesses || []).length === 0 ? (
                <div className="p-6 text-center text-xs font-semibold text-slate-400 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
                  {isHindi ? "शानदार! कोई कमज़ोर विषय नहीं मिला।" : "Great job! No weak subjects detected."}
                </div>
              ) : (
                <div className={styles.list}>
                  {data.weaknesses.map((s) => (
                    <div
                      key={`${s.boardSlug}-${s.classNumber}-${s.subjectSlug}`}
                      className={`${styles.row} glass-card`}
                      style={{ background: "transparent", padding: "14px 18px" }}
                    >
                      <div className={styles.rowInfo}>
                        <span className={styles.emoji} style={{ width: 40, height: 40, fontSize: "1.1rem" }}>
                          ⚠️
                        </span>
                        <div>
                          <span className={styles.name} style={{ fontSize: "1rem" }}>
                            {s.subjectName}
                          </span>
                          <span className={styles.desc} style={{ fontSize: "0.8rem" }}>
                            {s.boardName} • Class {s.classNumber}
                          </span>
                        </div>
                      </div>
                      <div className={styles.rowMeta}>
                        <span className={`${styles.pill} ${styles.pillWarn}`}>{s.pct}%</span>
                        <Link
                          href={`/school-study/${s.boardSlug}/${s.classNumber}/${s.subjectSlug}`}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-bold transition-colors"
                          title={isHindi ? "पुनः अभ्यास करें" : "Revise Concept"}
                        >
                          <RotateCcw size={14} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 7. RECENT PRACTICE ACTIVITY */}
        <section className="glass-card" style={{ padding: 20 }}>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-indigo-600 dark:text-indigo-400" />
            <h2 className={styles.title} style={{ fontSize: "1.2rem", margin: 0 }}>
              {isHindi ? "हालिया अभ्यास सत्र" : "Recent Practice Sessions"}
            </h2>
          </div>

          {(data?.recentAttempts || []).length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
              <span className="text-3xl mb-2 block">📝</span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isHindi ? "अभी तक कोई अभ्यास सत्र दर्ज नहीं हुआ है।" : "No practice sessions recorded yet."}
              </p>
              <Link
                href="/school-study"
                className="inline-block mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                {isHindi ? "पहला चैप्टर पढ़ना शुरू करें →" : "Start your first chapter →"}
              </Link>
            </div>
          ) : (
            <div className={styles.list}>
              {data.recentAttempts.map((a) => (
                <Link
                  key={a.id}
                  href={a.href || "#"}
                  className={`${styles.row} glass-card`}
                  style={{ textDecoration: "none" }}
                >
                  <div className={styles.rowInfo}>
                    <span className={styles.emoji}>📅</span>
                    <div>
                      <span className={styles.name}>
                        {a.chapter?.title || (isHindi ? "चैप्टर" : "Chapter")} — {a.score}/{a.maxScore}
                      </span>
                      <span className={styles.desc}>
                        {new Date(a.createdAt).toLocaleDateString()} • {fmtTime(a.timeSpent, isHindi)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.rowMeta}>
                    <span
                      className={`${styles.pill} ${
                        pct(a.score, a.maxScore) >= 70
                          ? styles.pillGood
                          : pct(a.score, a.maxScore) >= 50
                          ? styles.pillWarn
                          : styles.pillInfo
                      }`}
                    >
                      {pct(a.score, a.maxScore)}%
                    </span>
                    <ArrowRight size={14} className="text-slate-400" />
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
