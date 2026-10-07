"use client";

import React, { useState } from "react";
import styles from "@/styles/GkBook.module.css";
import { calculateStars } from "@/lib/gk-book/seedData";

export default function GkBookQuizCard({
  pageIndex = 0,
  questions = [],
  attempts = [],
  pageAttempts,
  onRecordAttempt,
  onResetScore,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [shuffledQuiz, setShuffledQuiz] = useState([]);

  // Support both pageAttempts and attempts props
  const effectiveAttempts = (pageAttempts && pageAttempts.length > 0) ? pageAttempts : (attempts || []);
  const hasAttempted = Array.isArray(effectiveAttempts) && effectiveAttempts.length > 0;
  
  const bestPct = hasAttempted
    ? Math.max(...effectiveAttempts.map((a) => (a.t > 0 ? (a.s / a.t) * 100 : 0)))
    : 0;
  const lastAttempt = hasAttempted ? effectiveAttempts[effectiveAttempts.length - 1] : null;
  const starCount = hasAttempted ? calculateStars(bestPct, 100) : 0;

  // Shuffle questions and options
  const handleStartQuiz = () => {
    if (!questions || questions.length === 0) return;
    
    const qList = [...questions].sort(() => Math.random() - 0.5).map((q) => {
      const qText = typeof q.text === "string" ? q.text : q[0];
      const origOpts = Array.isArray(q.options) ? q.options : q[1] || [];
      const correctIdx = typeof q.answer === "number" ? q.answer : (typeof q[2] === "number" ? q[2] : 0);
      
      const optPairs = origOpts.map((text, idx) => ({
        text,
        isCorrect: idx === correctIdx,
      })).sort(() => Math.random() - 0.5);

      return {
        question: qText,
        options: optPairs,
      };
    });

    setShuffledQuiz(qList);
    setCurrentQIndex(0);
    setSelectedOptionIndex(null);
    setIsAnswered(false);
    setScore(0);
    setIsCompleted(false);
    setIsPlaying(true);
  };

  const handleSelectOption = (idx) => {
    if (isAnswered) return;
    setSelectedOptionIndex(idx);
    setIsAnswered(true);

    const currentQ = shuffledQuiz[currentQIndex];
    if (currentQ?.options[idx]?.isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQIndex < shuffledQuiz.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOptionIndex(null);
      setIsAnswered(false);
    } else {
      const currentIsCorrect = selectedOptionIndex !== null && shuffledQuiz[currentQIndex]?.options[selectedOptionIndex]?.isCorrect;
      const finalScore = score + (isAnswered ? 0 : (currentIsCorrect ? 1 : 0));
      const attemptData = {
        s: score,
        t: shuffledQuiz.length,
        d: Date.now(),
      };
      if (onRecordAttempt) {
        onRecordAttempt(pageIndex, attemptData);
      }
      setIsCompleted(true);
    }
  };

  const handleCloseOverlay = () => {
    setIsPlaying(false);
    setIsCompleted(false);
    setSelectedOptionIndex(null);
    setIsAnswered(false);
  };

  const handleReset = () => {
    if (window.confirm("क्या आप इस अध्याय का टेस्ट स्कोर रीसेट करना चाहते हैं?")) {
      if (onResetScore) onResetScore(pageIndex);
    }
  };

  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <section className={styles.quizCard} aria-label="अध्याय क्विज़ कार्ड">
      <div className={styles.quizCardHeader}>
        <div className={styles.quizCardTitleRow}>
          <span className={styles.quizCardBadge}>🎯 अध्याय टेस्ट</span>
          <b className={styles.quizCardTitle}>त्वरित अभ्यास क्विज़</b>
        </div>
        
        {/* Star rating display */}
        <div className={styles.stars} aria-label={`${starCount} सितारे`}>
          {"★".repeat(starCount) + "☆".repeat(3 - starCount)}
        </div>
      </div>

      {/* Score and Meta info */}
      <div className={styles.quizCardBody}>
        {hasAttempted ? (
          <div className={styles.scoreRow}>
            <div className={styles.scorePill}>
              बेस्ट स्कोर: <span className="font-bold text-indigo-600 dark:text-indigo-400">{Math.round(bestPct)}%</span>
            </div>
            <div className={styles.scoreDetail}>
              पिछला परिणाम: {lastAttempt?.s}/{lastAttempt?.t} ({effectiveAttempts.length} प्रयास)
            </div>
          </div>
        ) : (
          <div className={styles.scorePrompt}>
            इस अध्याय के मुख्य बिंदुओं पर आधारित {questions.length} प्रश्न हल करें और अपनी समझ परखें।
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className={styles.quizCardRow}>
        <button
          type="button"
          className={styles.quizBtnPrimary}
          onClick={handleStartQuiz}
        >
          {hasAttempted ? "🔄 फिर से खेलें" : "🚀 क्विज़ शुरू करें"}
        </button>
        {hasAttempted && (
          <button
            type="button"
            className={styles.quizBtnSecondary}
            onClick={handleReset}
            title="स्कोर रीसेट करें"
          >
            रीसेट
          </button>
        )}
      </div>

      {/* Full-screen quiz overlay modal */}
      {isPlaying && (
        <div className={styles.overlay} role="dialog" aria-modal="true">
          <div className={styles.overlayContent}>
            {!isCompleted ? (
              <div>
                <div className={styles.overlayHeader}>
                  <div className={styles.qCounter}>
                    प्रश्न {currentQIndex + 1} / {shuffledQuiz.length}
                  </div>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={handleCloseOverlay}
                    aria-label="क्विज़ बंद करें"
                  >
                    ✕ बंद
                  </button>
                </div>

                {/* Progress bar */}
                <div className={styles.quizProgressBar}>
                  <div 
                    className={styles.quizProgressFill} 
                    style={{ width: `${((currentQIndex + 1) / shuffledQuiz.length) * 100}%` }}
                  />
                </div>

                <h2 className={styles.qQuestionText}>
                  {shuffledQuiz[currentQIndex]?.question}
                </h2>

                <div className={styles.qOptionsList}>
                  {shuffledQuiz[currentQIndex]?.options.map((opt, optIdx) => {
                    let optClass = styles.optionBtn;
                    if (isAnswered) {
                      if (opt.isCorrect) {
                        optClass += ` ${styles.optionOk}`;
                      } else if (optIdx === selectedOptionIndex) {
                        optClass += ` ${styles.optionNo}`;
                      }
                    }
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        className={optClass}
                        onClick={() => handleSelectOption(optIdx)}
                        disabled={isAnswered}
                      >
                        <span className={styles.optLetter}>{String.fromCharCode(65 + optIdx)}</span>
                        <span className="flex-1">{opt.text}</span>
                        {isAnswered && opt.isCorrect && <span className="ml-2 font-bold text-green-600">✓</span>}
                        {isAnswered && !opt.isCorrect && optIdx === selectedOptionIndex && <span className="ml-2 font-bold text-red-500">✗</span>}
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <div style={{ marginTop: "16px" }}>
                    <button
                      type="button"
                      className={styles.quizBtnPrimary}
                      onClick={handleNextQuestion}
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      {currentQIndex < shuffledQuiz.length - 1 ? "अगला प्रश्न →" : "नतीजा देखें 🏆"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div className={styles.bigScore}>
                  {score} / {shuffledQuiz.length}
                </div>
                
                {(() => {
                  const finalStars = calculateStars(score, shuffledQuiz.length);
                  return (
                    <>
                      <div className={styles.stars} style={{ fontSize: "36px", textAlign: "center", margin: "10px 0" }}>
                        {"★".repeat(finalStars) + "☆".repeat(3 - finalStars)}
                      </div>
                      <p style={{ textAlign: "center", fontSize: "16px", margin: "12px 0 24px", fontWeight: "600", color: "var(--tx)" }}>
                        {finalStars === 3
                          ? "🌟 शानदार प्रदर्शन! आप इस अध्याय में निपुण हो गए हैं!"
                          : finalStars >= 1
                          ? "👍 अच्छा प्रयास! थोड़ा और अभ्यास करें।"
                          : "📖 अध्याय दोबारा पढ़ें और फिर से कोशिश करें।"}
                      </p>
                    </>
                  );
                })()}

                <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className={styles.quizBtnPrimary}
                    onClick={handleStartQuiz}
                  >
                    🔄 फिर खेलें
                  </button>
                  <button
                    type="button"
                    className={styles.quizBtnSecondary}
                    onClick={handleCloseOverlay}
                  >
                    किताब पर लौटें
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
