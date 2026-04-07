"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/Practice.module.css";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";

export default function PracticeClient({ chapter, user }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [startTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);

  const questions = chapter.questions;
  const currentQ = questions[currentIdx];

  const handleAnswer = (val) => {
    setAnswers({ ...answers, [currentQ.id]: val });
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      finishQuiz();
    }
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach(q => {
      const userAns = answers[q.id]?.toString().trim().toLowerCase();
      const actualAns = q.answer.trim().toLowerCase();
      if (userAns === actualAns) score++;
    });
    return score;
  };

  const finishQuiz = async () => {
    const score = calculateScore();
    setShowResult(true);

    if (user) {
      setSubmitting(true);
      try {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        // Prepare details breakdown
        const details = {
          total: questions.length,
          correct: score,
          breakdown: questions.reduce((acc, q) => {
            acc[q.type] = acc[q.type] || { correct: 0, total: 0 };
            acc[q.type].total++;
            if (answers[q.id]?.toString().trim().toLowerCase() === q.answer.trim().toLowerCase()) {
              acc[q.type].correct++;
            }
            return acc;
          }, {})
        };

        await fetch("/api/school/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chapterId: chapter.id,
            score,
            maxScore: questions.length,
            timeSpent,
            details: JSON.stringify(details)
          })
        });
      } catch (err) {
        console.error("Failed to save progress", err);
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (showResult) {
    const score = calculateScore();
    const percentage = ((score / questions.length) * 100).toFixed(0);
    const isSuccess = score / questions.length >= 0.7;

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

  const progress = ((currentIdx) / questions.length) * 100;

  return (
    <div className={styles.container}>
      <header className={styles.practiceHeader}>
         <div className={styles.meta} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <span className={styles.chapterTag}>UNIT {chapter.sortOrder + 1}</span>
              <h2 className={styles.chapterTitle}>{chapter.title}</h2>
            </div>
            <span className={styles.progressText} style={{ fontWeight: 800, color: 'var(--accent)' }}>
              {currentIdx + 1} / {questions.length}
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

      <main className={styles.questionArea}>
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentQ.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={styles.questionCard}
          >
            <div className={styles.typeTag} style={{ marginBottom: '20px' }}>
               <span className={styles.pill} style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                  {currentQ.type.replace('_', ' ').toUpperCase()}
               </span>
            </div>
            <h3 className={styles.prompt}>{currentQ.prompt}</h3>

            <div className={styles.optionsArea}>
              {currentQ.type === 'mcq' && JSON.parse(currentQ.options).map((opt, i) => (
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
                <p style={{ color: 'var(--text-muted)' }}>Match column logic implementation... (Enter correct pairing below)</p>
                // Simplistic for MVP, could use a list of pairs input
              )}
            </div>

            <div className={styles.footer}>
              <button 
                className="btn-primary" 
                disabled={!answers[currentQ.id]}
                onClick={nextQuestion}
                style={{ width: '100%', padding: '16px', borderRadius: '14px', fontSize: '1.1rem' }}
              >
                {currentIdx < questions.length - 1 ? "Next Question" : "Finish Review"}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
