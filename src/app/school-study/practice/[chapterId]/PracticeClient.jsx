"use client";

import { useMemo, useState } from "react";
import styles from "@/styles/Practice.module.css";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function PracticeClient({ chapter, user }) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeType, setActiveType] = useState("mcq");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [startTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);

  const allQuestions = chapter.questions || [];
  const typeOrder = ["mcq", "true_false", "fill_blank", "match_column"];

  const grouped = useMemo(() => {
    const g = {};
    for (const t of typeOrder) g[t] = [];
    for (const q of allQuestions) {
      const t = String(q.type || "").toLowerCase();
      if (!g[t]) g[t] = [];
      g[t].push(q);
    }
    return g;
  }, [allQuestions]);

  const availableTypes = useMemo(() => {
    return typeOrder.filter((t) => (grouped[t] || []).length > 0);
  }, [grouped]);

  const questions = grouped[activeType] || [];
  const currentQ = questions[currentIdx];

  const normalize = (s) =>
    String(s || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  const safeJson = (raw, fallback) => {
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  };

  const getMatchSchema = (q) => {
    const obj = typeof q?.options === "string" ? safeJson(q.options, null) : q?.options;
    if (!obj || typeof obj !== "object") return null;
    const left = Array.isArray(obj.left) ? obj.left : [];
    const right = Array.isArray(obj.right) ? obj.right : [];
    const pairs = Array.isArray(obj.pairs) ? obj.pairs : safeJson(q?.answer, []);
    return { left, right, pairs: Array.isArray(pairs) ? pairs : [] };
  };

  const handleAnswer = (val) => {
    setAnswers({ ...answers, [currentQ.id]: val });
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      return;
    }

    const typeIdx = availableTypes.indexOf(activeType);
    const nextType = availableTypes[typeIdx + 1];
    if (nextType) {
      setActiveType(nextType);
      setCurrentIdx(0);
      return;
    }

    finishQuiz();
  };

  const calculateScore = () => {
    let score = 0;
    allQuestions.forEach((q) => {
      const type = String(q.type || "").toLowerCase();
      const userAns = answers[q.id];

      if (type === "fill_blank") {
        if (normalize(userAns) === normalize(q.answer)) score++;
        return;
      }

      if (type === "match_column") {
        const schema = getMatchSchema(q);
        const resp = userAns && typeof userAns === "object" ? userAns : {};
        if (!schema || schema.left.length === 0) return;
        const ok = schema.pairs.every((p) => resp[p.leftId] === p.rightId);
        if (ok) score++;
        return;
      }

      if (String(userAns || "") === String(q.answer || "")) score++;
    });
    return score;
  };

  const isAnswered = (q) => {
    const type = String(q?.type || "").toLowerCase();
    const val = answers[q.id];
    if (type === "match_column") {
      const schema = getMatchSchema(q);
      if (!schema || schema.left.length === 0) return false;
      if (!val || typeof val !== "object") return false;
      return schema.left.every((l) => Boolean(val[l.id]));
    }
    return Boolean(val);
  };

  const finishQuiz = async () => {
    const score = calculateScore();
    setShowResult(true);

    setSubmitting(true);
    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      // Prepare details breakdown
      const details = {
        total: allQuestions.length,
        correct: score,
        breakdown: allQuestions.reduce((acc, q) => {
          acc[q.type] = acc[q.type] || { correct: 0, total: 0 };
          acc[q.type].total++;
          const type = String(q.type || "").toLowerCase();
          if (type === "fill_blank") {
            if (normalize(answers[q.id]) === normalize(q.answer)) acc[q.type].correct++;
          } else if (type === "match_column") {
            const schema = getMatchSchema(q);
            const resp = answers[q.id] && typeof answers[q.id] === "object" ? answers[q.id] : {};
            if (schema && schema.left.length > 0) {
              const ok = schema.pairs.every((p) => resp[p.leftId] === p.rightId);
              if (ok) acc[q.type].correct++;
            }
          } else {
            if (String(answers[q.id] || "") === String(q.answer || "")) acc[q.type].correct++;
          }
          return acc;
        }, {})
      };

      const res = await fetch("/api/school/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId: chapter.id,
          score,
          maxScore: allQuestions.length,
          timeSpent,
          details: JSON.stringify(details)
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401 && data?.code === "SIGNIN_REQUIRED") {
          toast.error(data?.message || "Sign in required to continue.");
          const cb = pathname || `/school-study/practice/${chapter.id}`;
          router.push(`/signin?callbackUrl=${encodeURIComponent(cb)}`);
        }
      } else if (data?.guest) {
        if (typeof data.remainingFreeAttempts === "number") {
          toast.success(`Free attempts left: ${data.remainingFreeAttempts}`);
        }
      }
    } catch (err) {
      console.error("Failed to save progress", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (showResult) {
    const score = calculateScore();
    const percentage = allQuestions.length > 0 ? ((score / allQuestions.length) * 100).toFixed(0) : "0";
    const isSuccess = allQuestions.length > 0 ? score / allQuestions.length >= 0.7 : false;

    return (
      <div className={styles.container}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={styles.questionCard} 
          style={{ padding: '60px 40px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}
        >
          <div style={{ fontSize: '5rem', marginBottom: '20px' }}>{isSuccess ? "🏆" : "📚"}</div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '10px' }}>
            {isSuccess ? "Excellent Work!" : "Keep Practicing"}
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '40px' }}>
            You mastered <strong>{percentage}%</strong> of this chapter.
          </p>
          
          <div className={styles.statsRow} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
             <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 800 }}>CORRECT</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{score}</div>
             </div>
             <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 800 }}>TOTAL</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{questions.length}</div>
             </div>
          </div>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            <Link href={`/school-study/${chapter.subject.class.board.slug}/${chapter.subject.class.number}/${chapter.subject.slug}`} className="btn-primary" style={{ padding: '18px' }}>
              Complete Session ➔
            </Link>
            <button onClick={() => window.location.reload()} className="btn-secondary" style={{ padding: '16px' }}>
              Retry Chapter
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const progress = questions.length > 0 ? ((currentIdx) / questions.length) * 100 : 0;

  return (
    <div className={styles.container}>
      <header className={styles.practiceHeader}>
         <div className={styles.meta} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <span className={styles.chapterTag}>UNIT {chapter.sortOrder + 1}</span>
              <h2 className={styles.chapterTitle}>{chapter.title}</h2>
            </div>
            <span className={styles.progressText} style={{ fontWeight: 800, color: 'var(--accent)' }}>
              {questions.length > 0 ? `${currentIdx + 1} / ${questions.length}` : "0 / 0"}
            </span>
         </div>
         <div className={styles.progressWrapper} style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '99px', overflow: 'hidden' }}>
            <motion.div 
              className={styles.progressBar} 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', damping: 20 }}
            ></motion.div>
         </div>
      </header>

      <main className={styles.questionArea} style={{ display: "grid", gridTemplateColumns: "280px minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
        <aside className="glass-card" style={{ padding: 14, borderRadius: 16, position: "sticky", top: 110 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Quiz Sections</div>
          <div style={{ display: "grid", gap: 10 }}>
            {typeOrder.map((t) => {
              const count = (grouped[t] || []).length;
              const active = t === activeType;
              if (count === 0) return null;
              const label =
                t === "mcq"
                  ? "MCQ"
                  : t === "true_false"
                  ? "True / False"
                  : t === "fill_blank"
                  ? "Fill in blanks"
                  : "Match columns";
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setActiveType(t);
                    setCurrentIdx(0);
                  }}
                  className="btn-secondary"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 12px",
                    borderRadius: 14,
                    border: active ? "2px solid rgba(var(--accent-rgb), 0.35)" : "1px solid var(--card-border)",
                    background: active ? "rgba(var(--accent-rgb), 0.08)" : "var(--card-bg)",
                    cursor: "pointer",
                    fontWeight: 800,
                  }}
                >
                  <span>{label}</span>
                  <span className={styles.pill} style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
            Pick any section first. Your final score counts across all sections.
          </div>
        </aside>

        <div>
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentQ?.id || `${activeType}-empty`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={styles.questionCard}
          >
            {!currentQ ? (
              <div style={{ padding: 16, color: "var(--text-muted)" }}>No questions in this section.</div>
            ) : (
              <>
                <div className={styles.typeTag} style={{ marginBottom: '20px' }}>
                   <span className={styles.pill} style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                      {currentQ.type.replace('_', ' ').toUpperCase()}
                   </span>
                </div>
                <h3 className={styles.prompt}>{currentQ.prompt}</h3>

                <div className={styles.optionsArea}>
                  {currentQ.type === 'mcq' && safeJson(currentQ.options, []).map((opt, i) => (
                    <button 
                      key={i} 
                      className={`${styles.optionBtn} ${answers[currentQ.id] === opt ? styles.selected : ''}`}
                      onClick={() => handleAnswer(opt)}
                    >
                      <span className={styles.optLetter}>{String.fromCharCode(65 + i)}</span>
                      {opt}
                    </button>
                  ))}

                  {currentQ.type === 'true_false' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <button 
                        className={`${styles.tfBtn} ${answers[currentQ.id] === 'True' ? styles.trueSelected : ''}`}
                        onClick={() => handleAnswer('True')}
                      >
                        True
                      </button>
                      <button 
                        className={`${styles.tfBtn} ${answers[currentQ.id] === 'False' ? styles.falseSelected : ''}`}
                        onClick={() => handleAnswer('False')}
                      >
                        False
                      </button>
                    </div>
                  )}

                  {currentQ.type === 'fill_blank' && (
                    <input 
                      type="text"
                      className={styles.fillInput}
                      placeholder="Type your answer here..."
                      value={answers[currentQ.id] || ""}
                      onChange={(e) => handleAnswer(e.target.value)}
                      autoFocus
                    />
                  )}

                  {currentQ.type === 'match_column' && (
                    (() => {
                      const schema = getMatchSchema(currentQ);
                      if (!schema || schema.left.length === 0 || schema.right.length === 0) {
                        return <p style={{ color: 'var(--text-muted)' }}>Match question is not configured yet.</p>;
                      }
                      const value = (answers[currentQ.id] && typeof answers[currentQ.id] === "object") ? answers[currentQ.id] : {};
                      return (
                        <div style={{ display: "grid", gap: 12 }}>
                          {schema.left.map((l) => (
                            <div
                              key={l.id}
                              className="glass-card"
                              style={{ padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "center" }}
                            >
                              <div style={{ fontWeight: 800 }}>{l.text}</div>
                              <select
                                className={styles.input}
                                value={value[l.id] || ""}
                                onChange={(e) => {
                                  const next = { ...value, [l.id]: e.target.value };
                                  setAnswers({ ...answers, [currentQ.id]: next });
                                }}
                              >
                                <option value="">Select match</option>
                                {schema.right.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.text}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            Match all items before moving forward.
                          </p>
                        </div>
                      );
                    })()
                  )}
                </div>

                <div className={styles.footer}>
                  <button 
                    className="btn-primary" 
                    disabled={!currentQ || !isAnswered(currentQ)}
                    onClick={nextQuestion}
                    style={{ width: '100%', padding: '16px', borderRadius: '14px', fontSize: '1.1rem' }}
                  >
                    {currentIdx < questions.length - 1 ? "Next Question" : "Finish Review"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
