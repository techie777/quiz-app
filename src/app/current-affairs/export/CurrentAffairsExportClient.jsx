"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "@/styles/CurrentAffairsExport.module.css";
import { useMonetization } from "@/context/MonetizationContext";
import { Lock, Crown } from "lucide-react";
import Link from "next/link";

function formatDate(d) {
  if (!d) return "";
  try {
    const [y, m, day] = String(d).split("-");
    const dt = new Date(Number(y), Number(m) - 1, Number(day));
    return dt.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

export default function CurrentAffairsExportClient() {
  const { isPro } = useMonetization();
  const searchParams = useSearchParams();
  const date = searchParams.get("date") || "";
  const month = searchParams.get("month") || "";
  const category = searchParams.get("category") || "";

  const [items, setItems] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("pageSize", "500");
    if (category) params.set("category", category);
    if (date) params.set("date", date);
    if (!date && month) params.set("month", month);
    return params.toString();
  }, [date, month, category]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const p1 = fetch(`/api/current-affairs?${query}`, { cache: "no-store" }).then(r => r.ok ? r.json() : null);
        const p2 = date ? fetch(`/api/daily-quizzes?type=daily-current-affairs&date=${date}`).then(r => r.ok ? r.json() : null) : Promise.resolve(null);
        
        const [caData, dqData] = await Promise.all([p1, p2]);
        if (cancelled) return;
        
        setItems(caData && Array.isArray(caData.items) ? caData.items : []);
        setQuestions(dqData && Array.isArray(dqData.questions) ? dqData.questions : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [query, date]);

  const title = date ? `Current Affairs — ${date}` : month ? `Current Affairs — ${month}` : "Current Affairs";

  if (!isPro) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center">
         <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-[3rem] shadow-2xl">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-500/20">
              <Lock size={32} />
            </div>
            <h1 className="text-3xl font-black mb-4 tracking-tight">Premium Export Tool</h1>
            <p className="text-slate-400 font-medium mb-10 leading-relaxed">
               PDF and CSV exports are exclusive features for QuizWeb Pro members. Upgrade now to download unlimited study materials.
            </p>
            <Link href="/pro" className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition shadow-lg mb-4">
              <Crown className="inline-block mr-2" size={16} /> Get Pro Access
            </Link>
            <Link href="/current-affairs" className="text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest transition">
              Back to Free Feed
            </Link>
         </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.toolbar}>
        <button className={styles.printBtn} onClick={() => window.print()}>
          Print / Save PDF
        </button>
      </div>

      <div className={styles.sheetWrapper}>
        <div className={styles.watermark}>QUIZWEB</div>
        <div className={styles.sheet}>
          <div className={styles.sheetHeader}>
            <div className={styles.siteInfo}>
              <strong>QuizWeb Education</strong>
              <span>www.quizweb.com</span>
            </div>
            <h1 className={styles.title}>{title}</h1>
            {category ? <p className={styles.subTitle}>Category: {category}</p> : null}
          </div>

          {loading ? (
            <p className={styles.muted}>Decrypting Intelligence Briefing...</p>
          ) : items.length === 0 ? (
            <p className={styles.muted}>No data available for this report.</p>
          ) : (
            <div className={styles.reportContent}>
              <h2 className={styles.sectionHeader}>Daily Briefing & One-Liners</h2>
              <div className={styles.list}>
                {items.map((it) => (
                  <div key={it.id} className={styles.item}>
                    <div className={styles.left}>
                      <div className={styles.date}>{formatDate(it.date)}</div>
                      {it.category ? <div className={styles.category}>{it.category}</div> : null}
                    </div>
                    <div className={styles.right}>
                      <div className={styles.heading}>{it.heading}</div>
                      {it.oneLiner && <div className={styles.oneLiner}>💡 {it.oneLiner}</div>}
                      <div className={styles.desc}>{it.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              {questions && questions.length > 0 && (
                <>
                  <h2 className={styles.sectionHeader} style={{ marginTop: '3rem' }}>MCQ Practice Questions</h2>
                  <div className={styles.mcqList}>
                    {questions.map((q, idx) => (
                      <div key={q.id} className={styles.mcqItem}>
                        <div className={styles.mcqText}><strong>Q{idx + 1}.</strong> {q.text}</div>
                        <ol className={styles.mcqOptions}>
                          {q.options && q.options.map((opt, oIdx) => (
                            <li key={oIdx} className={q.correctAnswer === String(oIdx) ? styles.correctOption : ""}>
                              {String.fromCharCode(65 + oIdx)}. {opt}
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          
          <div className={styles.sheetFooter}>
            Generated by QuizWeb Premium Report System • For Educational Purposes Only
          </div>
        </div>
      </div>
    </main>
  );
}

